import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { solvedProblem, userProfile } from "@/db/schema";

export interface ProgressSnapshot {
  solved: string[];
  streak: number;
  lastActiveDay: string | null;
  mode: "beginner" | "interview";
}

/** This user's server-side progress. Empty defaults for a first-time signer-in. */
export async function loadProgress(userId: string): Promise<ProgressSnapshot> {
  const [solvedRows, profileRows] = await Promise.all([
    db
      .select({ slug: solvedProblem.problemSlug })
      .from(solvedProblem)
      .where(eq(solvedProblem.userId, userId)),
    db.select().from(userProfile).where(eq(userProfile.userId, userId)).limit(1),
  ]);

  const profile = profileRows[0];
  return {
    solved: solvedRows.map((r) => r.slug),
    streak: profile?.streak ?? 0,
    lastActiveDay: profile?.lastActiveDay ?? null,
    mode: profile?.mode ?? "beginner",
  };
}

/**
 * Merge a client snapshot into the stored one and persist the result.
 *
 * Merge rules: solved is a union (a problem solved anywhere stays solved),
 * streak/lastActiveDay take the higher/later value, and mode takes the incoming
 * value — by the time the client pushes, it has already adopted the server's
 * mode, so an incoming change is a deliberate user choice.
 */
export async function mergeProgress(
  userId: string,
  incoming: ProgressSnapshot,
): Promise<ProgressSnapshot> {
  const stored = await loadProgress(userId);

  const merged: ProgressSnapshot = {
    solved: Array.from(new Set([...stored.solved, ...incoming.solved])),
    streak: Math.max(stored.streak, incoming.streak),
    // YYYY-MM-DD sorts lexicographically, so the max string is the later day.
    lastActiveDay:
      [stored.lastActiveDay, incoming.lastActiveDay].filter(Boolean).sort().pop() ?? null,
    mode: incoming.mode ?? stored.mode,
  };

  const newlySolved = merged.solved.filter((s) => !stored.solved.includes(s));
  if (newlySolved.length) {
    // The unique(user_id, problem_slug) constraint makes this idempotent.
    await db
      .insert(solvedProblem)
      .values(newlySolved.map((slug) => ({ userId, problemSlug: slug })))
      .onConflictDoNothing();
  }

  await db
    .insert(userProfile)
    .values({
      userId,
      streak: merged.streak,
      lastActiveDay: merged.lastActiveDay,
      mode: merged.mode,
    })
    .onConflictDoUpdate({
      target: userProfile.userId,
      set: {
        streak: merged.streak,
        lastActiveDay: merged.lastActiveDay,
        mode: merged.mode,
        updatedAt: new Date(),
      },
    });

  return merged;
}

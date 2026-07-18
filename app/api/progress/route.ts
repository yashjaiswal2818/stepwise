import { getCurrentUser } from "@/lib/dal";
import { loadProgress, mergeProgress, type ProgressSnapshot } from "@/lib/progress";

export const runtime = "nodejs";

/** Server-side progress for the signed-in user. `null` for anonymous — they keep
 *  using localStorage only, which is why the anonymous path needs no account. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ progress: null });
  try {
    return Response.json({ progress: await loadProgress(user.id) });
  } catch {
    return Response.json({ progress: null });
  }
}

/** Push a local snapshot; the server merges it with what's stored and returns the
 *  merged result, which the client adopts. */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ progress: null });

  let body: Partial<ProgressSnapshot>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const incoming: ProgressSnapshot = {
    solved: Array.isArray(body.solved) ? body.solved.filter((s) => typeof s === "string") : [],
    streak: Number.isInteger(body.streak) && body.streak! >= 0 ? body.streak! : 0,
    lastActiveDay: typeof body.lastActiveDay === "string" ? body.lastActiveDay : null,
    mode: body.mode === "interview" ? "interview" : "beginner",
  };

  try {
    return Response.json({ progress: await mergeProgress(user.id, incoming) });
  } catch {
    return Response.json({ progress: null }, { status: 500 });
  }
}

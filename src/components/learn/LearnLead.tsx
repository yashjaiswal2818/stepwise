"use client";

import Link from "next/link";
import { Play, Flame, ArrowRight } from "lucide-react";
import { PROBLEMS } from "@/curriculum/catalog";
import { BADGES } from "@/engagement/badges";
import { LESSONS } from "@/curriculum/lesson-catalog";
import { useProgress } from "@/engagement/useProgress";
import { useMounted } from "@/lib/useMounted";
import { pressFeedback } from "@/design-system/ui/interaction";
import { cn } from "@/lib/utils";

/** Where a brand-new learner should begin — the first Chapter. */
const FIRST_LESSON = LESSONS.arrays;

/**
 * The /learn lead: what replaced the static "Start anywhere" headline and the
 * flat five-badge list. It is derived per learner, so it changes as they do —
 * where to jump back in, how far they've come, and the one next thing to chase.
 *
 * Colour discipline holds: the only saturated thing here is the primary action,
 * which is ink-on-paper (`bg-accent`), not a brand hue. Progress is a neutral bar;
 * the streak is contrast, not colour; the "next badge" is words, not a tinted pill.
 */
export function LearnLead() {
  const solved = useProgress((s) => s.solved);
  const streak = useProgress((s) => s.streak);
  const lastVisited = useProgress((s) => s.lastVisited);
  const mounted = useMounted();

  const total = PROBLEMS.length;
  const explored = mounted ? PROBLEMS.filter((p) => solved.includes(p.slug)).length : 0;
  const pct = total ? Math.round((explored / total) * 100) : 0;
  const st = mounted ? streak : 0;

  // The next thing to try: first problem not yet explored, in curriculum order.
  const nextProblem = mounted ? PROBLEMS.find((p) => !solved.includes(p.slug)) : undefined;

  // The next badge to chase, and exactly how far away it is.
  const ctx = { solved: mounted ? solved.length : 0, streak: st };
  const nextBadge = mounted ? BADGES.find((b) => !b.earned(ctx)) : undefined;
  const remaining = nextBadge ? Math.max(0, nextBadge.progress(ctx).need - nextBadge.progress(ctx).have) : 0;

  return (
    <div className="flex flex-col gap-4 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-8">
      {/* Primary action — resume, or begin. */}
      <div className="min-w-0">
        {mounted && lastVisited ? (
          <>
            <p className="text-2xs font-medium text-fg-faint">Jump back in</p>
            <Link
              href={lastVisited.href}
              className={cn(
                "mt-1.5 inline-flex max-w-full items-center gap-2 rounded-lg bg-accent px-3.5 py-2 text-accent-fg",
                "transition-opacity duration-[var(--duration-fast)] hover:opacity-90",
                pressFeedback,
              )}
            >
              <Play className="size-4 shrink-0" aria-hidden />
              <span className="truncate text-md font-semibold">{lastVisited.title}</span>
            </Link>
            {nextProblem && (
              <Link
                href={`/problem/${nextProblem.slug}`}
                className="mt-2 inline-flex items-center gap-1 text-sm text-fg-muted transition-colors duration-[var(--duration-fast)] hover:text-fg"
              >
                Up next: <span className="font-medium text-fg">{nextProblem.title}</span>
                <ArrowRight className="size-3.5 shrink-0" aria-hidden />
              </Link>
            )}
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold tracking-tight text-fg text-balance sm:text-2xl">
              Start with the basics.
            </h1>
            <p className="mt-1 max-w-md text-sm leading-relaxed text-fg-muted">
              Learn each structure from the ground up, then follow the map wherever it pulls you.
            </p>
            {FIRST_LESSON && (
              <Link
                href={`/learn/${FIRST_LESSON.structure}`}
                className={cn(
                  "mt-3 inline-flex items-center gap-2 rounded-lg bg-accent px-3.5 py-2 text-md font-semibold text-accent-fg",
                  "transition-opacity duration-[var(--duration-fast)] hover:opacity-90",
                  pressFeedback,
                )}
              >
                <Play className="size-4 shrink-0" aria-hidden />
                Begin: {FIRST_LESSON.title}
              </Link>
            )}
          </>
        )}
      </div>

      {/* Progress — derived, never static. */}
      <div className="flex shrink-0 flex-col gap-2 sm:items-end">
        <div className="flex items-center gap-3">
          <span className="text-sm text-fg-muted">
            <span className="font-mono font-semibold text-fg">{explored}</span>
            <span className="text-fg-faint"> / {total}</span> explored
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1">
            <Flame className={cn("size-3.5 shrink-0", st > 0 ? "text-fg" : "text-fg-faint")} aria-hidden />
            <span className="font-mono text-sm font-semibold text-fg">{st}</span>
            <span className="sr-only">day streak</span>
          </span>
        </div>
        <div
          className="h-1.5 w-full min-w-44 overflow-hidden rounded-full bg-surface-3 sm:w-56"
          role="progressbar"
          aria-valuenow={explored}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-label={`${explored} of ${total} problems explored`}
        >
          <div
            className="h-full rounded-full bg-fg transition-[width] duration-[var(--duration-slow)] ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        {nextBadge ? (
          <p className="text-xs text-fg-muted">
            <span className="font-mono font-semibold text-fg">{remaining}</span> more to earn{" "}
            <span className="font-medium text-fg">{nextBadge.label}</span>
          </p>
        ) : (
          mounted && <p className="text-xs text-fg-muted">Every badge earned. Nicely done.</p>
        )}
      </div>
    </div>
  );
}

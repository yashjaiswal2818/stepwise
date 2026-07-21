"use client";

import Link from "next/link";
import { Play, ArrowRight } from "lucide-react";
import { PROBLEMS } from "@/curriculum/catalog";
import { LESSONS } from "@/curriculum/lesson-catalog";
import { frontierProblem } from "@/curriculum/learn-order";
import { useProgress } from "@/engagement/useProgress";
import { useMounted } from "@/lib/useMounted";
import { buttonVariants } from "@/design-system/ui/Button";
import { cn } from "@/lib/utils";

/** Where a brand-new learner begins — the first (and today only) chapter. */
const FIRST_LESSON = LESSONS.arrays;

/**
 * The lead for The Index. Deliberately lean: it carries exactly two jobs —
 * resume/begin (one primary ink-on-paper control) and one honest count. No streak
 * (the navbar already shows it), and no progress bar (the spine IS the bar).
 *
 * Pre-mount and first-visit render the same honest surface — a catalog fact, never
 * a false "0 / 16" — so a returning learner watches their data fill in and a new
 * one simply sees where to begin.
 */
export function LearnLead() {
  const solved = useProgress((s) => s.solved);
  const lastVisited = useProgress((s) => s.lastVisited);
  const mounted = useMounted();

  const total = PROBLEMS.length;
  const explored = mounted ? PROBLEMS.filter((p) => solved.includes(p.slug)).length : 0;
  const nextProblem = mounted ? frontierProblem(solved) : undefined;

  return (
    <div className="pb-6 pt-8">
      {mounted && lastVisited ? (
        <>
          <p className="text-sm text-fg-muted">Continue</p>
          <Link
            href={lastVisited.href}
            className={cn(buttonVariants({ variant: "primary", size: "md" }), "mt-1.5 w-full sm:w-auto")}
          >
            <Play className="size-4 shrink-0" aria-hidden />
            <span className="truncate">{lastVisited.title}</span>
          </Link>
          {nextProblem && (
            <Link
              href={`/problem/${nextProblem.slug}`}
              className="mt-3 inline-flex items-center gap-1.5 text-sm text-fg-muted transition-colors duration-[var(--duration-fast)] ease-out hover:text-fg"
            >
              Up next: <span className="font-medium text-fg">{nextProblem.title}</span>
              <ArrowRight className="size-3.5 shrink-0" aria-hidden />
            </Link>
          )}
        </>
      ) : (
        <>
          <h2 className="text-balance text-lg font-semibold text-fg">Start with the basics.</h2>
          <p className="mt-1 max-w-md text-md leading-relaxed text-fg-muted">
            Eight structures, in a suggested order. Open any one.
          </p>
          {FIRST_LESSON && (
            <Link
              href={`/learn/${FIRST_LESSON.structure}`}
              className={cn(buttonVariants({ variant: "primary", size: "md" }), "mt-4 w-full sm:w-auto")}
            >
              <Play className="size-4 shrink-0" aria-hidden />
              Begin: {FIRST_LESSON.title}
            </Link>
          )}
        </>
      )}

      <p className="mt-4 text-sm text-fg-muted">
        {mounted ? (
          <>
            <span className="font-mono text-fg">{explored}</span>
            <span> / {total} explored</span>
          </>
        ) : (
          <>
            <span className="font-mono text-fg">{total}</span> problems across 8 structures
          </>
        )}
      </p>
    </div>
  );
}

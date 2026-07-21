"use client";

import { useEffect, useRef, useState } from "react";
import { LearnLead } from "./LearnLead";
import { LearnSection } from "./LearnSection";
import { ContinuePill } from "./ContinuePill";
import { STRUCTURES } from "@/curriculum/structures";
import { PROBLEMS } from "@/curriculum/catalog";
import { BADGES } from "@/engagement/badges";
import { getLessonMeta } from "@/curriculum/lesson-catalog";
import {
  LEARN_ORDER,
  problemsIn,
  sectionProgress,
  frontierProblem,
  frontierSection,
} from "@/curriculum/learn-order";
import { useProgress } from "@/engagement/useProgress";
import { useMounted } from "@/lib/useMounted";

const TITLE: Record<string, string> = Object.fromEntries(STRUCTURES.map((s) => [s.slug, s.title]));

/**
 * The Index — /learn as an achromatic reading instrument. One vertical spine
 * through the eight structures in a suggested order; the spine's ink IS your
 * progress; every section is collapsed to one line except the one you're on. No
 * colour anywhere, so chroma stays reserved entirely for a running algorithm.
 */
export function LearnThroughline() {
  const solved = useProgress((s) => s.solved);
  const streak = useProgress((s) => s.streak);
  const lastVisited = useProgress((s) => s.lastVisited);
  const mounted = useMounted();

  const solvedSet = new Set(mounted ? solved : []);
  const total = PROBLEMS.length;
  const explored = mounted ? PROBLEMS.filter((p) => solvedSet.has(p.slug)).length : 0;
  const frontierSlug = mounted ? frontierProblem(solved)?.slug ?? null : null;
  const frontierSec = mounted ? frontierSection(solved, lastVisited) : null;

  // Default-open is the frontier section; a toggle records an override.
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const isOpen = (slug: string) => overrides[slug] ?? slug === frontierSec;
  const toggle = (slug: string) => setOverrides((o) => ({ ...o, [slug]: !isOpen(slug) }));

  // The ink advances only when your progress actually increased since the last
  // /learn view — a plain reload never re-fills from zero (a banned load flourish).
  const [inkPct, setInkPct] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (!mounted) return;
    const current = total ? (explored / total) * 100 : 0;
    const reduce =
      typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let stored = 0;
    try {
      stored = parseFloat(sessionStorage.getItem("stepwise-learn-ink") ?? "0") || 0;
    } catch {}
    if (!started.current && !reduce && stored < current) {
      setInkPct(stored);
      requestAnimationFrame(() => setInkPct(current));
    } else {
      setInkPct(current);
    }
    started.current = true;
    try {
      sessionStorage.setItem("stepwise-learn-ink", String(current));
    } catch {}
  }, [mounted, explored, total]);

  // The terminus is the one place a badge appears.
  const ctx = { solved: mounted ? solved.length : 0, streak: mounted ? streak : 0 };
  const nextBadge = mounted ? BADGES.find((b) => !b.earned(ctx)) : undefined;
  const remaining = nextBadge ? Math.max(0, nextBadge.progress(ctx).need - nextBadge.progress(ctx).have) : 0;
  const allSolved = mounted && total > 0 && explored === total;

  const leadRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <div ref={leadRef}>
        <LearnLead />
      </div>

      <ol className="relative pb-16 pt-2">
        {/* The spine: a faint track, and the ink that is literally your progress. */}
        <span className="pointer-events-none absolute inset-y-0 left-3 w-0.5 -translate-x-1/2 bg-line" aria-hidden />
        <span
          className="pointer-events-none absolute left-3 top-0 w-0.5 -translate-x-1/2 bg-fg transition-[height] duration-[var(--duration-slow)] ease-out"
          style={{ height: `${inkPct}%` }}
          aria-hidden
        />

        {LEARN_ORDER.map((slug) => {
          const { done, total: t } = sectionProgress(slug, solved);
          return (
            <LearnSection
              key={slug}
              slug={slug}
              title={TITLE[slug]}
              problems={problemsIn(slug)}
              done={done}
              total={t}
              isFrontier={mounted && slug === frontierSec}
              frontierSlug={frontierSlug}
              solvedSet={solvedSet}
              open={isOpen(slug)}
              onToggle={() => toggle(slug)}
              lessonMeta={getLessonMeta(slug)}
              mounted={mounted}
            />
          );
        })}

        {/* Terminus — the spine ends in a node beside the one forward pull (next badge). */}
        <li className="relative mt-1 grid grid-cols-[24px_1fr] items-center gap-2">
          <span className="grid place-items-center" aria-hidden>
            <span
              className={
                allSolved
                  ? "size-4 rounded-full bg-fg ring-2 ring-base"
                  : "size-4 rounded-full border-2 border-fg-faint bg-base"
              }
            />
          </span>
          <span className="flex min-h-11 items-center text-sm text-fg-muted">
            {allSolved ? (
              "Every structure explored."
            ) : nextBadge ? (
              <>
                <span className="font-mono text-fg">{remaining}</span> more to earn{" "}
                <span className="font-medium text-fg">{nextBadge.label}</span>
              </>
            ) : null}
          </span>
        </li>
      </ol>

      {mounted && lastVisited && <ContinuePill href={lastVisited.href} sentinelRef={leadRef} />}
    </>
  );
}

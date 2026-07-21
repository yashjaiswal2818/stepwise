"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { MotionConfig, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Pause, Play } from "lucide-react";
import type { Trace } from "@/engine/types";
import { ArrayView } from "@/engine/canvas/renderers/ArrayView";
import { SPRING } from "@/engine/canvas/motion";
import { tokenizeLines, type TokenClass } from "@/engine/code/highlight";
import { interactive } from "@/design-system/ui/interaction";
import { cn } from "@/lib/utils";

/**
 * The landing-page demo. This is the real engine: a real `Trace` built by the
 * real tracer, drawn by the real `ArrayView`, with the real source and the real
 * narration. Nothing here is a mock — every number on screen is read off the
 * trace, and the code highlight moves because `step.codeLines` moves.
 *
 * WHY LOCAL STATE INSTEAD OF THE PLAYER STORE
 * `usePlayer` is a module-level Zustand singleton with a single `index`, and
 * `VisualizationCanvas` takes no props — it reads that singleton. Driving it
 * from here would mean the landing page owning the store the workspace owns:
 * an autoplaying loop writing `index`/`isPlaying` on every tick, left behind on
 * client-side navigation to /problem/[slug], and unable to host a second
 * preview without the two fighting over one index. The store also stops at the
 * last step by design (`next()` clears `isPlaying`), so looping would mean
 * extra writes into shared state. So the hero keeps its own index and renders
 * the renderer directly from `trace.steps[i].scene`.
 */

/** Steps per second — the workspace player's default, so the landing page runs
 *  the algorithm at exactly the pace the product does. */
const STEPS_PER_SECOND = 1.5;
const STEP_MS = 1000 / STEPS_PER_SECOND;
/** A beat held on the final frame so "sorted" registers before the run loops. */
const HOLD_MS = 1600;

/* Mirrors the token map in engine/code/CodePanel.tsx — the same `--code-*`
   variables, so the preview and the workspace panel highlight identically. */
const COL: Record<TokenClass, string> = {
  kw: "var(--code-kw)",
  fn: "var(--code-fn)",
  num: "var(--code-num)",
  str: "var(--code-str)",
  com: "var(--code-com)",
  punct: "var(--code-punct)",
  var: "var(--code-var)",
  ws: "inherit",
};

/**
 * The frame shown to a visitor who prefers reduced motion. Derived, not picked:
 * the last swap in the run is the most informative single frame in the trace —
 * two cells mid-move, a sorted tail already locked in, untouched cells ahead of
 * it, and the `j` pointer. Four states at once, so the encoding still teaches
 * something without a single pixel moving.
 */
function stillFrameIndex(trace: Trace): number {
  for (let i = trace.steps.length - 1; i >= 0; i--) {
    if (trace.steps[i].op === "swap") return i;
  }
  return Math.max(0, Math.floor((trace.steps.length - 1) / 2));
}

export function HeroPreview({ trace }: { trace: Trace }) {
  const reduced = useReducedMotion() ?? false;
  const total = trace.steps.length;
  const lastIndex = Math.max(total - 1, 0);
  const still = useMemo(() => stillFrameIndex(trace), [trace]);

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [onScreen, setOnScreen] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);

  // Pause while scrolled out of view — a demo nobody is looking at should not
  // be spending frames.
  useEffect(() => {
    const el = frameRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setOnScreen(true);
      return;
    }
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), {
      threshold: 0.2,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const running = playing && onScreen && !reduced;

  useEffect(() => {
    if (!running) return;
    const id = window.setTimeout(
      () => setIndex((i) => (i >= lastIndex ? 0 : i + 1)),
      index >= lastIndex ? HOLD_MS : STEP_MS,
    );
    return () => window.clearTimeout(id);
  }, [running, index, lastIndex]);

  // Which frame is on screen. Reduced motion parks on the meaningful frame
  // rather than frame 0, the one frame in the trace where nothing has happened
  // yet — derived during render, so there is no state to keep in sync.
  const shown = reduced ? still : index;
  const step = trace.steps[shown];
  const scene = step.scene;

  // Everything below is read off the trace. No literals.
  const digits = String(total).length;
  const counter = `${String(shown + 1).padStart(digits, "0")} / ${total}`;
  const progress = lastIndex > 0 ? (shown / lastIndex) * 100 : 0;
  const watch = Object.entries(step.vars ?? {})
    .map(([k, v]) => `${k} ${v}`)
    .join("  ·  ");

  const codeLines = useMemo(() => tokenizeLines(trace.code, "js"), [trace.code]);
  const activeLines = new Set(step.codeLines);
  const cursorLine = step.codeLines.length ? Math.min(...step.codeLines) : -1;

  return (
    <div>
      {/* --radius-2xl is reserved for the hero frame. Elevation is the hairline
          plus the inset highlight — this panel sits on the page, it does not
          float above it, so it gets --lift and not a drop shadow. */}
      <div
        ref={frameRef}
        className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--lift)]"
      >
        <div className="flex items-center gap-3 border-b border-line bg-surface-2 px-4 py-2.5">
          <h2 className="text-sm font-medium text-fg">{trace.title}</h2>
          <span className="hidden font-mono text-2xs text-fg-faint sm:inline">
            {trace.exampleId}.{trace.language}
          </span>
          <span className="ml-auto shrink-0 font-mono text-2xs text-fg-muted">
            <span className="text-fg-faint">step</span> {counter}
          </span>
        </div>

        {/* One image-like unit: no interactive descendants, one stable label, so
            assistive tech is not read a new narration twice a second. The
            narration and controls live outside it. */}
        <div
          role="img"
          aria-label={`Live visualization of ${trace.title}, running one step at a time.`}
          className="grid md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]"
        >
          <div className="hidden overflow-x-auto border-r border-line bg-elevated py-3 md:block">
            {codeLines.map((tokens, i) => {
              const n = i + 1;
              const on = activeLines.has(n);
              const cursor = "absolute inset-y-0 left-0 w-0.5 bg-accent";
              return (
                <div
                  key={n}
                  className={cn("relative flex gap-3 px-3 font-mono text-xs", on && "bg-surface-3")}
                >
                  {n === cursorLine &&
                    (reduced ? (
                      <span className={cursor} />
                    ) : (
                      <motion.span layoutId="hero-code-cursor" transition={SPRING} className={cursor} />
                    ))}
                  <span className="w-4 shrink-0 select-none text-right text-fg-faint">{n}</span>
                  <code className="whitespace-pre">
                    {tokens.map((t, j) => (
                      <span key={j} style={{ color: COL[t.cls] }}>
                        {t.text}
                      </span>
                    ))}
                  </code>
                </div>
              );
            })}
          </div>

          <div className="bg-base p-4">
            <div className="h-44 w-full sm:h-48">
              {scene.kind === "array" && (
                <MotionConfig transition={SPRING} reducedMotion="user">
                  <ArrayView scene={scene} />
                </MotionConfig>
              )}
            </div>
          </div>
        </div>

        <p className="flex min-h-14 items-center gap-2 border-t border-line px-4 py-2.5 font-mono text-sm text-fg">
          <span aria-hidden="true" className="shrink-0 text-fg-faint">
            →
          </span>
          {step.narration}
        </p>

        <div className="flex items-center gap-3 border-t border-line bg-surface px-4 py-2.5">
          {!reduced && (
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? `Pause ${trace.title}` : `Play ${trace.title}`}
              /* Circular like the workspace's transport button, so it reads as
                 the same control. Focus / press / disabled come from the shared
                 interaction primitive rather than being re-invented here. */
              className={cn(
                "grid size-8 shrink-0 cursor-pointer place-items-center rounded-full",
                "bg-accent text-accent-fg shadow-[var(--lift-hi)] hover:scale-105",
                interactive,
              )}
            >
              {playing ? (
                <Pause className="size-3.5 fill-current" />
              ) : (
                <Play className="size-3.5 translate-x-px fill-current" />
              )}
            </button>
          )}
          <div
            role="progressbar"
            aria-label={`${trace.title} run position`}
            aria-valuemin={1}
            aria-valuemax={total}
            aria-valuenow={shown + 1}
            className="relative h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-3"
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-accent transition-[width] duration-[var(--duration-step)] ease-step"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="shrink-0 font-mono text-2xs text-fg-muted">{watch}</span>
        </div>
      </div>

      <p className="mt-3 text-sm text-fg-muted">
        <Link
          href={`/problem/${trace.exampleId}`}
          className="group inline-flex items-center gap-1.5 font-medium text-fg-muted transition-colors duration-[var(--duration-fast)] hover:text-fg"
        >
          Take the controls — scrub, step back, change the input
          <ArrowUpRight className="size-3.5 transition-transform duration-[var(--duration-fast)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      </p>
    </div>
  );
}

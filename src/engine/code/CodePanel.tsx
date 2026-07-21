"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { motion } from "motion/react";
import { usePlayer } from "../player/store";
import { tokenizeLines, type TokenClass } from "./highlight";
import type { Lang } from "@/engine/types";
import { focusRing, pressFeedback } from "@/design-system/ui/interaction";
import { cn } from "@/lib/utils";

const EMPTY: number[] = [];

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

const LABEL: Record<Lang, string> = { js: "JS", py: "Python", c: "C" };

/* The persisted language never changes underneath us — it is only ever written
   by `pick`, which also updates React state. */
const neverChanges = () => () => {};

function readPersistedLang(): Lang {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("lang") as Lang | null;
    const saved = fromUrl ?? (localStorage.getItem("stepwise-lang") as Lang | null);
    if (saved === "js" || saved === "py" || saved === "c") return saved;
  } catch {}
  return "js";
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function CodePanel() {
  const trace = usePlayer((s) => s.trace);
  const activeJs = usePlayer((s) => s.trace?.steps[s.index]?.codeLines ?? EMPTY);

  // The persisted choice (?lang= or localStorage) is read as an external store
  // so SSR renders "js" and the client resolves the real value during
  // hydration — no setState-in-effect, no cascading render.
  const persisted = useSyncExternalStore(neverChanges, readPersistedLang, () => "js" as Lang);
  const [picked, setPicked] = useState<Lang | null>(null);
  const lang = picked ?? persisted;

  const available: Lang[] = ["js"];
  if (trace?.sources?.py) available.push("py");
  if (trace?.sources?.c) available.push("c");
  const activeLang = available.includes(lang) ? lang : "js";

  const code =
    activeLang === "js" ? trace?.code ?? "" : trace?.sources?.[activeLang]?.code ?? trace?.code ?? "";
  const lines = useMemo(() => tokenizeLines(code, activeLang), [code, activeLang]);

  // Lessons only: the source is a transcript of code being written, and each step
  // says how much of it exists yet. Show only that prefix so a beginner watches
  // the program appear line by line. Problem traces have no `linesWritten`, so
  // `shown === lines` and nothing about their rendering changes.
  const written = usePlayer((s) => s.trace?.steps[s.index]?.linesWritten);
  const shown = written == null ? lines : lines.slice(0, written);

  const active =
    activeLang === "js"
      ? activeJs
      : activeJs
          .map((n) => trace?.sources?.[activeLang]?.map[n])
          .filter((x): x is number => x != null);
  const activeSet = new Set(active);
  const firstActive = active.length ? Math.min(...active) : -1;

  const scrollerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const lastCodeRef = useRef<string | null>(null);

  /**
   * Keep the active line in view.
   *
   * Without this the `layoutId="code-cursor"` marker animates to a line that is
   * off-screen on any algorithm taller than the pane — the learner watches the
   * narration advance against a frozen block of code, which is the single most
   * confusing thing the workspace can do.
   *
   * Two rules keep it from becoming its own annoyance:
   *   1. Do nothing when the line is already comfortably visible. Re-centering on
   *      every step, even by a few pixels, turns a tight loop into a shuddering
   *      pane. "Comfortable" means a couple of lines of context on either side.
   *   2. The comfort band is clamped to the pane. In a very short pane the
   *      unclamped band would be impossible to satisfy, so the early-out would
   *      never fire and every step would scroll — exactly the jitter rule 1 exists
   *      to prevent.
   */
  const syncScroll = useCallback((behavior: ScrollBehavior) => {
    const scroller = scrollerRef.current;
    const line = activeLineRef.current;
    if (!scroller || !line) return;

    const view = scroller.clientHeight;
    // Zero height means the pane is display:none (the mobile tab switcher). Any
    // measurement now is meaningless; the ResizeObserver re-runs this on reveal.
    if (view === 0) return;

    const lineH = line.offsetHeight;
    const top = line.offsetTop;
    const pad = Math.min(lineH * 2.5, Math.max(0, (view - lineH) / 2 - 1));

    if (top >= scroller.scrollTop + pad && top + lineH <= scroller.scrollTop + view - pad) return;

    const target = Math.min(
      Math.max(0, scroller.scrollHeight - view),
      Math.max(0, top - (view - lineH) / 2),
    );
    if (Math.abs(target - scroller.scrollTop) < 1) return;
    scroller.scrollTo({ top: target, behavior });
  }, []);

  useEffect(() => {
    // A new algorithm or a language switch is a jump, not a step — snap instead of
    // gliding through code the learner never chose to read.
    const codeChanged = lastCodeRef.current !== code;
    lastCodeRef.current = code;
    syncScroll(codeChanged || prefersReducedMotion() ? "auto" : "smooth");
  }, [firstActive, code, syncScroll]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || typeof ResizeObserver === "undefined") return;
    // Re-check when the pane is revealed (mobile tab) or resized (splitter drag).
    const ro = new ResizeObserver(() => syncScroll("auto"));
    ro.observe(scroller);
    return () => ro.disconnect();
  }, [syncScroll]);

  function pick(l: Lang) {
    setPicked(l);
    try {
      localStorage.setItem("stepwise-lang", l);
    } catch {}
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-line bg-elevated">
      {available.length > 1 && (
        <div className="flex shrink-0 items-center gap-1 border-b border-line px-2 py-1.5">
          {available.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => pick(l)}
              aria-pressed={activeLang === l}
              className={cn(
                "rounded-sm px-2 py-0.5 text-2xs font-medium",
                pressFeedback,
                focusRing,
                activeLang === l
                  ? "bg-surface-3 text-fg"
                  : "text-fg-muted hover:bg-surface-2 hover:text-fg active:bg-surface-3",
              )}
            >
              {LABEL[l]}
            </button>
          ))}
        </div>
      )}
      <div
        ref={scrollerRef}
        className="relative min-h-0 flex-1 overflow-auto py-2.5 font-mono text-sm leading-[1.75]"
      >
        {shown.map((toks, idx) => {
          const n = idx + 1;
          const on = activeSet.has(n);
          return (
            <div
              key={idx}
              ref={n === firstActive ? activeLineRef : undefined}
              // `min-w-max` so the active-line band spans the full scrollable
              // width instead of stopping at the pane edge on a long line.
              className={cn("relative flex min-w-max gap-3 px-3", on && "bg-surface-3")}
            >
              {n === firstActive && (
                <motion.span
                  layoutId="code-cursor"
                  className="absolute inset-y-0 left-0 w-[2px] bg-accent"
                  transition={{ type: "spring", stiffness: 600, damping: 44 }}
                />
              )}
              <span className="w-6 shrink-0 select-none text-right text-fg-muted">{n}</span>
              <code className="whitespace-pre">
                {toks.map((t, j) => (
                  <span key={j} style={{ color: COL[t.cls] }}>
                    {t.text}
                  </span>
                ))}
              </code>
            </div>
          );
        })}
      </div>
    </div>
  );
}

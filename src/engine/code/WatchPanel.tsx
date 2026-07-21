"use client";

import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { usePlayer } from "../player/store";
import { cn } from "@/lib/utils";

/** Beyond this many characters the before → after pair stops fitting on one chip. */
const PAIR_MAX = 10;

const fmt = (v: string | number) => {
  const s = String(v);
  return s === "" ? '""' : s;
};

/**
 * Scalar watch values for the current step (i, j, low, high, sum…).
 *
 * The variables are what a learner actually tracks from step to step, so this
 * panel has one job beyond listing them: making it obvious WHICH ONE just moved.
 * Three things carry that, and none of them is color — chroma in this product
 * means algorithm state, and a variable changing is not a state:
 *
 *   - structure — a changed chip shows `before → after`, an unchanged one shows a
 *     bare value, so the difference is legible at a glance and survives grayscale,
 *     low vision, and every color-vision deficiency;
 *   - elevation + border weight — surface-3 with a strong edge against surface-2
 *     with a hairline, which is this system's standard "active" signal;
 *   - weight — the new value is set semibold.
 *
 * Ordering is first-appearance order across the WHOLE trace rather than the key
 * order of the current step. A tracer that emits keys in a different order on some
 * steps, or a variable that only exists inside a loop, would otherwise reshuffle
 * the row underneath the learner mid-scrub — the one thing a watch panel must
 * never do, since it forces a re-read of every chip on every step.
 */
export function WatchPanel() {
  const trace = usePlayer((s) => s.trace);
  const index = usePlayer((s) => s.index);

  const order = useMemo(() => {
    const seen = new Map<string, number>();
    for (const step of trace?.steps ?? []) {
      for (const k of Object.keys(step.vars ?? {})) if (!seen.has(k)) seen.set(k, seen.size);
    }
    return seen;
  }, [trace]);

  const vars = trace?.steps[index]?.vars;

  /**
   * Compare against the last step that actually HAD variables, not against
   * `index - 1`.
   *
   * Tracers emit `vars` intermittently — two-sum, for example, runs
   * `{need:12} → (none) → {need:14}`, because the steps in between are about the
   * array rather than the lookup. Anchoring to `index - 1` would land on the empty
   * step, find nothing to diff, and quietly show `need: 14` unhighlighted: the one
   * step where the value moved is the one step we would fail to mark.
   *
   * Reading back to the last populated step asks the question the learner is
   * actually asking — "what is different since I last saw these?" — and it still
   * yields `undefined` at the start of a trace, so nothing lights up on load.
   *
   * The scan is worst-case O(steps), but only over steps with no vars, and traces
   * here run to tens of steps rather than thousands.
   */
  const prev = useMemo(() => {
    const steps = trace?.steps;
    if (!steps) return undefined;
    for (let i = index - 1; i >= 0; i--) {
      const v = steps[i]?.vars;
      if (v && Object.keys(v).length > 0) return v;
    }
    return undefined;
  }, [trace, index]);

  const keys = useMemo(
    () =>
      vars
        ? Object.keys(vars).sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0))
        : [],
    [vars, order],
  );

  if (!vars || !keys.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-line px-4 py-2.5">
      <span className="shrink-0 text-2xs font-medium text-fg-faint">Variables</span>
      <dl className="flex flex-wrap items-center gap-1.5">
        {keys.map((k) => {
          const now = fmt(vars[k]);
          const before = prev && k in prev ? fmt(prev[k]) : null;
          // A key that was absent last step has just come into scope — also a change.
          const changed = prev === undefined ? false : before === null ? true : before !== now;
          const showPair =
            changed && before !== null && before.length <= PAIR_MAX && now.length <= PAIR_MAX;

          return (
            <div
              key={k}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 transition-colors duration-[var(--duration-base)] ease-out",
                changed
                  ? "border-line-strong bg-surface-3 shadow-[var(--lift)]"
                  : "border-line bg-surface-2",
              )}
            >
              <dt className="font-mono text-2xs text-fg-muted">{k}</dt>
              <dd className="flex items-center gap-1 font-mono text-xs">
                {showPair && (
                  <>
                    <span className="text-fg-muted">{before}</span>
                    <ArrowRight aria-hidden="true" className="size-3 shrink-0 text-fg-faint" />
                  </>
                )}
                <span className={cn("text-fg", changed && "font-semibold")}>{now}</span>
                {changed && (
                  <span className="sr-only">
                    {before === null ? " (new this step)" : ` (changed from ${before})`}
                  </span>
                )}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}

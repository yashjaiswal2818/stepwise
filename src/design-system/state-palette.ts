import type { ElementState } from "@/engine/types";

/**
 * The state-encoding palette — the human-facing metadata for each algorithm
 * state. The `ElementState` union itself lives in the engine contract
 * (`@/engine/types`); this maps each value to its color + legend copy. SVG
 * fills, the legend, and code overlays all read from here, so there is exactly
 * one place that defines "what amber means".
 *
 * Each `cssVar` points at a `--state-*` custom property in globals.css, so
 * colors re-theme (dark/light) for free.
 */
export const STATE_META: Record<
  ElementState,
  { label: string; cssVar: string; description: string }
> = {
  default:  { label: "Idle",      cssVar: "var(--state-default)",  description: "Untouched element" },
  active:   { label: "Active",    cssVar: "var(--state-active)",   description: "Currently examined" },
  compare:  { label: "Comparing", cssVar: "var(--state-compare)",  description: "Being compared against the active element" },
  swap:     { label: "Swapping",  cssVar: "var(--state-swap)",     description: "Moving to a new position" },
  visited:  { label: "Visited",   cssVar: "var(--state-visited)",  description: "Already explored / processed" },
  frontier: { label: "Frontier",  cssVar: "var(--state-frontier)", description: "Queued to be explored next" },
  path:     { label: "Path",      cssVar: "var(--state-path)",     description: "On the chosen path or detected cycle" },
  final:    { label: "Done",      cssVar: "var(--state-final)",    description: "Sorted / locked in / final answer" },
};

export type { ElementState };

/** Stable ordering used by the legend. */
export const STATE_KEYS = Object.keys(STATE_META) as ElementState[];

/** CSS value for a given state, e.g. `stateColor("active") -> "var(--state-active)"`. */
export function stateColor(state: ElementState): string {
  return STATE_META[state].cssVar;
}

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

/**
 * The algorithm-state FILL for a shape on the canvas. Use this, not
 * `stateColor()`, anywhere a value is drawn *inside* the shape.
 *
 * Dark theme keeps the saturated color — `--state-fill-mix` is 100%, so the mix
 * collapses to the color itself. Light theme resolves to a 16% tint of the
 * surface, because a saturated fill there blows out and `--state-ink` stops
 * being legible on top of it (five of the seven states fall below 4.5:1, the
 * worst at 1.75:1). The stroke and the label carry the hue instead.
 *
 * `.state-fill` in globals.css does this for HTML via `background-color`, which
 * an SVG shape ignores — `fill` is a different property. This is the canvas
 * equivalent, so both layers stay in sync with one `--state-fill-mix`.
 */
export function stateFill(state: ElementState): string {
  return `color-mix(in oklab, ${stateColor(state)} var(--state-fill-mix), var(--surface))`;
}

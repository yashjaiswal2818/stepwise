import type { Transition } from "motion/react";

/* Motion tokens, mirrored from the CSS custom properties in app/globals.css.
   Motion's JS API cannot read a CSS var, so these are the one place the numbers
   are duplicated — keep them in sync with --ease-* / --duration-* there. */

/** --ease-out: cubic-bezier(0.16, 1, 0.30, 1) */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
/** --ease-step: cubic-bezier(0.33, 1, 0.68, 1) */
export const EASE_STEP = [0.33, 1, 0.68, 1] as const;

/** Seconds, to match Motion's unit. Mirrors --duration-*. */
export const DUR = { fast: 0.12, base: 0.2, step: 0.32, slow: 0.46 } as const;

/** Position slides (swaps, node moves) — a crisp spring reads as physical motion. */
export const SPRING: Transition = { type: "spring", stiffness: 520, damping: 42, mass: 0.9 };

/** Softer spring for larger travel (list reversal, tree relayout). */
export const SPRING_SOFT: Transition = { type: "spring", stiffness: 280, damping: 30 };

/** Enter/exit fades. */
export const POP: Transition = { duration: DUR.step, ease: EASE_OUT };

/** Bouncy little pop for state-change micro-interactions (a cell lifting when examined). */
export const POP_SPRING: Transition = { type: "spring", stiffness: 460, damping: 17 };

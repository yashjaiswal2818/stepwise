import type { Transition } from "motion/react";

/** Position slides (swaps, node moves) — a crisp spring reads as physical motion. */
export const SPRING: Transition = { type: "spring", stiffness: 520, damping: 42, mass: 0.9 };

/** Softer spring for larger travel (list reversal, tree relayout). */
export const SPRING_SOFT: Transition = { type: "spring", stiffness: 280, damping: 30 };

/** Enter/exit fades. */
export const POP: Transition = { duration: 0.28, ease: [0.22, 1, 0.36, 1] };

/** Bouncy little pop for state-change micro-interactions (a cell lifting when examined). */
export const POP_SPRING: Transition = { type: "spring", stiffness: 460, damping: 17 };

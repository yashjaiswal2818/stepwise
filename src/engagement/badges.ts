import { PROBLEMS } from "@/curriculum/catalog";

export interface BadgeCtx {
  solved: number;
  streak: number;
}

export interface Badge {
  id: string;
  label: string;
  desc: string;
  earned: (ctx: BadgeCtx) => boolean;
  /** Current value and the target that earns it — lets the lead draw a real
   *  progress bar toward the next badge instead of restating a static list. */
  progress: (ctx: BadgeCtx) => { have: number; need: number };
}

export const BADGES: Badge[] = [
  { id: "first", label: "First Steps", desc: "Solve your first problem", earned: ({ solved }) => solved >= 1, progress: ({ solved }) => ({ have: solved, need: 1 }) },
  { id: "warming", label: "Warming Up", desc: "Solve 5 problems", earned: ({ solved }) => solved >= 5, progress: ({ solved }) => ({ have: solved, need: 5 }) },
  { id: "streak3", label: "Consistent", desc: "Reach a 3-day streak", earned: ({ streak }) => streak >= 3, progress: ({ streak }) => ({ have: streak, need: 3 }) },
  { id: "roll", label: "On a Roll", desc: "Solve 10 problems", earned: ({ solved }) => solved >= 10, progress: ({ solved }) => ({ have: solved, need: 10 }) },
  // Derived, not hardcoded: a literal here silently stops being earnable the
  // moment problem #17 lands.
  { id: "complete", label: "Completionist", desc: "Solve every problem", earned: ({ solved }) => solved >= PROBLEMS.length, progress: ({ solved }) => ({ have: solved, need: PROBLEMS.length }) },
];

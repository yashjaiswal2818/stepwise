export interface Badge {
  id: string;
  label: string;
  desc: string;
  earned: (ctx: { solved: number; streak: number }) => boolean;
}

export const BADGES: Badge[] = [
  { id: "first", label: "First Steps", desc: "Solve your first problem", earned: ({ solved }) => solved >= 1 },
  { id: "warming", label: "Warming Up", desc: "Solve 5 problems", earned: ({ solved }) => solved >= 5 },
  { id: "streak3", label: "Consistent", desc: "Reach a 3-day streak", earned: ({ streak }) => streak >= 3 },
  { id: "roll", label: "On a Roll", desc: "Solve 10 problems", earned: ({ solved }) => solved >= 10 },
  { id: "complete", label: "Completionist", desc: "Solve every problem", earned: ({ solved }) => solved >= 16 },
];

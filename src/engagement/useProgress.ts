import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Mode = "beginner" | "interview";

interface ProgressState {
  solved: string[];
  lastActive: string | null; // YYYY-MM-DD
  streak: number;
  mode: Mode;
  markSolved: (slug: string) => void;
  registerActivity: () => void;
  setMode: (m: Mode) => void;
  reset: () => void;
}

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      solved: [],
      lastActive: null,
      streak: 0,
      mode: "beginner",

      markSolved: (slug) =>
        set((s) => (s.solved.includes(slug) ? s : { solved: [...s.solved, slug] })),

      registerActivity: () =>
        set((s) => {
          const today = dayKey(new Date());
          if (s.lastActive === today) return s;
          const yesterday = dayKey(new Date(Date.now() - 86_400_000));
          const streak = s.lastActive === yesterday ? s.streak + 1 : 1;
          return { lastActive: today, streak: Math.max(streak, 1) };
        }),

      setMode: (mode) => set({ mode }),
      reset: () => set({ solved: [], lastActive: null, streak: 0 }),
    }),
    { name: "stepwise-progress" },
  ),
);

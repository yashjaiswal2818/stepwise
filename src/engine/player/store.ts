import { create } from "zustand";
import type { Step, Trace } from "@/engine/types";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

interface PlayerState {
  trace: Trace | null;
  index: number;
  isPlaying: boolean;
  speed: number; // steps per second

  load: (trace: Trace) => void;
  toggle: () => void;
  play: () => void;
  pause: () => void;
  next: () => void; // advance; keeps playing (used by the rAF loop)
  stepForward: () => void; // manual: pause + advance
  prev: () => void; // manual: pause + go back
  seek: (i: number) => void;
  reset: () => void;
  setSpeed: (s: number) => void;
}

export const usePlayer = create<PlayerState>((set, get) => ({
  trace: null,
  index: 0,
  isPlaying: false,
  speed: 1.5,

  load: (trace) => set({ trace, index: 0, isPlaying: false }),

  toggle: () => {
    const { trace, index, isPlaying } = get();
    const last = (trace?.steps.length ?? 1) - 1;
    if (!isPlaying && index >= last) set({ index: 0, isPlaying: true }); // restart from the end
    else set({ isPlaying: !isPlaying });
  },
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),

  next: () =>
    set((s) => {
      const last = (s.trace?.steps.length ?? 1) - 1;
      const i = Math.min(s.index + 1, last);
      return { index: i, isPlaying: i < last && s.isPlaying };
    }),
  stepForward: () =>
    set((s) => {
      const last = (s.trace?.steps.length ?? 1) - 1;
      return { index: Math.min(s.index + 1, last), isPlaying: false };
    }),
  prev: () => set((s) => ({ index: Math.max(s.index - 1, 0), isPlaying: false })),
  seek: (i) => set((s) => ({ index: clamp(i, 0, (s.trace?.steps.length ?? 1) - 1), isPlaying: false })),
  reset: () => set({ index: 0, isPlaying: false }),
  setSpeed: (speed) => set({ speed: clamp(Math.round(speed * 2) / 2, 0.5, 4) }),
}));

/** The step currently on screen (stable reference until index/trace change). */
export function useCurrentStep(): Step | null {
  return usePlayer((s) => (s.trace ? s.trace.steps[s.index] : null));
}

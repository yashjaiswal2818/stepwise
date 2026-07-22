import { create } from "zustand";
import type { Ask, Step, Trace } from "@/engine/types";
import type { GateSchedule, GateSource } from "./gates";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** The gate currently interrupting playback. Runtime state only — the schedule
 *  (which steps gate) is injected by the workspace via `setGates`. */
export interface GateRuntime {
  /** The step being predicted; the gate opened while forIndex-1 was on screen. */
  forIndex: number;
  source: GateSource;
  ask: Ask;
  phase: "open" | "resolved";
  /** null while open; stays null if skipped. */
  pickedIndex: number | null;
  /** Playback mode to restore on close — a learner who was watching keeps watching. */
  wasPlaying: boolean;
}

/** One wrong prediction, kept session-only for Ada's context. */
export interface Miss {
  forIndex: number;
  picked: string;
  actual: string;
  why?: string;
}

interface PlayerState {
  trace: Trace | null;
  index: number;
  isPlaying: boolean;
  speed: number; // steps per second

  /** Gate schedule for the CURRENT trace (index → gate). Policy lives in
   *  gates.ts; the store only enforces the interception semantics. */
  gates: GateSchedule;
  /** Indices answered or skipped this run — never re-posed until a new run. */
  gateDone: Set<number>;
  gate: GateRuntime | null;
  missLog: Miss[];
  /** Per-run instrument readings. `asked` counts once per gate, at first
   *  resolve (answer or skip) — never on open, so a step-back re-look does not
   *  double-count, and an Ada-posed gate counts the same as a scheduled one. */
  gateStats: { asked: number; correct: number; skipped: number };

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

  setGates: (g: GateSchedule) => void;
  /** Ada's validated entry: seek to forIndex-1, pause, open. False = refused. */
  requestGate: (forIndex: number, ask: Ask, source: GateSource) => boolean;
  answerGate: (picked: number) => void;
  skipGate: () => void;
  /** Continue after a resolve: close the panel, restore playback. */
  closeGate: () => void;
}

const NO_GATES: GateSchedule = new Map();
/** Fresh per-run gate state. A function, not a constant — sharing one Set
 *  instance across runs would be a mutation bug waiting for a contributor. */
const freshRun = () => ({
  gate: null,
  gateDone: new Set<number>(),
  missLog: [] as Miss[],
  gateStats: { asked: 0, correct: 0, skipped: 0 },
});

/** Open a gate for `target`, or null when none is due. */
function dueGate(s: PlayerState, target: number, wasPlaying: boolean): Partial<PlayerState> | null {
  const g = s.gates.get(target);
  if (!g || target <= s.index || s.gateDone.has(target)) return null;
  return {
    isPlaying: false, // the rAF loop tears down on its own
    gate: { forIndex: target, source: g.source, ask: g.ask, phase: "open", pickedIndex: null, wasPlaying },
  };
}

export const usePlayer = create<PlayerState>((set, get) => ({
  trace: null,
  index: 0,
  isPlaying: false,
  speed: 1.5,
  gates: NO_GATES,
  ...freshRun(),

  // A new trace clears the schedule too — stale indices from another trace
  // must never gate this one. The workspace re-injects via setGates.
  load: (trace) => set({ trace, index: 0, isPlaying: false, gates: NO_GATES, ...freshRun() }),

  toggle: () => {
    const s = get();
    if (s.gate) return; // an open gate blocks ALL advancement
    const last = (s.trace?.steps.length ?? 1) - 1;
    // Restart from the end is a NEW run: gates re-ask (fading depends on it).
    if (!s.isPlaying && s.index >= last) set({ index: 0, isPlaying: true, ...freshRun() });
    else set({ isPlaying: !s.isPlaying });
  },
  play: () => set((s) => (s.gate ? {} : { isPlaying: true })),
  pause: () => set({ isPlaying: false }),

  next: () =>
    set((s) => {
      if (s.gate) return {}; // an open gate blocks ALL advancement
      const last = (s.trace?.steps.length ?? 1) - 1;
      const target = Math.min(s.index + 1, last);
      return dueGate(s, target, s.isPlaying) ?? { index: target, isPlaying: target < last && s.isPlaying };
    }),
  stepForward: () =>
    set((s) => {
      if (s.gate) return {};
      const last = (s.trace?.steps.length ?? 1) - 1;
      const target = Math.min(s.index + 1, last);
      return dueGate(s, target, false) ?? { index: target, isPlaying: false };
    }),
  prev: () =>
    set((s) => {
      // Stepping back from an open gate closes it UNRESOLVED — "let me re-look".
      // Not in gateDone, so it re-opens on the next advance; counted only when
      // finally resolved, so the re-look never double-counts.
      return { gate: null, index: Math.max(s.index - 1, 0), isPlaying: false };
    }),
  seek: (i) =>
    set((s) => {
      const last = (s.trace?.steps.length ?? 1) - 1;
      const target = clamp(i, 0, last);
      // A deliberate scrub IS an escape hatch: unresolved gates jumped over are
      // marked skipped — recorded as nothing, never as wrong. (Skips also
      // disqualify fade promotion, which reads `skipped`.)
      let skipped = 0;
      let done = s.gateDone;
      if (s.gates.size && target > s.index) {
        for (const k of s.gates.keys()) {
          if (k > s.index && k <= target && !s.gateDone.has(k)) {
            if (done === s.gateDone) done = new Set(s.gateDone);
            done.add(k);
            skipped++;
          }
        }
      }
      return {
        index: target,
        isPlaying: false,
        gate: null,
        gateDone: done,
        gateStats: skipped
          ? { ...s.gateStats, asked: s.gateStats.asked + skipped, skipped: s.gateStats.skipped + skipped }
          : s.gateStats,
      };
    }),
  reset: () => set({ index: 0, isPlaying: false, ...freshRun() }), // schedule survives; the run restarts
  setSpeed: (speed) => set({ speed: clamp(Math.round(speed * 2) / 2, 0.5, 4) }),

  setGates: (gates) => set({ gates }),

  requestGate: (forIndex, ask, source) => {
    const s = get();
    const last = (s.trace?.steps.length ?? 1) - 1;
    if (s.gate || !s.trace || forIndex < 1 || forIndex > last || s.gateDone.has(forIndex)) return false;
    set({
      index: forIndex - 1, // the scene the prediction is about
      isPlaying: false,
      gate: { forIndex, source, ask, phase: "open", pickedIndex: null, wasPlaying: false },
    });
    return true;
  },

  answerGate: (picked) =>
    set((s) => {
      if (!s.gate || s.gate.phase !== "open") return {};
      if (!Number.isInteger(picked) || picked < 0 || picked >= s.gate.ask.options.length) return {};
      const correct = picked === s.gate.ask.answerIndex;
      const revealed = s.trace?.steps[s.gate.forIndex];
      return {
        // The reveal IS the canvas advancing — the algorithm demonstrating the
        // answer is the payoff; no extra animation decorates it.
        index: s.gate.forIndex,
        gate: { ...s.gate, phase: "resolved", pickedIndex: picked },
        gateDone: new Set(s.gateDone).add(s.gate.forIndex),
        gateStats: {
          asked: s.gateStats.asked + 1,
          correct: s.gateStats.correct + (correct ? 1 : 0),
          skipped: s.gateStats.skipped,
        },
        missLog: correct
          ? s.missLog
          : [
              ...s.missLog,
              {
                forIndex: s.gate.forIndex,
                picked: s.gate.ask.options[picked].text,
                actual: s.gate.ask.options[s.gate.ask.answerIndex].text,
                why: revealed?.why,
              },
            ],
      };
    }),

  skipGate: () =>
    set((s) => {
      if (!s.gate) return {};
      const last = (s.trace?.steps.length ?? 1) - 1;
      return {
        index: s.gate.forIndex,
        gate: null,
        isPlaying: s.gate.wasPlaying && s.gate.forIndex < last,
        gateDone: new Set(s.gateDone).add(s.gate.forIndex),
        gateStats: { ...s.gateStats, asked: s.gateStats.asked + 1, skipped: s.gateStats.skipped + 1 },
      };
    }),

  closeGate: () =>
    set((s) => {
      if (!s.gate || s.gate.phase !== "resolved") return {};
      const last = (s.trace?.steps.length ?? 1) - 1;
      return { gate: null, isPlaying: s.gate.wasPlaying && s.index < last };
    }),
}));

/** The step currently on screen (stable reference until index/trace change). */
export function useCurrentStep(): Step | null {
  return usePlayer((s) => (s.trace ? s.trace.steps[s.index] : null));
}

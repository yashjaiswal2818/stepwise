import type { Ask, StepOp, Trace } from "@/engine/types";

/**
 * Gate POLICY — which steps of a trace pause and ask the learner to predict.
 * Pure functions over an executed trace; no store access, no React, no
 * randomness that isn't seeded. The player store holds gate RUNTIME (which gate
 * is open, what was picked); the workspace injects a schedule computed here via
 * `setGates`, so the engine layer stays policy-free.
 *
 * Because a trace is executed (never stored), both schedule sources work on any
 * dataset AND any custom input for free — a derived gate over a learner's own
 * numbers costs zero extra machinery. That is the payoff of the architecture.
 */

export type GateSource = "authored" | "derived" | "ada";

export interface GateEntry {
  ask: Ask;
  source: GateSource;
}

/** step index → the gate posed before that step is revealed. */
export type GateSchedule = Map<number, GateEntry>;

/** Backward-fading level: 0 = fully worked; 1 = the learner drives the final
 *  quarter; 2 = the back half; 3 = every eligible decision. */
export type FadeLevel = 0 | 1 | 2 | 3;

export const clampFade = (n: number): FadeLevel =>
  (Number.isFinite(n) ? (Math.min(3, Math.max(0, Math.round(n))) as FadeLevel) : 0);

/** Ops a learner can be asked to predict. `mark`/`init`/`done` are summaries —
 *  asking "what happens next: a summary?" teaches nothing. */
export const PREDICTABLE_OPS: readonly StepOp[] = [
  "compare",
  "swap",
  "push",
  "pop",
  "enqueue",
  "dequeue",
  "visit",
  "recurse",
  "return",
  "insert",
  "set",
];

const PREDICTABLE = new Set<string>(PREDICTABLE_OPS);

/** Learner-facing labels for a derived "what happens next?" option. */
export const OP_LABELS: Record<string, string> = {
  compare: "Compare two elements",
  swap: "Swap them",
  push: "Push onto the stack",
  pop: "Pop off the stack",
  enqueue: "Enqueue at the back",
  dequeue: "Dequeue from the front",
  visit: "Visit the next element",
  recurse: "Descend — a new call",
  return: "Return — unwind a call",
  insert: "Insert into the structure",
  set: "Write a value",
};

/** The same label, lowercased for mid-sentence use ("The algorithm swapped…"). */
export const opSentence = (op: string): string => {
  const l = OP_LABELS[op] ?? op;
  return l.charAt(0).toLowerCase() + l.slice(1);
};

// ---- deterministic selection ----------------------------------------------
// The derived schedule must be reproducible: the same trace always gates the
// same steps, so a bug report ("the gate at step 9…") means something, and a
// re-run re-asks the same moments. Seeded PRNG, not Math.random.

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- sources ---------------------------------------------------------------

/** Steps carrying an authored ask. An ask on step 0 is unreachable (there is no
 *  prior scene to predict from) and is dropped — BaseTracer also throws on it,
 *  so this is belt-and-braces for hand-built traces. */
export function authoredGates(trace: Trace): GateSchedule {
  const out: GateSchedule = new Map();
  for (const s of trace.steps) {
    if (s.ask && s.i >= 1) out.set(s.i, { ask: s.ask, source: "authored" });
  }
  return out;
}

/** A trace is quizzable iff it uses ≥ 2 distinct predictable ops — a one-op
 *  quiz is a coin with one face. */
export function isQuizzable(trace: Trace): boolean {
  const seen = new Set<string>();
  for (const s of trace.steps) {
    if (s.op && PREDICTABLE.has(s.op)) seen.add(s.op);
    if (seen.size >= 2) return true;
  }
  return false;
}

/** Distinct predictable ops present in the trace, most frequent first. */
function opsByFrequency(trace: Trace): string[] {
  const freq = new Map<string, number>();
  for (const s of trace.steps) {
    if (s.op && PREDICTABLE.has(s.op)) freq.set(s.op, (freq.get(s.op) ?? 0) + 1);
  }
  return [...freq.entries()].sort((a, b) => b[1] - a[1]).map(([op]) => op);
}

/**
 * Synthesize a "what happens next?" ask for step k, or null if not askable.
 * Options are the distinct predictable ops the trace actually uses (≤ 4,
 * always including the correct one). The correct option's feedback is the
 * step's why register when present; distractor feedback is left empty — the
 * gate UI falls back to "what actually happened" from the revealed step, which
 * is honest for a derived question and costs no authoring.
 */
export function synthesizeAsk(trace: Trace, k: number): Ask | null {
  const step = trace.steps[k];
  if (!step?.op || !PREDICTABLE.has(step.op)) return null;
  const ops = opsByFrequency(trace);
  if (ops.length < 2) return null;
  const pool = ops.slice(0, 4);
  if (!pool.includes(step.op)) pool[pool.length - 1] = step.op;
  return {
    id: `derived-${k}`,
    prompt: "What does the algorithm do next?",
    options: pool.map((op) => ({
      text: OP_LABELS[op] ?? op,
      why: op === step.op ? step.why ?? "" : "",
    })),
    answerIndex: pool.indexOf(step.op),
  };
}

/** Indices where a derived gate may pose: never the opening beats (the first
 *  minute is a win, not a test), never the finale, only predictable ops. */
function eligibleIndices(trace: Trace): number[] {
  const last = trace.steps.length - 1;
  const out: number[] = [];
  for (const s of trace.steps) {
    if (s.i >= 4 && s.i < last && s.op && PREDICTABLE.has(s.op)) out.push(s.i);
  }
  return out;
}

/**
 * Deterministic derived schedule for a problem trace: capped, spaced, and
 * preferring moments where a decision was just staged (the prior step is a
 * compare — the evidence is on screen).
 */
export function derivedGates(trace: Trace): GateSchedule {
  const out: GateSchedule = new Map();
  if (!isQuizzable(trace)) return out;
  const eligible = eligibleIndices(trace);
  if (!eligible.length) return out;

  const cap = Math.min(6, Math.ceil(trace.steps.length / 8));
  const rand = mulberry32(hashString(`${trace.exampleId}:${trace.datasetId}:${trace.steps.length}`));
  // Fisher–Yates with the seeded PRNG — a random-comparator sort is biased AND
  // engine-dependent, which would break the "same trace, same gates" guarantee.
  const shuffled = [...eligible];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  // Preferred moments first, the rest as fill.
  const preferred = shuffled.filter((k) => trace.steps[k - 1]?.op === "compare");
  const rest = shuffled.filter((k) => trace.steps[k - 1]?.op !== "compare");

  const chosen: number[] = [];
  for (const k of [...preferred, ...rest]) {
    if (chosen.length >= cap) break;
    if (chosen.some((c) => Math.abs(c - k) < 5)) continue; // spacing
    const ask = synthesizeAsk(trace, k);
    if (!ask) continue;
    chosen.push(k);
    out.set(k, { ask, source: "derived" });
  }
  return out;
}

/**
 * Backward-fading schedule: the trace drives steps below the cut, the learner
 * drives every eligible decision from the cut on. No spacing, no cap — at high
 * fade, density is the point.
 */
export function fadedGates(trace: Trace, level: FadeLevel): GateSchedule {
  const out: GateSchedule = new Map();
  if (level === 0) return out;
  if (!isQuizzable(trace)) return out; // ?fade=N is a mintable deep link — never crash a one-op trace
  const cut = { 1: 0.75, 2: 0.5, 3: 0 }[level];
  const from = Math.max(4, Math.floor(trace.steps.length * cut));
  for (const k of eligibleIndices(trace)) {
    if (k < from) continue;
    const ask = synthesizeAsk(trace, k);
    if (ask) out.set(k, { ask, source: "derived" });
  }
  return out;
}

/** First eligible index strictly after `from` — Ada's pose_prediction target. */
export function nextEligibleIndex(trace: Trace, from: number): number | null {
  const last = trace.steps.length - 1;
  for (let k = Math.max(1, from + 1); k < last; k++) {
    const op = trace.steps[k]?.op;
    if (op && PREDICTABLE.has(op)) return k;
  }
  return null;
}

/** Merge schedules; earlier arguments win index collisions (authored beats derived). */
export function mergeSchedules(...schedules: GateSchedule[]): GateSchedule {
  const out: GateSchedule = new Map();
  for (const s of schedules) {
    for (const [k, v] of s) if (!out.has(k)) out.set(k, v);
  }
  return out;
}

import type { Trace } from "../../src/engine/types";

/**
 * The invariants any visualization must satisfy, shared by `validate:traces`
 * (the whole catalog) and `add-problem` (one generated candidate).
 *
 * These are deliberately mechanical. They cannot tell you the algorithm is
 * *correct* — only a human can — but they catch the failures that hide well:
 * stale line anchors, empty narration, broken ordering, unfollowable step counts.
 *
 * The W-checks (why register) and A-checks (predict-gates) below are equally
 * mechanical: they verify presence, distinctness and shape. They cannot tell a
 * good why from a bad one, or a fair question from a trick — that remains the
 * human gate. Retrofit PRs must state what was verified by hand.
 */

const MIN_STEPS = 2;
const MAX_STEPS = 600;

/** Longest a why may run — one sentence's worth. A paragraph competes with the
 *  narration instead of sharpening it. */
const MAX_WHY_CHARS = 240;

/**
 * Ops whose steps MUST carry a `why` on why-enforced traces: the semantic moves
 * where "the move is shown but not forced" is exactly the gap the register
 * exists to close. `compare` is excluded deliberately — a compare step often
 * poses the question whose answer is the NEXT step's why. `init`/`done` are
 * summaries; `recurse`/`return` join the set when the recursion retrofit lands.
 */
export const WHY_OPS: ReadonlySet<string> = new Set([
  "push",
  "pop",
  "swap",
  "enqueue",
  "dequeue",
  "insert",
  "visit",
  "set",
  "mark",
]);

export interface CheckOpts {
  /** True for traces on the why-ratchet (WHY_ENFORCED in validate-traces.ts). */
  requireWhy?: boolean;
}

const norm = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();

export function checkTrace(trace: Trace, opts: CheckOpts = {}): string[] {
  const errors: string[] = [];
  const sourceLines = (trace.code ?? "").split("\n").length;

  if (!trace.exampleId) errors.push("missing exampleId");
  if (!trace.title) errors.push("missing title");
  if (!trace.code?.trim()) errors.push("empty SOURCE (the code panel would be blank)");

  const steps = trace.steps ?? [];
  if (steps.length < MIN_STEPS) errors.push(`only ${steps.length} step(s) — need at least ${MIN_STEPS}`);
  if (steps.length > MAX_STEPS) errors.push(`${steps.length} steps — too many to follow (max ${MAX_STEPS})`);

  const askIds = new Set<string>();
  let withWhy = 0;

  steps.forEach((s, i) => {
    const at = `step ${i}`;
    if (s.i !== i) errors.push(`${at}: .i is ${s.i}, expected ${i} (ordering broken)`);
    if (!s.narration?.trim()) errors.push(`${at}: empty narration`);
    if (!s.scene?.kind) errors.push(`${at}: missing scene.kind`);

    if (!Array.isArray(s.codeLines) || s.codeLines.length === 0) {
      errors.push(`${at}: no codeLines — nothing would highlight`);
    } else {
      for (const line of s.codeLines) {
        if (!Number.isInteger(line) || line < 1 || line > sourceLines) {
          errors.push(`${at}: codeLine ${line} outside SOURCE (1..${sourceLines}) — stale line anchor`);
        }
      }
    }

    // ---- W-checks: the why register ----
    // W1: semantic ops on enforced traces must explain themselves.
    if (opts.requireWhy && s.op && WHY_OPS.has(s.op) && !s.why?.trim()) {
      errors.push(`${at}: op "${s.op}" has no why — the move is shown but not forced`);
    }
    if (s.why?.trim()) {
      withWhy++;
      const w = norm(s.why);
      const n = norm(s.narration ?? "");
      // W3: a why must add information beyond the narration. Flag verbatim
      // restatement, and containment where the residue is too small to carry a
      // reason (whys legitimately quote live values the narration also quotes,
      // so plain containment alone would false-positive).
      if (w === n) {
        errors.push(`${at}: why restates the narration verbatim`);
      } else if (n.length > 12 && w.includes(n) && w.length - n.length < 15) {
        errors.push(`${at}: why is the narration plus ${w.length - n.length} chars — likely a restatement`);
      } else if (w.length > 12 && n.includes(w) && n.length - w.length < 15) {
        errors.push(`${at}: why is contained in the narration — it adds nothing`);
      }
      // W4: one sentence's worth.
      if (s.why.length > MAX_WHY_CHARS) {
        errors.push(`${at}: why is ${s.why.length} chars (max ${MAX_WHY_CHARS} — one sentence, not a paragraph)`);
      }
    }

    // ---- A-checks: predict-gates (all traces, always — a malformed gate is
    // wrong everywhere, ratchet or not) ----
    if (s.ask) {
      const a = s.ask;
      if (i === 0) errors.push(`${at}: ask on step 0 — no prior scene to predict from`);
      if (!a.id?.trim()) {
        errors.push(`${at}: ask has no id`);
      } else if (askIds.has(a.id)) {
        errors.push(`${at}: duplicate ask id "${a.id}" — latch the staging so a loop stages it once`);
      } else {
        askIds.add(a.id);
      }
      if (!a.prompt?.trim()) errors.push(`${at}: ask "${a.id}" has an empty prompt`);
      if (!Array.isArray(a.options) || a.options.length < 2 || a.options.length > 4) {
        errors.push(`${at}: ask "${a.id}" has ${a.options?.length ?? 0} options (need 2–4)`);
      }
      if (!Number.isInteger(a.answerIndex) || a.answerIndex < 0 || a.answerIndex >= (a.options?.length ?? 0)) {
        errors.push(`${at}: ask "${a.id}" answerIndex ${a.answerIndex} out of range`);
      }
      const texts = new Set<string>();
      (a.options ?? []).forEach((o, k) => {
        if (!o.text?.trim()) errors.push(`${at}: ask "${a.id}" option ${k} has empty text`);
        if (!o.why?.trim()) {
          errors.push(`${at}: ask "${a.id}" option ${k} has no feedback why — a distractor without a diagnosis is decoration`);
        } else if (norm(o.why) === norm(o.text)) {
          errors.push(`${at}: ask "${a.id}" option ${k} feedback echoes the option text`);
        }
        const t = norm(o.text ?? "");
        if (texts.has(t)) errors.push(`${at}: ask "${a.id}" duplicate option text "${o.text}"`);
        texts.add(t);
      });
    }
  });

  // W2: coverage floor — catches a tracer that dodges W1 by routing everything
  // through note()/op:"init". The floor is deliberately low (25%, min 3): an
  // honest trace on an easy dataset (e.g. an already-sorted array: all compares,
  // no swaps) legitimately has few why-carrying steps, and compare steps
  // deliberately go without.
  if (opts.requireWhy && steps.length >= 4) {
    const floor = Math.max(3, Math.ceil(steps.length * 0.25));
    if (withWhy < floor) {
      errors.push(`only ${withWhy}/${steps.length} steps carry a why (need ≥ ${floor} on a why-enforced trace)`);
    }
  }

  for (const [lang, alt] of Object.entries(trace.sources ?? {})) {
    if (!alt) continue;
    const altLines = alt.code.split("\n").length;
    for (const [fromRaw, to] of Object.entries(alt.map)) {
      const from = Number(fromRaw);
      if (from < 1 || from > sourceLines) {
        errors.push(`${lang} map: TS line ${from} outside SOURCE (1..${sourceLines})`);
      }
      if (!Number.isInteger(to) || to < 1 || to > altLines) {
        errors.push(`${lang} map: ${lang} line ${to} outside its own source (1..${altLines})`);
      }
    }
  }

  return errors;
}

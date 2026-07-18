import type { Trace } from "../../src/engine/types";

/**
 * The invariants any visualization must satisfy, shared by `validate:traces`
 * (the whole catalog) and `add-problem` (one generated candidate).
 *
 * These are deliberately mechanical. They cannot tell you the algorithm is
 * *correct* — only a human can — but they catch the failures that hide well:
 * stale line anchors, empty narration, broken ordering, unfollowable step counts.
 */

const MIN_STEPS = 2;
const MAX_STEPS = 600;

export function checkTrace(trace: Trace): string[] {
  const errors: string[] = [];
  const sourceLines = (trace.code ?? "").split("\n").length;

  if (!trace.exampleId) errors.push("missing exampleId");
  if (!trace.title) errors.push("missing title");
  if (!trace.code?.trim()) errors.push("empty SOURCE (the code panel would be blank)");

  const steps = trace.steps ?? [];
  if (steps.length < MIN_STEPS) errors.push(`only ${steps.length} step(s) — need at least ${MIN_STEPS}`);
  if (steps.length > MAX_STEPS) errors.push(`${steps.length} steps — too many to follow (max ${MAX_STEPS})`);

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
  });

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

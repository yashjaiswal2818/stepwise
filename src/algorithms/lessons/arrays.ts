import type { Trace } from "@/engine/types";
import { ArrayTracer } from "../authoring/ArrayTracer";

/**
 * SOURCE is authored so every prefix is a program you could actually run — that
 * is what makes "the code grows" honest rather than a reveal animation. The one
 * exception is the loop, written as a unit (12-14 in a single beat) so no
 * dangling brace is ever on screen across a dwell.
 */
export const SOURCE = `const scores = new Array(4);
scores[0] = 90;
scores[1] = 72;
scores[2] = 88;
scores[3] = 61;

scores[2];        // 88
scores.length;    // 4

scores[1] = 95;

for (let i = 0; i < scores.length; i++) {
  if (scores[i] === 88) break;
}`;

/** 1-based line anchors — co-located with SOURCE so drift is easy to catch. */
const L = {
  alloc: 1,
  w0: 2,
  w1: 3,
  w2: 4,
  w3: 5,
  read: 7,
  len: 8,
  rewrite: 10,
  loop: 12,
  test: 13,
  close: 14,
} as const;

const SLOTS = 4;
const VALUES = [90, 72, 88, 61];
const WRITE_LINE = [L.w0, L.w1, L.w2, L.w3];
const TARGET = 88;

/**
 * "What an array is" — the first Chapter. Not a problem: a run of the smallest
 * program that makes an array concrete. Reserves four empty boxes, fills them
 * (so the row is full-width from beat 0 and never reflows), reads one by index,
 * then contrasts that single O(1) read against a linear search for a value —
 * the same boxes, a different cost. The `values` arg is ignored; datasets are
 * chapters, not inputs.
 */
export function whatIsAnArrayTrace(_values: (number | string)[], datasetId = "default"): Trace {
  // Four reserved slots, nothing in them. The boxes are real Cells with an empty
  // value, so the viewBox is its final width from beat 0 and the boxes never
  // shrink as the array fills.
  const t = new ArrayTracer(Array.from({ length: SLOTS }, () => ""));

  t.written(1);
  t.note(
    "Ask for four slots. You get four boxes, side by side, and nothing in them yet. The boxes exist before the values do.",
    L.alloc,
    "init",
  );
  t.note(
    "The small number under each box is its index — where the box sits, not what it holds. Counting starts at 0, so the fourth box is index 3.",
    L.alloc,
    "init",
  );

  VALUES.forEach((v, i) => {
    t.written(2 + i);
    t.setValue(i, v).mark([i], "swap");
    t.note(`Put ${v} into slot ${i}.`, WRITE_LINE[i], "set");
  });

  t.note(
    "Four values in four slots. The row is exactly as wide as it was when it was empty — the space was reserved up front, and that is what the rest of this lesson depends on.",
    L.w3,
    "init",
  );

  // ---- reading by index: one held highlight, three beats of narration ----
  t.written(7);
  t.mark([2], "active", { hold: true }).setVar("reads", 1);
  t.note(
    `Read scores[2]. It is ${TARGET} — and slots 0 and 1 were never touched on the way there.`,
    L.read,
    "visit",
  );
  t.note(
    "Every box is the same size, so slot i always sits the same distance from the start: skip i boxes. The machine computes that distance and arrives in one move.",
    L.read,
    "visit",
  );
  t.note(
    "That is why reading by index costs the same whether the array holds four values or four million. It is arithmetic, not searching.",
    L.read,
    "visit",
  );
  t.release([2]);

  t.written(8);
  t.setVar("length", SLOTS);
  t.note(
    "The array also knows how many slots it has. That number is stored, not counted, so asking for the length is free too.",
    L.len,
    "init",
  );

  t.written(10);
  t.clearVar("reads").clearVar("length");
  t.setValue(1, 95).mark([1], "swap");
  t.note(
    "Overwrite slot 1 with 95. Same box, same position, new contents — nothing else in the row moves.",
    L.rewrite,
    "set",
  );

  // ---- the contrast: searching by value ----
  t.written(14);
  t.note(
    `Now turn it around. Reading scores[2] worked because we already knew the index. What if we know the value — ${TARGET} — and want to find out where it is?`,
    [L.loop, L.test, L.close],
    "init",
  );

  let reads = 0;
  for (let i = 0; i < SLOTS; i++) {
    reads++;
    t.setPointer("i", i).setVars({ i, reads });
    t.mark([i], "active");
    if (t.value(i) === TARGET) {
      t.note(`scores[${i}] is ${TARGET}. Found it.`, L.test, "compare");
      t.clearPointer("i").clearVar("i");
      t.markFinal(i, L.test, `${TARGET} is at index ${i} — after ${reads} reads.`);
      break;
    }
    t.note(`scores[${i}] is ${t.value(i)}, not ${TARGET}. Keep looking.`, L.test, "compare");
    t.mark([i], "visited", { hold: true }); // the trail behind the pointer stays on screen
  }

  t.note(
    `Index lookup: 1 read. Finding a value: ${reads}. Same array, same boxes — the difference is whether you already know where to look.`,
    L.test,
    "done",
  );

  // Close on prose, not on colour. Nothing here is "the answer", so turning the
  // row green would assert a state the lesson does not have.
  t.release().clearVar("reads");
  t.note(
    "An array is a run of equal-sized boxes at consecutive positions. That is the whole idea. Every array algorithm after this — binary search, two pointers, sliding window, every sort — is a strategy for which boxes to look at, and in what order.",
    L.alloc,
    "done",
  );

  return t.build({
    exampleId: "lesson-arrays",
    title: "What an array is",
    code: SOURCE,
    language: "ts",
    // No `sources`: a first lesson does not offer a C/Python toggle. Omitting the
    // key is what hides the language switcher in CodePanel.
    datasetId,
    legend: ["swap", "active", "visited", "final"],
  });
}

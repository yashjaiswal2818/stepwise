import type { Trace } from "@/engine/types";
import { ArrayTracer } from "../authoring/ArrayTracer";

/**
 * SOURCE is authored so every prefix is a program you could actually run.
 * Conceptual beats (the 4-cell value, the array payoff) anchor on comments —
 * an anchor need not be an executable statement, only honest about what the
 * step is discussing.
 */
export const SOURCE = `const memory = new Array(8);   // one stretch of memory: 8 cells

const addressOf = (i) => 1024 + i;

addressOf(3);        // 1024 + 3 = 1027

memory[2] = 90;      // 90 now lives at addressOf(2) — 1026

// a value too big for one cell takes four in a row;
// its address is where it starts: 1028

// equal-sized values in consecutive cells — that is an array:
// slot i sits at start + i * size`;

/** 1-based line anchors — co-located with SOURCE so drift is easy to catch. */
const L = {
  alloc: 1,
  formula: 3,
  compute: 5,
  store: 7,
  big: 9,
  bigAddr: 10,
  invent: 12,
  slot: 13,
} as const;

const CELLS = 8;
const START = 1024;
/** Synthetic but derived — every address the lesson quotes is computed here,
 *  never hand-typed, so narration cannot drift from the arithmetic it teaches. */
const A = (i: number) => START + i;

/**
 * "Where data lives" — Foundations unit 2. Eight empty cells; addresses carried
 * honestly: an `addr` pointer chip at the examined cell, a WatchPanel `address`
 * var computed `1024 + i`, and a region bracket for the one value that needs
 * four cells. The `values` arg is ignored; datasets are chapters, not inputs.
 */
export function memoryTrace(_values: (number | string)[], datasetId = "default"): Trace {
  const t = new ArrayTracer(Array.from({ length: CELLS }, () => ""));

  t.written(1);
  t.note(
    "This is memory: a row of numbered cells, each with room for one small number. That is the entire building. There is no drawer labeled “score” anywhere in it.",
    L.alloc,
    "init",
  );

  t.written(3);
  t.mark([0], "active").setPointer("addr", 0).setVar("address", A(0));
  t.note(
    `The row does not start at zero — this stretch begins at address ${A(0)}. The small number under each cell is its offset: how many cells past ${A(0)} it sits.`,
    L.formula,
    "visit",
    "An address names the place, not the contents — it belongs to the cell whether the cell is empty or full, so it can be written down now and trusted later.",
  );

  t.written(5);
  t.mark([3], "active").setPointer("addr", 3).setVar("address", A(3));
  t.note(
    `Cell 3 sits at ${A(0)} + 3 = ${A(3)}. An address is not looked up. It is computed — addition, nothing more.`,
    L.compute,
    "visit",
    "No table anywhere maps “cell 3” to a place — the arithmetic IS the lookup, which is why it costs the same for cell 3 or cell 3 million.",
  );

  t.written(7);
  t.setValue(2, 90).mark([2], "swap").setPointer("addr", 2).setVar("address", A(2));
  t.note(
    `Store 90. It goes into cell 2 — and from this moment, the only way to get it back is to remember where you put it: ${A(2)}.`,
    L.store,
    "set",
    "The cell keeps the value but not the reason — nothing in memory records what 90 means or that you stored it, so the address in your hand is the whole retrieval plan.",
  );

  t.written(10);
  t.mark([4, 5, 6, 7], "visited", { hold: true })
    .setRegion("big", [4, 5, 6, 7], "visited", "one large value · 4 cells")
    .setPointer("addr", 4)
    .setVar("address", A(4));
  t.note(
    `Bigger values need more room. A number too big for one cell takes four in a row — and its address is still a single number: ${A(4)}, the cell where it starts.`,
    [L.big, L.bigAddr],
    "set",
    "One value gets one address — the start — because the other three cells are findable from it by counting; naming all four would say nothing the first name does not.",
  );

  t.clearPointer("addr").clearVar("address");
  t.note(
    "Notice what the machine wrote down about all this: nothing. No names. “score” lives in your source code, for you — by the time the program runs, every name has been turned into an address.",
    L.store,
    "init",
  );

  t.written(13);
  t.release([4, 5, 6, 7]).clearRegion("big");
  t.setValue(0, 12).setValue(1, 7).setValue(3, 45).mark([0, 1, 3], "swap");
  t.setRegion("arr", [0, 1, 2, 3], "visited", "equal-sized values · 1 cell each");
  t.note(
    "Now the payoff. Put equal-sized values in consecutive cells and you have invented the array: slot i lives at start + i × size.",
    L.invent,
    "set",
    "Uniform size is what keeps the address computable — if cells varied, finding slot i would mean walking past every earlier value, counting as you go.",
  );
  t.note(
    "When the arrays chapter charges one read for scores[2], this is the read — never a search, just this addition.",
    L.slot,
    "init",
  );

  t.ask({
    id: "memory-slot-arithmetic",
    prompt: "Values start at address 2000 and each takes 4 cells. Where does slot 3 begin?",
    options: [
      {
        text: "2003",
        why: "That counts slots as if each took one cell — 2000 + 3. Each slot here is 4 cells wide, so slot 3 stands 3 × 4 = 12 cells past the start.",
      },
      {
        text: "2012",
        why: "Three whole slots — 3 × 4 = 12 cells — sit before slot 3, so it begins at 2000 + 12. That multiplication is the array's whole speed.",
      },
      {
        text: "2004",
        why: "That adds one slot's width once, no matter the index. The distance has to scale with i — slot 1 starts at 2004, but slot 3 is three whole slots in.",
      },
    ],
    answerIndex: 1,
  });
  // Close on prose, not colour.
  t.clearRegion("arr");
  t.note(
    "Memory is numbered cells; an address is arithmetic on a start. Hold onto that — the next unit is about variables that hold addresses on purpose.",
    L.formula,
    "done",
  );

  return t.build({
    exampleId: "lesson-memory",
    title: "Where data lives",
    code: SOURCE,
    language: "ts",
    // No `sources`: a first lesson does not offer a C/Python toggle.
    datasetId,
    legend: ["active", "swap", "visited"],
  });
}

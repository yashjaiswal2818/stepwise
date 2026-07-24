import type { Trace } from "@/engine/types";
import { ArrayTracer } from "../authoring/ArrayTracer";

/**
 * SOURCE is authored so every prefix is a program you could actually run — each
 * loop appears as one unit so a dangling brace is never on screen across a
 * dwell.
 */
export const SOURCE = `const list = [3, 8, 12, 19, 24, 31, 40, 50,
              55, 61, 68, 72, 76, 80, 87, 93];

// strategy one: scan from the front
for (let i = 0; i < list.length; i++) {
  if (list[i] === 87) break;   // one look per cell
}

// strategy two: halving — uses the fact the list is sorted
let lo = 0, hi = list.length - 1;
while (lo <= hi) {
  const mid = Math.floor((lo + hi) / 2);
  if (list[mid] === 87) break;   // one look
  if (list[mid] < 87) lo = mid + 1;   // 87 can only be right of mid
  else hi = mid - 1;                  // …or left of it
}`;

/** 1-based line anchors — co-located with SOURCE so drift is easy to catch. */
const L = {
  data: 1,
  scanFor: 5,
  scanTest: 6,
  sorted: 9,
  bounds: 10,
  loop: 11,
  mid: 12,
  hit: 13,
  goRight: 14,
  goLeft: 15,
} as const;

const VALUES = [3, 8, 12, 19, 24, 31, 40, 50, 55, 61, 68, 72, 76, 80, 87, 93];
const TARGET = 87;
/** Where the scan pauses to batch its trail — the counter still advances by
 *  cells actually read. */
const BATCH_ENDS = [4, 12];

const span = (a: number, b: number): number[] =>
  b < a ? [] : Array.from({ length: b - a + 1 }, (_, k) => a + k);

/**
 * "How work grows" — Foundations unit 4. The same question answered twice — a
 * front-to-back scan and a halving search — with an honest `looks` counter:
 * every cell that gets a colour was actually read, and the counter never moves
 * without a read. The `values` arg is ignored; datasets are chapters, not
 * inputs.
 */
export function growthTrace(_values: (number | string)[], datasetId = "default"): Trace {
  const t = new ArrayTracer(VALUES);

  t.written(2);
  t.note(
    `One question, asked twice: is ${TARGET} in this list? Two strategies will both answer correctly. We are not going to time them — we are going to count what they cost in looks.`,
    L.data,
    "init",
  );

  // ---- strategy one: the scan, run for real ----
  t.written(7);
  let looks = 0;
  let last = -1; // highest index already committed to the visited trail
  let foundAt = -1;
  for (let i = 0; i < t.length; i++) {
    looks++;
    if (t.value(i) === TARGET) {
      foundAt = i;
      break;
    }
    if (BATCH_ENDS.includes(i)) {
      t.mark(span(last + 1, i), "visited", { hold: true }).setVar("looks", looks);
      t.note(
        i === BATCH_ENDS[0]
          ? `Strategy one starts at the front: look, check, move on. ${looks} looks in, no ${TARGET}.`
          : `${looks} looks in, still no ${TARGET}. Every look costs the same; there are just a lot of them.`,
        L.scanTest,
        "visit",
        i === BATCH_ENDS[0]
          ? "The scan assumes nothing about the order, so no cell can vouch for another — the only way to rule a cell out is to pay a look at it."
          : "Nothing accumulates: each look eliminates exactly one cell, and the cells still ahead are as unknown as they were at the start.",
      );
      last = i;
    }
  }
  t.mark(span(last + 1, foundAt - 1), "visited", { hold: true }).setVar("looks", looks);
  t.markFinal(
    foundAt,
    L.scanTest,
    `${foundAt - last} more looks: ${t.value(foundAt - 1)}, then ${t.value(foundAt)}. Found, on look ${looks} — the answer is right, and the bill was nearly the whole list.`,
    `The scan has no way to skip — each look clears exactly one cell, so the bill lands wherever the target happens to sit, and ${TARGET} sat near the end.`,
  );
  const scanLooks = looks;

  // ---- strategy two: halving, run for real ----
  t.written(10);
  t.release();
  t.mark([foundAt], "default"); // the fresh start un-claims strategy one's find
  t.setVar("looks", 0);
  t.setRegion("field", span(0, t.length - 1), "frontier", `still possible · ${t.length}`);
  t.note(
    "Strategy two uses something strategy one ignored: the list is sorted. Same list, same question, fresh count — and a new rule: spend one look, erase everything that look can vouch for.",
    [L.sorted, L.bounds],
    "init",
  );

  t.written(16); // the halving loop appears with its first look
  let lo = 0;
  let hi = t.length - 1;
  let looksB = 0;
  let iter = 0;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    looksB++;
    iter++;
    t.setPointer("mid", mid).setVar("looks", looksB);
    if (t.value(mid) === TARGET) {
      const fieldNow = hi - lo + 1;
      t.clearRegion("field");
      t.markFinal(
        mid,
        L.hit,
        `The field is down to ${fieldNow}. Look at the middle of what is left: ${t.value(mid)} — found, on look ${looksB}.`,
        `${TARGET} was never compared with ${t.value(0)}, ${t.value(1)} or ${t.value(2)} — whole stretches were vouched absent by single looks. ${looksB} looks bought what the scan paid ${scanLooks} for.`,
      );
      break;
    }
    if (t.value(mid) < TARGET) {
      const v = t.value(mid);
      const gone = mid - lo + 1;
      lo = mid + 1;
      const left = hi - lo + 1;
      t.mark([mid], "active");
      t.setRegion("field", span(lo, hi), "frontier", `still possible · ${left}`);
      const beat =
        iter === 1
          ? {
              n: `One look — the middle. ${v} is too small, and because the list is sorted, that one look just erased the entire left half: ${gone} suspects gone, ${left} remain.`,
              w: `Everything up to the middle is at most ${v}, and ${TARGET} cannot hide among values ≤ ${v} — ${gone - 1} cells ruled out without ever being read. That is what sorted order buys.`,
            }
          : iter === 2
            ? {
                n: `Halve what is left. ${v} — still too small. ${gone} more gone in one look; the field is ${left}.`,
                w: "The guarantee renews at every scale: inside any stretch of a sorted list, its middle still vouches for everything on the low side.",
              }
            : iter === 3
              ? {
                  n: `Again: ${v}. Too small — ${gone} more gone. ${looksB} looks in, ${t.length - left} of ${t.length} cells are ruled out.`,
                  w: `Each look halves the field — 16, 8, 4, 2 — while the looks count 1, 2, 3. The suspects collapse geometrically; the bill climbs one at a time.`,
                }
              : {
                  n: `${v} is too small — it and everything below it are out. ${left} remain.`,
                  w: "A middle below the target clears its whole low side at once — the order guarantee does the reading for us.",
                };
      t.note(beat.n, L.goRight, "visit", beat.w);
      t.mark([mid], "visited", { hold: true }); // the one cell actually read joins the trail
    } else {
      const v = t.value(mid);
      const gone = hi - mid + 1;
      hi = mid - 1;
      const left = hi - lo + 1;
      t.mark([mid], "active");
      t.setRegion("field", span(lo, hi), "frontier", `still possible · ${left}`);
      t.note(
        `${v} is too big — it and everything above it are out. ${gone} gone in one look; ${left} remain.`,
        L.goLeft,
        "visit",
        "Sorted order works both ways: everything right of the middle is at least the middle, so a smaller target cannot live above it.",
      );
      t.mark([mid], "visited", { hold: true });
    }
  }

  t.clearPointer("mid");
  t.note(
    "Now double the list: 32 values. The scan's bill roughly doubles — about thirty looks. Halving pays exactly one more: five. Double again — the scan doubles again; halving pays six. The difference is not speed. It is shape.",
    [L.scanFor, L.loop],
    "init",
    "One halving-look removes exactly one doubling, so cost that counts doublings grows by 1 where cost that counts cells grows by n.",
  );
  t.note(
    "The shapes have names. Flat — the same cost at any size — is O(1). Grows-with-n is O(n): the scan. One-more-per-doubling is O(log n): the halving. The names are labels; the shapes are the idea, and you have now counted two of them yourself.",
    [L.scanTest, L.mid],
    "init",
  );

  t.ask({
    id: "growth-million-looks",
    prompt: "A sorted list of 1,000,000 values. Roughly how many looks does halving need?",
    options: [
      {
        text: "About 20",
        why: "Halving is doubling run backwards: 2 doubled 20 times passes a million, so a million halves down to one in about 20 looks. That is what O(log n) buys.",
      },
      {
        text: "About 1,000",
        why: "Tempting as a middle ground, but each look discards half of everything left — 1,000,000 → 500,000 → 250,000 — and that collapse reaches 1 in about 20 steps, not 1,000.",
      },
      {
        text: "About 500,000",
        why: "That is one halving, not halving repeated. The first look alone erases half a million suspects; the second, a quarter million. The strategy keeps halving all the way down.",
      },
    ],
    answerIndex: 0,
  });
  t.note(
    "Count the looks, not the seconds. When a strategy's bill barely moves while n explodes, that is the shape to reach for — and every structure ahead exists to buy you a better shape.",
    L.data,
    "done",
  );

  return t.build({
    exampleId: "lesson-growth",
    title: "How work grows",
    code: SOURCE,
    language: "ts",
    // No `sources`: a first lesson does not offer a C/Python toggle.
    datasetId,
    legend: ["active", "visited", "frontier", "final"],
  });
}

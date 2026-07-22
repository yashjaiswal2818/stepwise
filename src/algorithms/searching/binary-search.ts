import type { Trace, AltSource } from "@/engine/types";
import { ArrayTracer } from "../authoring/ArrayTracer";

export const SOURCE = `function binarySearch(a, target) {
  let lo = 0, hi = a.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (a[mid] === target) return mid;
    if (a[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}`;

const L = { init: 2, loop: 3, mid: 4, hit: 5, low: 6, high: 7, miss: 9 } as const;
const range = (a: number, b: number) => (b < a ? [] : Array.from({ length: b - a + 1 }, (_, k) => a + k));

const PY: AltSource = {
  code: `def binary_search(a, target):
    lo, hi = 0, len(a) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if a[mid] == target:
            return mid
        if a[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1`,
  map: { 2: 2, 4: 4, 5: 5, 6: 7, 7: 9, 9: 11 },
};

const C: AltSource = {
  code: `int binarySearch(int a[], int n, int target) {
    int lo = 0, hi = n - 1;
    while (lo <= hi) {
        int mid = (lo + hi) / 2;
        if (a[mid] == target) return mid;
        if (a[mid] < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;
}`,
  map: { 2: 2, 4: 4, 5: 5, 6: 6, 7: 7, 9: 9 },
};

export function binarySearchTrace(values: number[], target: number, datasetId = "default"): Trace {
  const t = new ArrayTracer(values);
  const n = values.length;
  t.setVar("target", target);
  t.note(
    `Binary Search for ${target} in a sorted array — halve the search space each step.`,
    L.init,
    "init",
    "Sortedness is the licence: one look at the middle tells us which half the target CANNOT be in. In an unsorted array the middle tells us nothing, and we are back to checking every cell.",
  );

  let lo = 0;
  let hi = n - 1;
  let found = -1;
  let probes = 0;
  const windows: number[] = []; // window size at each probe — the log₂ story, counted
  t.setPointer("lo", lo).setPointer("hi", hi).setVars({ lo, hi });
  t.setRegion("win", range(lo, hi), "compare", "search space");

  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    probes++;
    windows.push(hi - lo + 1);
    t.setPointer("mid", mid).setVars({ lo, mid, hi });
    t.setRegion("win", range(lo, hi), "compare", "search space");
    t.setState(
      [mid],
      "active",
      `Middle is a[${mid}] = ${t.value(mid)}`,
      L.mid,
      "visit",
      probes === 1
        ? "The midpoint is the only probe that guarantees progress either way: whichever way the comparison goes, half the window dies. Probe off-centre and the surviving half can be bigger — a slower worst case."
        : `If ${target} exists it lives in [${lo}..${hi}] — every cell outside this window was PROVEN impossible, not checked, so only here is worth probing.`,
    );

    if (t.value(mid) === target) {
      t.markFinal(
        mid,
        L.hit,
        `Found ${target} at index ${mid}!`,
        `${probes} probe${probes === 1 ? "" : "s"} instead of ${n} — the window shrank ${[...windows, 1].join(" → ")}. Halving until one cell remains is exactly log₂(n) at work.`,
      );
      found = mid;
      break;
    }
    if (t.value(mid) < target) {
      const oldMid = t.value(mid);
      const eliminated = mid - lo + 1;
      lo = mid + 1;
      // Binary search IS the movement of lo and hi — so the labelled chips must
      // move with them, not just the Watch vars. Guard the new bound: when the
      // window has collapsed (lo > hi) the chip has nothing valid to point at, so
      // it is cleared rather than left dangling past the array end.
      t.clearPointer("mid");
      if (lo <= hi) t.setPointer("lo", lo);
      else t.clearPointer("lo");
      t.setVars({ lo, hi });
      // The discard is a boundary WRITE (lo moves) — op "set", so the why
      // register's coverage check sees the moment the window actually shrinks.
      t.note(
        `${oldMid} < ${target} — discard the left half`,
        L.low,
        "set",
        `Everything at or left of the middle is ≤ ${oldMid}, because the array is sorted — ${target} cannot hide among values smaller than itself. ${eliminated} cell${eliminated === 1 ? "" : "s"} eliminated without being read.`,
      );
    } else {
      const oldMid = t.value(mid);
      const eliminated = hi - mid + 1;
      hi = mid - 1;
      t.clearPointer("mid");
      if (lo <= hi) t.setPointer("hi", hi);
      else t.clearPointer("hi");
      t.setVars({ lo, hi });
      t.note(
        `${oldMid} > ${target} — discard the right half`,
        L.high,
        "set",
        `Everything at or right of the middle is ≥ ${oldMid}, because the array is sorted — all too big. ${eliminated} cell${eliminated === 1 ? "" : "s"} ruled out by one comparison.`,
      );
    }
  }

  if (found === -1) {
    t.clearRegion("win").clearPointer("lo").clearPointer("hi");
    t.note(
      `${target} is not in the array.`,
      L.miss,
      "done",
      "lo has passed hi: the window is empty. Every cell was ruled out by proof, not inspection — absence is certain without reading most of the array.",
    );
  }

  return t.build({
    exampleId: "binary-search",
    title: "Binary Search",
    code: SOURCE,
    language: "ts",
    sources: { py: PY, c: C },
    datasetId,
    legend: ["active", "compare", "final"],
  });
}

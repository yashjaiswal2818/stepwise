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
  t.note(`Binary Search for ${target} in a sorted array — halve the search space each step.`, L.init, "init");

  let lo = 0;
  let hi = n - 1;
  let found = -1;
  t.setPointer("lo", lo).setPointer("hi", hi).setVars({ lo, hi });
  t.setRegion("win", range(lo, hi), "compare", "search space");

  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    t.setPointer("mid", mid).setVars({ lo, mid, hi });
    t.setRegion("win", range(lo, hi), "compare", "search space");
    t.setState([mid], "active", `Middle is a[${mid}] = ${t.value(mid)}`, L.mid, "visit");

    if (t.value(mid) === target) {
      t.markFinal(mid, L.hit, `Found ${target} at index ${mid}!`);
      found = mid;
      break;
    }
    if (t.value(mid) < target) {
      lo = mid + 1;
      t.clearPointer("mid").setVars({ lo, hi });
      t.note(`${t.value(mid)} < ${target} — discard the left half`, L.low);
    } else {
      hi = mid - 1;
      t.clearPointer("mid").setVars({ lo, hi });
      t.note(`${t.value(mid)} > ${target} — discard the right half`, L.high);
    }
  }

  if (found === -1) {
    t.clearRegion("win").clearPointer("lo").clearPointer("hi");
    t.note(`${target} is not in the array.`, L.miss, "done");
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

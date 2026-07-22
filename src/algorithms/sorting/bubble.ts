import type { Trace, AltSource } from "@/engine/types";
import { ArrayTracer } from "../authoring/ArrayTracer";

/** Reference source shown in the code panel. Line anchors below index into it. */
export const SOURCE = `function bubbleSort(a) {
  for (let n = a.length; n > 1; n--) {
    for (let j = 0; j < n - 1; j++) {
      if (a[j] > a[j + 1]) {
        swap(a, j, j + 1);
      }
    }
    // a[n - 1] is now in place
  }
  return a;
}`;

/** 1-based line anchors — co-located with SOURCE so drift is easy to catch. */
const L = {
  func: 1,
  outer: 2,
  inner: 3,
  compare: 4,
  swap: 5,
  placed: 8,
  ret: 10,
} as const;

const PY: AltSource = {
  code: `def bubble_sort(a):
    n = len(a)
    for size in range(n, 1, -1):
        for j in range(size - 1):
            if a[j] > a[j + 1]:
                a[j], a[j + 1] = a[j + 1], a[j]
    return a`,
  map: { 1: 1, 4: 5, 5: 6, 8: 3, 10: 7 },
};

const C: AltSource = {
  code: `void bubbleSort(int a[], int n) {
    for (int size = n; size > 1; size--) {
        for (int j = 0; j < size - 1; j++) {
            if (a[j] > a[j + 1]) {
                int t = a[j]; a[j] = a[j + 1]; a[j + 1] = t;
            }
        }
        // a[size - 1] is now in place
    }
}`,
  map: { 1: 1, 4: 4, 5: 5, 8: 8, 10: 8 },
};

export function bubbleSortTrace(values: number[], datasetId = "default"): Trace {
  const t = new ArrayTracer(values);
  const n0 = values.length;

  t.note(
    "Start — every element is unsorted. Bubble the largest to the end each pass.",
    L.func,
    "init",
    "Only adjacent neighbours ever swap — a value can travel one seat per step, so order has to emerge from purely local decisions.",
  );

  for (let n = n0; n > 1; n--) {
    t.setVar("pass", n0 - n + 1);
    for (let j = 0; j < n - 1; j++) {
      t.setPointer("j", j).setVar("j", j);
      t.compare(j, j + 1, L.compare);
      if (t.greater(j, j + 1)) {
        const a = t.value(j);
        const b = t.value(j + 1);
        t.swap(
          j,
          j + 1,
          L.swap,
          undefined,
          `${a} and ${b} are inverted, and adjacent inversions are the only thing bubble sort ever fixes — leave this one and it survives to the end.`,
        );
      }
    }
    t.clearPointer("j").clearVar("j");
    t.markFinal(
      n - 1,
      L.placed,
      undefined,
      `${t.value(n - 1)} is the largest of the first ${n} — the pass just swept it here, and no later pass reaches this far. Position ${n - 1} is proven, never revisited.`,
    );
  }

  t.markFinal(
    0,
    L.ret,
    "The smallest element is in place — the array is fully sorted!",
    "Only one element remained unplaced, and one element cannot be out of order with itself.",
  );

  return t.build({
    exampleId: "bubble-sort",
    title: "Bubble Sort",
    code: SOURCE,
    language: "ts",
    sources: { py: PY, c: C },
    datasetId,
    legend: ["active", "compare", "swap", "final"],
  });
}

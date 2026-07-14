import type { Trace, AltSource } from "@/engine/types";
import { ArrayTracer } from "../authoring/ArrayTracer";

export const SOURCE = `function quickSort(a, lo, hi) {
  if (lo >= hi) return;
  const pivot = a[hi];
  let i = lo;
  for (let j = lo; j < hi; j++) {
    if (a[j] < pivot) {
      swap(a, i, j);
      i++;
    }
  }
  swap(a, i, hi);
  quickSort(a, lo, i - 1);
  quickSort(a, i + 1, hi);
}`;

const L = { sig: 1, base: 2, pivot: 3, initI: 4, loop: 5, cmp: 6, swap: 7, place: 11 } as const;

const PY: AltSource = {
  code: `def quick_sort(a, lo, hi):
    if lo >= hi:
        return
    pivot = a[hi]
    i = lo
    for j in range(lo, hi):
        if a[j] < pivot:
            a[i], a[j] = a[j], a[i]
            i += 1
    a[i], a[hi] = a[hi], a[i]
    quick_sort(a, lo, i - 1)
    quick_sort(a, i + 1, hi)`,
  map: { 1: 1, 2: 2, 3: 4, 6: 7, 7: 8, 11: 10 },
};

const C: AltSource = {
  code: `void quickSort(int a[], int lo, int hi) {
    if (lo >= hi) return;
    int pivot = a[hi];
    int i = lo;
    for (int j = lo; j < hi; j++) {
        if (a[j] < pivot) {
            int t = a[i]; a[i] = a[j]; a[j] = t;
            i++;
        }
    }
    int t = a[i]; a[i] = a[hi]; a[hi] = t;
    quickSort(a, lo, i - 1);
    quickSort(a, i + 1, hi);
}`,
  map: { 1: 1, 2: 2, 3: 3, 6: 6, 7: 7, 11: 11 },
};

export function quickSortTrace(values: number[], datasetId = "default"): Trace {
  const t = new ArrayTracer(values);
  t.note("Quick Sort — pick a pivot, move smaller values left, then recurse on each side.", L.sig, "init");

  const qs = (lo: number, hi: number) => {
    if (lo > hi) return;
    if (lo === hi) {
      t.markFinal(lo, L.base);
      return;
    }
    const pivotVal = t.value(hi);
    t.setPointer("pivot", hi).setVars({ lo, hi, pivot: pivotVal });
    t.note(`Pivot = ${pivotVal} (the last element of this range).`, L.pivot, "mark");

    let i = lo;
    t.setPointer("i", i).setVar("i", i);
    for (let j = lo; j < hi; j++) {
      t.setPointer("j", j).setVar("j", j);
      t.compare(j, hi, L.cmp, `Is ${t.value(j)} < pivot ${pivotVal}?`);
      if (t.value(j) < pivotVal) {
        if (i !== j) t.swap(i, j, L.swap);
        else t.setState([i], "swap", `${t.value(i)} < ${pivotVal} — already on the left`, L.swap, "swap");
        i++;
        t.setPointer("i", i).setVar("i", i);
      }
    }
    t.clearPointer("j").clearVar("j");
    if (i !== hi) t.swap(i, hi, L.place, `Place pivot ${pivotVal} at its sorted position`);
    t.markFinal(i, L.place, `Pivot ${t.value(i)} is now in its final position`);
    t.clearPointer("pivot").clearPointer("i").clearVar("i");

    qs(lo, i - 1);
    qs(i + 1, hi);
  };

  qs(0, values.length - 1);

  return t.build({
    exampleId: "quick-sort",
    title: "Quick Sort",
    code: SOURCE,
    language: "ts",
    sources: { py: PY, c: C },
    datasetId,
    legend: ["active", "compare", "swap", "final"],
  });
}

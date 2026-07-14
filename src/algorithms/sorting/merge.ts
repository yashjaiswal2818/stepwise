import type { Trace, AltSource } from "@/engine/types";
import { ArrayTracer } from "../authoring/ArrayTracer";

export const SOURCE = `function mergeSort(a, lo, hi) {
  if (lo >= hi) return;
  const mid = (lo + hi) >> 1;
  mergeSort(a, lo, mid);
  mergeSort(a, mid + 1, hi);
  merge(a, lo, mid, hi); // combine two sorted halves
}`;

const L = { sig: 1, base: 2, mid: 3, left: 4, right: 5, merge: 6 } as const;
const range = (a: number, b: number) => (b < a ? [] : Array.from({ length: b - a + 1 }, (_, k) => a + k));

const PY: AltSource = {
  code: `def merge_sort(a, lo, hi):
    if lo >= hi:
        return
    mid = (lo + hi) // 2
    merge_sort(a, lo, mid)
    merge_sort(a, mid + 1, hi)
    merge(a, lo, mid, hi)  # combine two sorted halves`,
  map: { 1: 1, 3: 4, 6: 7 },
};

const C: AltSource = {
  code: `void mergeSort(int a[], int lo, int hi) {
    if (lo >= hi) return;
    int mid = (lo + hi) / 2;
    mergeSort(a, lo, mid);
    mergeSort(a, mid + 1, hi);
    merge(a, lo, mid, hi); // combine two sorted halves
}`,
  map: { 1: 1, 3: 3, 6: 6 },
};

export function mergeSortTrace(values: number[], datasetId = "default"): Trace {
  const t = new ArrayTracer(values).setAuxLabel("merge buffer");
  t.note("Merge Sort — recursively split the array in half, then merge the sorted halves back together.", L.sig, "init");

  const merge = (lo: number, mid: number, hi: number) => {
    t.clearRegion("range");
    t.setRegion("left", range(lo, mid), "compare", "left");
    t.setRegion("right", range(mid + 1, hi), "path", "right");
    const temp: number[] = [];
    for (let x = lo; x <= hi; x++) temp.push(t.value(x));
    t.setVars({ lo, mid, hi });
    t.note(`Merge the sorted halves [${lo}..${mid}] and [${mid + 1}..${hi}].`, L.merge, "mark");

    let i = lo;
    let j = mid + 1;
    let k = lo;
    while (i <= mid && j <= hi) {
      t.compare(i, j, L.merge, `Compare ${temp[i - lo]} (left) and ${temp[j - lo]} (right)`);
      if (temp[i - lo] <= temp[j - lo]) {
        t.auxTake(temp[i - lo], k, i, L.merge, `Take ${temp[i - lo]} from the left into the buffer`);
        i++;
      } else {
        t.auxTake(temp[j - lo], k, j, L.merge, `Take ${temp[j - lo]} from the right into the buffer`);
        j++;
      }
      k++;
    }
    while (i <= mid) {
      t.auxTake(temp[i - lo], k, i, L.merge, `Take the remaining ${temp[i - lo]} from the left`);
      i++;
      k++;
    }
    while (j <= hi) {
      t.auxTake(temp[j - lo], k, j, L.merge, `Take the remaining ${temp[j - lo]} from the right`);
      j++;
      k++;
    }
    t.auxCopyBack(L.merge, `Copy the merged run back into positions ${lo}..${hi}.`);
    t.clearRegion("left").clearRegion("right");
  };

  const ms = (lo: number, hi: number) => {
    if (lo >= hi) return;
    const mid = (lo + hi) >> 1;
    t.setRegion("range", range(lo, hi), "active", `[${lo}..${hi}]`);
    t.setVars({ lo, mid, hi });
    t.note(`Split [${lo}..${hi}] into [${lo}..${mid}] and [${mid + 1}..${hi}].`, L.mid, "recurse");
    ms(lo, mid);
    ms(mid + 1, hi);
    merge(lo, mid, hi);
  };

  ms(0, values.length - 1);
  t.finishAll(L.sig, "Every run has been merged — the array is fully sorted!");

  return t.build({
    exampleId: "merge-sort",
    title: "Merge Sort",
    code: SOURCE,
    language: "ts",
    sources: { py: PY, c: C },
    datasetId,
    legend: ["active", "compare", "swap", "final"],
  });
}

import type { Trace, AltSource } from "@/engine/types";
import { ArrayTracer } from "../authoring/ArrayTracer";

export const SOURCE = `function twoSum(a, target) {
  let l = 0, r = a.length - 1;
  while (l < r) {
    const sum = a[l] + a[r];
    if (sum === target) return [l, r];
    if (sum < target) l++;
    else r--;
  }
  return [];
}`;

const L = { init: 2, loop: 3, sum: 4, hit: 5, low: 6, high: 7, miss: 9 } as const;
const range = (a: number, b: number) => (b < a ? [] : Array.from({ length: b - a + 1 }, (_, k) => a + k));

const PY: AltSource = {
  code: `def two_sum(a, target):
    l, r = 0, len(a) - 1
    while l < r:
        s = a[l] + a[r]
        if s == target:
            return [l, r]
        if s < target:
            l += 1
        else:
            r -= 1
    return []`,
  map: { 2: 2, 4: 4, 5: 5, 6: 7, 7: 9, 9: 11 },
};

const C: AltSource = {
  code: `int twoSum(int a[], int n, int target, int* out) {
    int l = 0, r = n - 1;
    while (l < r) {
        int sum = a[l] + a[r];
        if (sum == target) { out[0] = l; out[1] = r; return 1; }
        if (sum < target) l++;
        else r--;
    }
    return 0;
}`,
  map: { 2: 2, 4: 4, 5: 5, 6: 6, 7: 7, 9: 9 },
};

export function twoPointersTrace(values: number[], target: number, datasetId = "default"): Trace {
  const t = new ArrayTracer(values);
  let l = 0;
  let r = values.length - 1;
  t.setVar("target", target);
  t.note(`Two Pointers — the array is sorted, so move inward to reach the target ${target}.`, L.init, "init");
  t.setPointer("l", l).setPointer("r", r);

  let found = false;
  while (l < r) {
    const sum = t.value(l) + t.value(r);
    t.setPointer("l", l).setPointer("r", r).setRegion("span", range(l, r), "compare");
    t.setVars({ l, r, sum });
    t.setState([l, r], "active", `a[${l}] + a[${r}] = ${t.value(l)} + ${t.value(r)} = ${sum}`, L.sum, "compare");

    if (sum === target) {
      t.markFinal(l, L.hit);
      t.markFinal(r, L.hit, `${t.value(l)} + ${t.value(r)} = ${target} — found the pair!`);
      found = true;
      break;
    }
    if (sum < target) {
      l++;
      t.note(`${sum} < ${target} — move the left pointer right to increase the sum`, L.low);
    } else {
      r--;
      t.note(`${sum} > ${target} — move the right pointer left to decrease the sum`, L.high);
    }
  }
  if (!found) t.note(`No pair sums to ${target}.`, L.miss, "done");

  return t.build({
    exampleId: "two-pointers",
    title: "Two Pointers",
    code: SOURCE,
    language: "ts",
    sources: { py: PY, c: C },
    datasetId,
    legend: ["active", "compare", "final"],
  });
}

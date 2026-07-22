import type { Trace, AltSource } from "@/engine/types";
import { HashTracer } from "../authoring/HashTracer";

export const SOURCE = `function twoSum(nums, target) {
  const seen = {};
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (need in seen) return [seen[need], i];
    seen[nums[i]] = i;
  }
}`;

const PY: AltSource = {
  code: `def two_sum(nums, target):
    seen = {}
    for i in range(len(nums)):
        need = target - nums[i]
        if need in seen:
            return [seen[need], i]
        seen[nums[i]] = i`,
  map: { 2: 2, 3: 3, 4: 4, 5: 5, 6: 7 },
};

const C: AltSource = {
  code: `int twoSum(int nums[], int n, int target, int* out) {
    int seen[64] = {0};   // value -> index + 1 (0 = absent)
    for (int i = 0; i < n; i++) {
        int need = target - nums[i];
        if (need >= 0 && seen[need]) {
            out[0] = seen[need] - 1; out[1] = i;
            return 1;
        }
        seen[nums[i]] = i + 1;
    }
    return 0;
}`,
  map: { 2: 2, 3: 3, 4: 4, 5: 5, 6: 9 },
};

const L = { setup: 2, loop: 3, need: 4, check: 5, store: 6 } as const;

export function twoSumTrace(nums: number[], target: number, datasetId = "default"): Trace {
  const t = new HashTracer(nums, "nums", "seen  ·  value → index");
  t.note(
    `Two Sum — for each value, check whether its complement (${target} − value) was already seen.`,
    L.setup,
    "init",
    "Checking every pair costs O(n²). Remembering what has walked past turns each step into one question — 'has my partner already been here?'",
  );

  for (let i = 0; i < nums.length; i++) {
    t.scan(
      i,
      L.loop,
      undefined,
      `A pair needs two halves — seeing ${nums[i]} fixes exactly what the other half must be: ${target} − ${nums[i]} = ${target - nums[i]}. One look, one question.`,
    );
    const need = target - nums[i];
    t.lookup(need, L.need);
    if (t.has(need)) {
      const j = t.get(need)!;
      t.found(
        j,
        i,
        need,
        L.check,
        undefined,
        `${need} was stored at index ${j} exactly for this moment — the pair was completed by memory, not by rescanning the array.`,
      );
      break;
    }
    t.insert(
      nums[i],
      i,
      L.store,
      undefined,
      `If ${need} never shows up later, this entry costs nothing — but if it does, the map must already know ${nums[i]} was here. Without it, that future step would rescan everything behind it.`,
    );
  }

  return t.build({
    exampleId: "two-sum",
    title: "Two Sum",
    code: SOURCE,
    language: "ts",
    sources: { py: PY, c: C },
    datasetId,
    legend: ["active", "compare", "final"],
  });
}

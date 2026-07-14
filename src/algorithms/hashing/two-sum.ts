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
  t.note(`Two Sum — for each value, check whether its complement (${target} − value) was already seen.`, L.setup, "init");

  for (let i = 0; i < nums.length; i++) {
    t.scan(i, L.loop);
    const need = target - nums[i];
    t.lookup(need, L.need);
    if (t.has(need)) {
      const j = t.get(need)!;
      t.found(j, i, need, L.check);
      break;
    }
    t.insert(nums[i], i, L.store);
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

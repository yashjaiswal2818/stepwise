import type { Trace, AltSource } from "@/engine/types";
import { ArrayTracer } from "../authoring/ArrayTracer";

export const SOURCE = `function lengthOfLongestSubstring(s) {
  const seen = new Set();
  let l = 0, best = 0;
  for (let r = 0; r < s.length; r++) {
    while (seen.has(s[r])) {
      seen.delete(s[l]);
      l++;
    }
    seen.add(s[r]);
    best = Math.max(best, r - l + 1);
  }
  return best;
}`;

const L = { setup: 3, expand: 4, dup: 5, shrink: 7, add: 9, best: 10, ret: 12 } as const;
const range = (a: number, b: number) => (b < a ? [] : Array.from({ length: b - a + 1 }, (_, k) => a + k));

const PY: AltSource = {
  code: `def length_of_longest(s):
    seen = set()
    l = best = 0
    for r in range(len(s)):
        while s[r] in seen:
            seen.remove(s[l])
            l += 1
        seen.add(s[r])
        best = max(best, r - l + 1)
    return best`,
  map: { 3: 3, 5: 5, 9: 8, 12: 10 },
};

const C: AltSource = {
  code: `int lengthOfLongest(char* s) {
    int seen[128] = {0};
    int l = 0, best = 0;
    for (int r = 0; s[r]; r++) {
        while (seen[(int)s[r]]) {
            seen[(int)s[l]] = 0;
            l++;
        }
        seen[(int)s[r]] = 1;
        int len = r - l + 1;
        if (len > best) best = len;
    }
    return best;
}`,
  map: { 3: 3, 5: 5, 9: 9, 12: 13 },
};

export function longestSubstringTrace(chars: string[], datasetId = "default"): Trace {
  const t = new ArrayTracer(chars);
  const n = chars.length;
  const ch = (i: number) => String(t.value(i));
  const seen = new Set<string>();
  let l = 0;
  let best = 0;

  t.note("Sliding Window — grow the window to the right; when a character repeats, shrink from the left.", L.setup, "init");

  for (let r = 0; r < n; r++) {
    t.setPointer("r", r).setPointer("l", l).setVars({ l, r, best });
    while (seen.has(ch(r))) {
      t.setRegion("window", range(l, r), "compare", "window");
      t.setState([r], "path", `'${ch(r)}' is already in the window — shrink from the left`, L.dup, "compare");
      seen.delete(ch(l));
      l++;
      t.setPointer("l", l).setVars({ l, r, best });
    }
    seen.add(ch(r));
    t.setRegion("window", range(l, r), "compare", "window");
    t.setState([r], "active", `Add '${ch(r)}' — window length is now ${r - l + 1}`, L.add, "insert");
    best = Math.max(best, r - l + 1);
    t.setVars({ l, r, best });
  }

  t.note(`The longest substring without repeats has length ${best}.`, L.ret, "done");

  return t.build({
    exampleId: "sliding-window",
    title: "Longest Substring Without Repeating",
    code: SOURCE,
    language: "ts",
    sources: { py: PY, c: C },
    datasetId,
    legend: ["active", "path", "compare"],
  });
}

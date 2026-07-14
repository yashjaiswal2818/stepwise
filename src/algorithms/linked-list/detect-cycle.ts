import type { Trace, AltSource } from "@/engine/types";
import { ListTracer } from "../authoring/ListTracer";

export const SOURCE = `function hasCycle(head) {
  let slow = head;
  let fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}`;

const L = { init: 3, loop: 4, slow: 5, fast: 6, meet: 7, none: 9 } as const;
const C = { slow: "var(--state-compare)", fast: "var(--state-path)" };

const PY_SRC: AltSource = {
  code: `def has_cycle(head):
    slow = head
    fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:
            return True
    return False`,
  map: { 3: 3, 5: 5, 6: 6, 7: 7, 9: 9 },
};

const C_SRC: AltSource = {
  code: `int hasCycle(Node* head) {
    Node* slow = head;
    Node* fast = head;
    while (fast && fast->next) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) return 1;
    }
    return 0;
}`,
  map: { 3: 3, 5: 5, 6: 6, 7: 7, 9: 9 },
};

export function detectCycleTrace(values: number[], cycleTo: number, datasetId = "default"): Trace {
  const t = new ListTracer(values, cycleTo >= 0 ? { cycleTo } : undefined);
  let slow: string | null = t.headId();
  let fast: string | null = t.headId();

  t.setPointer("slow", slow, C.slow).setPointer("fast", fast, C.fast);
  t.setVars({ slow: t.valueOf(slow), fast: t.valueOf(fast) });
  t.step("Floyd's tortoise & hare — slow moves 1 step, fast moves 2. If a cycle exists, they must meet.", L.init, "init");

  let found = false;
  while (fast && t.nextOf(fast)) {
    slow = t.nextOf(slow);
    t.setPointer("slow", slow, C.slow).nodeState(slow!, "compare").setVars({ slow: t.valueOf(slow), fast: t.valueOf(fast) });
    t.step(`slow moves one step → ${t.valueOf(slow)}`, L.slow, "visit");

    fast = t.nextOf(t.nextOf(fast));
    t.setPointer("fast", fast, C.fast);
    if (fast) t.nodeState(fast, "path");
    t.setVars({ slow: t.valueOf(slow), fast: t.valueOf(fast) });
    t.step(`fast moves two steps → ${t.valueOf(fast)}`, L.fast, "visit");

    if (slow === fast) {
      t.nodeState(slow!, "final");
      t.step(`slow and fast meet at ${t.valueOf(slow)} — there's a cycle! ✓`, L.meet, "done");
      found = true;
      break;
    }
  }

  if (!found) t.step("fast reached the end of the list — no cycle.", L.none, "done");

  return t.build({
    exampleId: "detect-cycle",
    title: "Detect a Cycle",
    code: SOURCE,
    language: "ts",
    sources: { py: PY_SRC, c: C_SRC },
    datasetId,
    legend: ["compare", "path", "final"],
  });
}

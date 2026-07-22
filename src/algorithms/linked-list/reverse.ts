import type { Trace, AltSource } from "@/engine/types";
import { ListTracer } from "../authoring/ListTracer";

export const SOURCE = `function reverse(head) {
  let prev = null;
  let cur = head;
  while (cur) {
    const next = cur.next;
    cur.next = prev;
    prev = cur;
    cur = next;
  }
  return prev;
}`;

const L = { init: 3, loop: 4, save: 5, rewire: 6, advPrev: 7, advCur: 8, ret: 10 } as const;
const C = { prev: "var(--state-final)", cur: "var(--state-active)", next: "var(--state-compare)" };

const PY_SRC: AltSource = {
  code: `def reverse(head):
    prev = None
    cur = head
    while cur:
        nxt = cur.next
        cur.next = prev
        prev = cur
        cur = nxt
    return prev`,
  map: { 3: 3, 5: 5, 6: 6, 8: 8, 10: 9 },
};

const C_SRC: AltSource = {
  code: `Node* reverse(Node* head) {
    Node* prev = NULL;
    Node* cur = head;
    while (cur) {
        Node* next = cur->next;
        cur->next = prev;
        prev = cur;
        cur = next;
    }
    return prev;
}`,
  map: { 3: 3, 5: 5, 6: 6, 8: 8, 10: 10 },
};

export function reverseListTrace(values: number[], datasetId = "default"): Trace {
  const t = new ListTracer(values);
  let prev: string | null = null;
  let cur: string | null = t.headId();

  t.setPointer("cur", cur, C.cur).setVars({ prev: "null", cur: t.valueOf(cur) });
  t.step(
    "Reverse the list by walking it once, flipping each node's next pointer to point backward.",
    L.init,
    "init",
    "Each node knows only its next — the only way to reach a node is along an arrow that still points at it, which is exactly what flipping arrows threatens.",
  );

  while (cur) {
    const next = t.nextOf(cur);
    t.setPointer("next", next, C.next).nodeState(cur, "active");
    t.setVars({ prev: t.valueOf(prev), cur: t.valueOf(cur), next: t.valueOf(next) });
    t.step(
      `Save next = ${t.valueOf(next)} so we don't lose the rest of the list.`,
      L.save,
      "mark",
      `Rewiring ${t.valueOf(cur)}.next severs the only route forward — without this saved pointer, everything after ${t.valueOf(cur)} would be unreachable, forever.`,
    );

    t.rewire(cur, prev).edge(cur, "swap").nodeState(cur, "swap");
    t.step(
      `Flip ${t.valueOf(cur)}.next to point back to ${t.valueOf(prev)}.`,
      L.rewire,
      "swap",
      `${t.valueOf(cur)} must point at the reversed part, and ${t.valueOf(prev)} is that part's head — the walk that brought us here can never pass this node again, which is why next was saved first.`,
    );

    prev = cur;
    cur = next;
    t.setPointer("prev", prev, C.prev).setPointer("cur", cur, C.cur).clearPointer("next");
    t.setVars({ prev: t.valueOf(prev), cur: t.valueOf(cur) });
    t.step(
      `Advance both pointers: prev = ${t.valueOf(prev)}, cur = ${t.valueOf(cur)}.`,
      L.advCur,
      "visit",
      `The invariant that keeps the loop safe: everything up to ${t.valueOf(prev)} is reversed, everything from ${t.valueOf(cur)} on is untouched — the boundary moves exactly one node per loop.`,
    );
  }

  t.clearPointer("cur").clearPointer("next");
  for (let i = 0; i < values.length; i++) t.nodeState(t.id(i), "final");
  t.setVars({ prev: t.valueOf(prev) });
  t.step(
    `Done — the new head is ${t.valueOf(prev)}. The list now runs in reverse.`,
    L.ret,
    "done",
    `${t.valueOf(prev)} was the last node the walk reached — every arrow flipped exactly once, so the old tail is the new head and no node was ever copied or moved.`,
  );

  return t.build({
    exampleId: "reverse-linked-list",
    title: "Reverse Linked List",
    code: SOURCE,
    language: "ts",
    sources: { py: PY_SRC, c: C_SRC },
    datasetId,
    legend: ["active", "swap", "compare", "final"],
  });
}

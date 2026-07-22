import type { Trace, AltSource } from "@/engine/types";
import { QueueTracer } from "../authoring/QueueTracer";

export const SOURCE = `const queue = [];

queue.enqueue(3);   // joins the rear
queue.enqueue(7);
queue.enqueue(1);

queue.dequeue();    // leaves the front -> 3

queue.enqueue(9);
queue.dequeue();    // -> 7
queue.dequeue();    // -> 1`;

const L = { init: 1, e3: 3, e7: 4, e1: 5, d1: 7, e9: 9, d2: 10, d3: 11 } as const;

const PY: AltSource = {
  code: `queue = []

queue.append(3)    # joins the rear
queue.append(7)
queue.append(1)

queue.pop(0)       # leaves the front -> 3

queue.append(9)
queue.pop(0)       # -> 7
queue.pop(0)       # -> 1`,
  map: { 1: 1, 3: 3, 4: 4, 5: 5, 7: 7, 9: 9, 10: 10, 11: 11 },
};

const C: AltSource = {
  code: `int queue[100];
int front = 0, back = 0;

queue[back++] = 3;   // enqueue (rear)
queue[back++] = 7;
queue[back++] = 1;

front++;             // dequeue (front) -> 3

queue[back++] = 9;
front++;             // -> 7
front++;             // -> 1`,
  map: { 1: 1, 3: 4, 4: 5, 5: 6, 7: 8, 9: 10, 10: 11, 11: 12 },
};

export function queueTrace(_values: number[], datasetId = "default"): Trace {
  const t = new QueueTracer();
  t.note(
    "A queue is FIFO — items join at the rear and always leave from the front.",
    L.init,
    "init",
    "The structure exists to keep one promise: whoever arrived first is served first. Everything a queue does follows from refusing to reorder.",
  );

  t.enqueue(3, L.e3, undefined, "3 joins at the rear — the only legal entrance. A queue that let arrivals cut in would stop being a queue.");
  t.enqueue(7, L.e7, undefined, "7 stands behind 3 — position is arrival order. The values themselves carry no priority at all.");
  t.enqueue(1, L.e1, undefined, "1 waits behind both — even the smallest value gets no priority. FIFO order is time order, nothing else.");

  t.peekFront(L.d1, undefined, "The front is the only exit — 3 has waited longest, so 3 must be next.");
  t.dequeue(L.d1, undefined, "Serving anyone but the front would mean a later arrival got served first — the one thing FIFO forbids.");

  t.enqueue(9, L.e9, undefined, "9 joins behind 1 — the dequeue at the front never reshuffled who is next at the rear.");

  t.peekFront(L.d2, undefined, "With 3 gone, 7 has now waited longest — the front moved back one; nobody overtook anybody.");
  t.dequeue(L.d2, undefined, "7 leaves exactly second because it arrived exactly second — a queue's output order IS its input order.");

  t.peekFront(L.d3, undefined, "1 outwaited 9 — 9 arrived later, so 9 keeps waiting. Arrival time is the only rank there is.");
  t.dequeue(L.d3, undefined, "First in, first out, every time: 3, 7, 1 left in exactly the order they arrived.");

  return t.build({
    exampleId: "queue",
    title: "Queue (FIFO)",
    code: SOURCE,
    language: "ts",
    sources: { py: PY, c: C },
    datasetId,
    legend: ["frontier", "active"],
  });
}

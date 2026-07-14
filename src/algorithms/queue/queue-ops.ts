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
  t.note("A queue is FIFO — items join at the rear and always leave from the front.", L.init, "init");

  t.enqueue(3, L.e3);
  t.enqueue(7, L.e7);
  t.enqueue(1, L.e1);

  t.peekFront(L.d1);
  t.dequeue(L.d1);

  t.enqueue(9, L.e9);

  t.peekFront(L.d2);
  t.dequeue(L.d2);

  t.peekFront(L.d3);
  t.dequeue(L.d3);

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

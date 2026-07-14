import type { Cell, QueueScene, StepOp } from "@/engine/types";
import { BaseTracer } from "./BaseTracer";

type Line = number | number[];

/** Records queue (FIFO) operations — enqueue at the rear, dequeue from the front. */
export class QueueTracer extends BaseTracer {
  private items: Cell[] = [];
  private counter = 0;

  private reindex(): void {
    this.items.forEach((c, i) => (c.index = i));
  }

  note(narration: string, line: Line, op: StepOp = "init"): this {
    this.snap(narration, line, op);
    return this;
  }

  enqueue(value: number, line: Line, narration?: string): this {
    this.items.push({ id: `q${this.counter++}`, value, index: this.items.length, state: "frontier" });
    this.snap(narration ?? `Enqueue ${value} at the rear`, line, "enqueue");
    return this;
  }

  peekFront(line: Line, narration?: string): this {
    const f = this.items[0];
    if (f) f.state = "active";
    this.snap(narration ?? (f ? `The front of the queue is ${f.value}` : "Queue is empty"), line, "visit");
    return this;
  }

  dequeue(line: Line, narration?: string): this {
    const f = this.items.shift();
    this.reindex();
    this.snap(narration ?? `Dequeue ${f?.value} from the front — everyone shifts up`, line, "dequeue");
    return this;
  }

  private snap(narration: string, line: Line, op?: StepOp): void {
    const codeLines = Array.isArray(line) ? line : [line];
    const scene: QueueScene = {
      kind: "queue",
      items: this.items.map((c) => ({ ...c })),
      headId: this.items[0]?.id,
      tailId: this.items[this.items.length - 1]?.id,
    };
    this.commit(scene, narration, codeLines, op, {
      size: this.items.length,
      front: this.items[0] ? String(this.items[0].value) : "—",
    });
    for (const c of this.items) if (c.state === "frontier" || c.state === "active") c.state = "default";
  }
}

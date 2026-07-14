import type { Cell, HashEntry, HashScene, StepOp, ElementState } from "@/engine/types";
import { BaseTracer } from "./BaseTracer";

type Line = number | number[];

/** Records a hash-map algorithm that scans an input array (e.g. Two Sum). */
export class HashTracer extends BaseTracer {
  private input: Cell[];
  private inputLabel?: string;
  private mapLabel?: string;
  private pointer = -1;
  private map = new Map<number, { value: number; state: ElementState; id: string }>();
  private order: number[] = [];
  private counter = 0;
  private lookupKey?: string;

  constructor(nums: number[], inputLabel?: string, mapLabel?: string) {
    super();
    this.input = nums.map((v, i) => ({ id: `in${i}`, value: v, index: i, state: "default" }));
    this.inputLabel = inputLabel;
    this.mapLabel = mapLabel;
  }

  has(key: number): boolean {
    return this.map.has(key);
  }
  get(key: number): number | undefined {
    return this.map.get(key)?.value;
  }

  note(narration: string, line: Line, op: StepOp = "init"): this {
    this.snap(narration, line, op);
    return this;
  }

  scan(i: number, line: Line): this {
    this.pointer = i;
    this.input[i].state = "active";
    this.lookupKey = undefined;
    this.snap(`Look at nums[${i}] = ${this.input[i].value}`, line, "visit");
    return this;
  }

  lookup(need: number, line: Line): this {
    this.lookupKey = String(need);
    const e = this.map.get(need);
    if (e) e.state = "compare";
    this.snap(`Complement is ${need} — has ${need} been seen yet?`, line, "compare");
    return this;
  }

  insert(key: number, value: number, line: Line): this {
    const id = `e${this.counter++}`;
    this.map.set(key, { value, state: "swap", id });
    this.order.push(key);
    this.snap(`No — store ${key} → index ${value} for later`, line, "insert");
    return this;
  }

  found(jIndex: number, iIndex: number, key: number, line: Line): this {
    this.pointer = iIndex;
    this.input[iIndex].state = "final";
    this.input[jIndex].state = "final";
    const e = this.map.get(key);
    if (e) e.state = "final";
    this.lookupKey = String(key);
    this.snap(`Yes! nums[${jIndex}] + nums[${iIndex}] = target. Answer: [${jIndex}, ${iIndex}]`, line, "done");
    return this;
  }

  private snap(narration: string, line: Line, op?: StepOp): void {
    const codeLines = Array.isArray(line) ? line : [line];
    const entries: HashEntry[] = this.order.map((k) => {
      const e = this.map.get(k)!;
      return { id: e.id, key: String(k), value: String(e.value), state: e.state };
    });
    const scene: HashScene = {
      kind: "hash",
      input: { cells: this.input.map((c) => ({ ...c })), pointer: this.pointer, label: this.inputLabel },
      entries,
      lookupKey: this.lookupKey,
      mapLabel: this.mapLabel,
    };
    this.commit(scene, narration, codeLines, op, this.lookupKey ? { need: this.lookupKey } : undefined);
    for (const c of this.input) if (c.state === "active" || c.state === "compare") c.state = "visited";
    for (const [, e] of this.map) if (e.state === "swap" || e.state === "compare") e.state = "default";
  }
}

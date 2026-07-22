import type { Cell, StackScene, StepOp } from "@/engine/types";
import { BaseTracer } from "./BaseTracer";

type Line = number | number[];

/** Records a stack algorithm that scans an input sequence (e.g. Valid Parentheses). */
export class StackTracer extends BaseTracer {
  private input: Cell[];
  private inputLabel?: string;
  private pointer = -1;
  private stack: Cell[] = [];
  private counter = 0;

  constructor(inputChars: string[], inputLabel?: string) {
    super();
    this.input = inputChars.map((v, i) => ({ id: `in${i}`, value: v, index: i, state: "default" }));
    this.inputLabel = inputLabel;
  }

  peek(): string | undefined {
    const top = this.stack[this.stack.length - 1];
    return top ? String(top.value) : undefined;
  }

  /** Current stack depth, read without committing — conditional gate staging
   *  (e.g. "only ask when two brackets are open") needs it. */
  size(): number {
    return this.stack.length;
  }

  note(narration: string, line: Line, op: StepOp = "init", why?: string): this {
    this.snap(narration, line, op, why);
    return this;
  }

  /** @deprecated Provide a `why` — a push without the constraint that forced it teaches only the what. */
  push(i: number, line: Line): this;
  push(i: number, line: Line, why: string): this;
  push(i: number, line: Line, why?: string): this {
    this.pointer = i;
    this.input[i].state = "active";
    this.stack.push({ id: `s${this.counter++}`, value: this.input[i].value, index: this.stack.length, state: "swap" });
    this.snap(`Opening bracket '${this.input[i].value}' — push it onto the stack`, line, "push", why);
    return this;
  }

  matchTop(i: number, line: Line, why?: string): this {
    this.pointer = i;
    this.input[i].state = "compare";
    const top = this.stack[this.stack.length - 1];
    if (top) top.state = "compare";
    this.snap(`Closing '${this.input[i].value}' — does the top '${top?.value ?? "∅"}' match?`, line, "compare", why);
    return this;
  }

  /** @deprecated Provide a `why` — a pop without the invariant that allowed it teaches only the what. */
  popMatch(i: number, line: Line): this;
  popMatch(i: number, line: Line, why: string): this;
  popMatch(i: number, line: Line, why?: string): this {
    this.pointer = i;
    const top = this.stack.pop();
    this.input[i].state = "visited";
    this.snap(`Match! Pop '${top?.value}'`, line, "pop", why);
    return this;
  }

  fail(i: number, line: Line, why?: string): this {
    this.pointer = i;
    this.input[i].state = "path";
    const top = this.stack[this.stack.length - 1];
    if (top) top.state = "path";
    this.snap(`'${this.input[i].value}' doesn't match — the string is invalid ✗`, line, "done", why);
    return this;
  }

  finish(valid: boolean, line: Line, why?: string): this {
    for (const c of this.stack) c.state = "path";
    this.snap(
      valid ? "Every bracket matched and the stack is empty — valid ✓" : "Brackets left on the stack — invalid ✗",
      line,
      "done",
      why,
    );
    return this;
  }

  private snap(narration: string, line: Line, op?: StepOp, why?: string): void {
    const codeLines = Array.isArray(line) ? line : [line];
    const scene: StackScene = {
      kind: "stack",
      frames: this.stack.map((c) => ({ ...c })),
      input: { cells: this.input.map((c) => ({ ...c })), pointer: this.pointer, label: this.inputLabel },
    };
    this.commit(
      scene,
      narration,
      codeLines,
      op,
      {
        top: this.peek() ?? "∅",
        size: this.stack.length,
      },
      why,
    );
    for (const c of this.input) if (c.state === "active" || c.state === "compare") c.state = "visited";
    for (const c of this.stack) if (c.state === "swap" || c.state === "compare") c.state = "default";
  }
}

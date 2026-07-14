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

  note(narration: string, line: Line, op: StepOp = "init"): this {
    this.snap(narration, line, op);
    return this;
  }

  push(i: number, line: Line): this {
    this.pointer = i;
    this.input[i].state = "active";
    this.stack.push({ id: `s${this.counter++}`, value: this.input[i].value, index: this.stack.length, state: "swap" });
    this.snap(`Opening bracket '${this.input[i].value}' — push it onto the stack`, line, "push");
    return this;
  }

  matchTop(i: number, line: Line): this {
    this.pointer = i;
    this.input[i].state = "compare";
    const top = this.stack[this.stack.length - 1];
    if (top) top.state = "compare";
    this.snap(`Closing '${this.input[i].value}' — does the top '${top?.value ?? "∅"}' match?`, line, "compare");
    return this;
  }

  popMatch(i: number, line: Line): this {
    this.pointer = i;
    const top = this.stack.pop();
    this.input[i].state = "visited";
    this.snap(`Match! Pop '${top?.value}'`, line, "pop");
    return this;
  }

  fail(i: number, line: Line): this {
    this.pointer = i;
    this.input[i].state = "path";
    const top = this.stack[this.stack.length - 1];
    if (top) top.state = "path";
    this.snap(`'${this.input[i].value}' doesn't match — the string is invalid ✗`, line, "done");
    return this;
  }

  finish(valid: boolean, line: Line): this {
    for (const c of this.stack) c.state = "path";
    this.snap(
      valid ? "Every bracket matched and the stack is empty — valid ✓" : "Brackets left on the stack — invalid ✗",
      line,
      "done",
    );
    return this;
  }

  private snap(narration: string, line: Line, op?: StepOp): void {
    const codeLines = Array.isArray(line) ? line : [line];
    const scene: StackScene = {
      kind: "stack",
      frames: this.stack.map((c) => ({ ...c })),
      input: { cells: this.input.map((c) => ({ ...c })), pointer: this.pointer, label: this.inputLabel },
    };
    this.commit(scene, narration, codeLines, op, {
      top: this.peek() ?? "∅",
      size: this.stack.length,
    });
    for (const c of this.input) if (c.state === "active" || c.state === "compare") c.state = "visited";
    for (const c of this.stack) if (c.state === "swap" || c.state === "compare") c.state = "default";
  }
}

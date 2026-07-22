import type { Cell, StackScene, StepOp } from "@/engine/types";
import { BaseTracer } from "./BaseTracer";

type Line = number | number[];

/**
 * Records the shunting-yard conversion of an infix token stream to postfix.
 * Three lanes are snapshotted every step: the scanned INPUT (with a cursor), the
 * operator STACK (the hero — operators wait here until precedence or a ')' forces
 * them off), and the growing OUTPUT (postfix, appended left -> right).
 *
 * Every branch a caller takes must be driven by the REAL algorithm reading
 * `top()`, never by inspecting the token string — so the picture always matches
 * control flow. One meaningful action = one commit = one player step; a single
 * operator that forces two others off the stack is three steps, on purpose,
 * because that is exactly what makes the "why" legible.
 */
export class ShuntingYardTracer extends BaseTracer {
  private input: Cell[];
  private inputLabel?: string;
  private pointer = -1;
  private stack: Cell[] = [];
  private output: Cell[] = [];
  private sc = 0; // stack-frame id counter
  private oc = 0; // output-cell id counter

  constructor(tokens: string[], inputLabel?: string) {
    super();
    this.input = tokens.map((v, i) => ({ id: `in${i}`, value: v, index: i, state: "default" }));
    this.inputLabel = inputLabel;
  }

  /** Read the stack top without committing a step. */
  top(): string | undefined {
    const t = this.stack[this.stack.length - 1];
    return t ? String(t.value) : undefined;
  }

  note(narration: string, line: Line): this {
    this.snap(narration, line, "init");
    return this;
  }

  /** Operand → straight to output; operands never wait. */
  emitOperand(i: number, line: Line): this {
    this.pointer = i;
    this.input[i].state = "active";
    this.output.push({ id: `o${this.oc++}`, value: this.input[i].value, index: this.output.length, state: "active" });
    this.snap(`'${this.input[i].value}' is an operand — send it straight to output. Operands never wait.`, line, "insert");
    return this;
  }

  /** Operator → push onto the stack (after the caller has popped anything higher). */
  pushOp(i: number, line: Line, why?: string): this {
    this.pointer = i;
    this.input[i].state = "active";
    this.stack.push({ id: `s${this.sc++}`, value: this.input[i].value, index: this.stack.length, state: "swap" });
    this.snap(why ?? `Push '${this.input[i].value}' onto the operator stack; it waits for its operands.`, line, "push");
    return this;
  }

  /** '(' → push it as a fence; nothing pops past it until its ')'. */
  pushParen(i: number, line: Line): this {
    this.pointer = i;
    this.input[i].state = "active";
    this.stack.push({ id: `s${this.sc++}`, value: "(", index: this.stack.length, state: "swap" });
    this.snap("A left parenthesis — push it. It fences off the operators inside; nothing pops past it until its ')' arrives.", line, "push");
    return this;
  }

  /** Light up the incoming operator and the stack top together — the precedence test. */
  compareTop(i: number, line: Line, why: string): this {
    this.pointer = i;
    this.input[i].state = "compare";
    const t = this.stack[this.stack.length - 1];
    if (t) t.state = "compare";
    this.snap(why, line, "compare");
    return this;
  }

  /** Pop the stack top to the output (precedence forced it, or draining at the end). */
  popToOutput(line: Line, why?: string): this {
    const t = this.stack.pop();
    if (t) {
      this.output.push({ id: `o${this.oc++}`, value: t.value, index: this.output.length, state: "active" });
      this.snap(why ?? `Pop '${t.value}' to output.`, line, "pop");
    }
    return this;
  }

  /** ')' → pop the matching '(' and discard both parens; they never reach output. */
  discardParen(i: number, line: Line): this {
    this.pointer = i;
    this.input[i].state = "active";
    this.stack.pop(); // the matching '('
    this.snap("Reached the matching '(' — discard both parentheses. Their grouping is now baked into the order of the output.", line, "pop");
    return this;
  }

  finish(line: Line): this {
    const postfix = this.output.map((c) => c.value).join(" ") || "∅";
    this.snap(
      `Done: ${postfix}. No parentheses, no precedence table — the stack turned both into plain left-to-right order.`,
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
      output: { cells: this.output.map((c) => ({ ...c })), label: "postfix" },
    };
    this.commit(scene, narration, codeLines, op, {
      top: this.top() ?? "∅",
      output: this.output.map((c) => c.value).join(" ") || "∅",
    });
    // Transients settle after the snapshot (the StackTracer pattern): consumed
    // input recedes, stack highlights relax, freshly-landed output settles.
    for (const c of this.input) if (c.state === "active" || c.state === "compare") c.state = "visited";
    for (const c of this.stack) if (c.state === "swap" || c.state === "compare") c.state = "default";
    for (const c of this.output) if (c.state === "active") c.state = "visited";
  }
}

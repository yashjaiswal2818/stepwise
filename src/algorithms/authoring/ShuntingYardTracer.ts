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
 *
 * Register discipline: `narration` is the WHAT ("Pop '×' to output."); the WHY
 * — the constraint that forced the move — travels in the separate `why`
 * register on the Step. Methods with an input-independent reason carry a
 * default why; `popToOutput`'s reason is always situational, so the caller must
 * supply it (computed from live state, or it lies under custom input).
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

  note(narration: string, line: Line, why?: string): this {
    this.snap(narration, line, "init", why);
    return this;
  }

  /** Operand → straight to output. */
  emitOperand(i: number, line: Line, why?: string): this {
    this.pointer = i;
    this.input[i].state = "active";
    this.output.push({ id: `o${this.oc++}`, value: this.input[i].value, index: this.output.length, state: "active" });
    this.snap(
      `'${this.input[i].value}' is an operand — it goes straight to output.`,
      line,
      "insert",
      why ?? "Operands never wait — only operators have an ordering conflict to resolve; a value has no one to fight with.",
    );
    return this;
  }

  /** Operator → push onto the stack (after the caller has popped anything higher). */
  pushOp(i: number, line: Line, why?: string): this {
    this.pointer = i;
    this.input[i].state = "active";
    this.stack.push({ id: `s${this.sc++}`, value: this.input[i].value, index: this.stack.length, state: "swap" });
    this.snap(
      `Push '${this.input[i].value}' onto the operator stack.`,
      line,
      "push",
      why ??
        `'${this.input[i].value}' cannot act yet — its second operand is still ahead in the input, and nothing left on the stack outranks it, so it waits.`,
    );
    return this;
  }

  /** '(' → push it as a fence; nothing pops past it until its ')'. */
  pushParen(i: number, line: Line, why?: string): this {
    this.pointer = i;
    this.input[i].state = "active";
    this.stack.push({ id: `s${this.sc++}`, value: "(", index: this.stack.length, state: "swap" });
    this.snap(
      "A left parenthesis — push it onto the stack.",
      line,
      "push",
      why ??
        "'(' is a fence: everything inside it must finish before anything outside, so no operator may pop past it until its ')' arrives.",
    );
    return this;
  }

  /** Light up the incoming operator and the stack top together — the precedence test. */
  compareTop(i: number, line: Line, why?: string): this {
    this.pointer = i;
    this.input[i].state = "compare";
    const t = this.stack[this.stack.length - 1];
    if (t) t.state = "compare";
    this.snap(
      `Compare '${this.input[i].value}' against the stack top '${t?.value ?? "∅"}'.`,
      line,
      "compare",
      why,
    );
    return this;
  }

  /** Pop the stack top to the output (precedence forced it, or draining at the end). */
  /** @deprecated Provide a `why` — a pop is always forced by something; name it. */
  popToOutput(line: Line): this;
  popToOutput(line: Line, why: string): this;
  popToOutput(line: Line, why?: string): this {
    const t = this.stack.pop();
    if (t) {
      this.output.push({ id: `o${this.oc++}`, value: t.value, index: this.output.length, state: "active" });
      this.snap(`Pop '${t.value}' to output.`, line, "pop", why);
    }
    return this;
  }

  /** ')' → pop the matching '(' and discard both parens; they never reach output. */
  discardParen(i: number, line: Line, why?: string): this {
    this.pointer = i;
    this.input[i].state = "active";
    this.stack.pop(); // the matching '('
    this.snap(
      "Reached the matching '(' — discard both parentheses.",
      line,
      "pop",
      why ??
        "Their grouping job is done — the order they enforced is now baked into the output, and postfix needs no parentheses at all.",
    );
    return this;
  }

  finish(line: Line, why?: string): this {
    const postfix = this.output.map((c) => c.value).join(" ") || "∅";
    this.snap(
      `Done: ${postfix}.`,
      line,
      "done",
      why ?? "No parentheses and no precedence table remain — the stack turned both into plain left-to-right order.",
    );
    return this;
  }

  private snap(narration: string, line: Line, op?: StepOp, why?: string): void {
    const codeLines = Array.isArray(line) ? line : [line];
    const scene: StackScene = {
      kind: "stack",
      frames: this.stack.map((c) => ({ ...c })),
      input: { cells: this.input.map((c) => ({ ...c })), pointer: this.pointer, label: this.inputLabel },
      output: { cells: this.output.map((c) => ({ ...c })), label: "postfix" },
    };
    this.commit(
      scene,
      narration,
      codeLines,
      op,
      {
        top: this.top() ?? "∅",
        output: this.output.map((c) => c.value).join(" ") || "∅",
      },
      why,
    );
    // Transients settle after the snapshot (the StackTracer pattern): consumed
    // input recedes, stack highlights relax, freshly-landed output settles.
    for (const c of this.input) if (c.state === "active" || c.state === "compare") c.state = "visited";
    for (const c of this.stack) if (c.state === "swap" || c.state === "compare") c.state = "default";
    for (const c of this.output) if (c.state === "active") c.state = "visited";
  }
}

import type { Trace } from "@/engine/types";
import { ShuntingYardTracer } from "../authoring/ShuntingYardTracer";

export const SOURCE = `function toPostfix(tokens) {
  const out = [];
  const ops = [];
  const prec = { '+': 1, '-': 1, '*': 2, '/': 2 };
  for (const tk of tokens) {
    if (isOperand(tk)) {
      out.push(tk);
    } else if (tk === '(') {
      ops.push(tk);
    } else if (tk === ')') {
      while (ops.at(-1) !== '(') out.push(ops.pop());
      ops.pop();
    } else {
      while (ops.length && ops.at(-1) !== '(' &&
             prec[ops.at(-1)] >= prec[tk]) out.push(ops.pop());
      ops.push(tk);
    }
  }
  while (ops.length) out.push(ops.pop());
  return out;
}`;

// 1-based anchors into SOURCE — re-derive by hand on any SOURCE edit.
// (Not `as const`: popHigher is a real number[] line span, which `as const`
// would freeze into a readonly tuple that the tracer's `Line` type rejects.)
const L: Record<string, number | number[]> = {
  loop: 5,
  operand: 7,
  lparen: 9,
  rparen: 11,
  dropParen: 12,
  popHigher: [14, 15],
  pushOp: 16,
  drain: 19,
  ret: 20,
};

const PREC: Record<string, number> = { "+": 1, "-": 1, "*": 2, "/": 2 };
const isOperand = (tk: string) => /^[A-Za-z0-9]+$/.test(tk);

export function infixToPostfixTrace(tokens: string[], datasetId = "default"): Trace {
  const t = new ShuntingYardTracer(tokens, "infix");
  t.note(
    "Two places to put things: an output line for the finished postfix, and an operator stack for operators whose turn has not come. Operands go straight to output; operators wait on the stack until something forces them off.",
    L.loop,
  );

  for (let i = 0; i < tokens.length; i++) {
    const tk = tokens[i];
    if (isOperand(tk)) {
      t.emitOperand(i, L.operand);
    } else if (tk === "(") {
      t.pushParen(i, L.lparen);
    } else if (tk === ")") {
      while (t.top() !== undefined && t.top() !== "(") {
        t.popToOutput(L.rparen, `Emptying the parentheses — pop '${t.top()}' to output before the '('.`);
      }
      t.discardParen(i, L.dropParen);
    } else {
      // An operator. Pop everything already on the stack that must act first.
      while (t.top() !== undefined && t.top() !== "(" && PREC[t.top()!] >= PREC[tk]) {
        const topOp = t.top()!;
        const reason =
          PREC[topOp] > PREC[tk]
            ? `'${topOp}' binds tighter than '${tk}' (precedence ${PREC[topOp]} vs ${PREC[tk]}) — it must act first, so pop it to output.`
            : `'${topOp}' has equal precedence and '${tk}' is left-associative, so '${topOp}' goes first — pop it.`;
        t.popToOutput(L.popHigher, reason);
      }
      t.pushOp(i, L.pushOp);
    }
  }

  while (t.top() !== undefined) {
    t.popToOutput(L.drain, `Input is done — drain the stack: pop '${t.top()}' to output.`);
  }
  t.finish(L.ret);

  return t.build({
    exampleId: "infix-to-postfix",
    title: "Infix → Postfix",
    code: SOURCE,
    language: "ts",
    datasetId,
    legend: ["active", "swap", "visited"],
  });
}

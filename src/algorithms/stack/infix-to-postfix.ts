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

  // The thesis gate fires once, at the first STRICT precedence-forced pop — the
  // exact moment "why did that pop?" has a one-word answer (precedence). Only
  // the strict case is staged: the equal-precedence pop is about associativity,
  // a subtler story that should not share a gate. State-dependent staging means
  // a dataset with no strict pop simply has no gate — never a wrong one.
  let askedPrecedence = false;

  for (let i = 0; i < tokens.length; i++) {
    const tk = tokens[i];
    if (isOperand(tk)) {
      t.emitOperand(i, L.operand);
    } else if (tk === "(") {
      t.pushParen(i, L.lparen);
    } else if (tk === ")") {
      while (t.top() !== undefined && t.top() !== "(") {
        t.popToOutput(
          L.rparen,
          `'${t.top()}' lives inside the fence — it must finish before the '(' lifts, so it empties to output now.`,
        );
      }
      t.discardParen(i, L.dropParen);
    } else {
      // An operator. Pop everything already on the stack that must act first.
      while (t.top() !== undefined && t.top() !== "(" && PREC[t.top()!] >= PREC[tk]) {
        const topOp = t.top()!;
        const strict = PREC[topOp] > PREC[tk];
        if (strict && !askedPrecedence) {
          askedPrecedence = true;
          t.ask({
            id: "ip-precedence-pop",
            prompt: `The next token is '${tk}'. '${topOp}' is on top of the stack. What must happen before '${tk}' can go on?`,
            options: [
              {
                text: `Push '${tk}' on top of '${topOp}'`,
                why: `If '${tk}' sat on top it would pop first — and postfix runs in pop order, so '${tk}' would act before the '${topOp}' it is supposed to wait for.`,
              },
              {
                text: `Pop '${topOp}' to the output first`,
                why: `'${topOp}' binds tighter (precedence ${PREC[topOp]} vs ${PREC[tk]}). Output order is pop order — whatever leaves the stack first runs first — so popping now is how precedence becomes order.`,
              },
            ],
            answerIndex: 1,
          });
        }
        const reason = strict
          ? `'${topOp}' binds tighter than '${tk}' (precedence ${PREC[topOp]} vs ${PREC[tk]}) — it must act first, so it leaves for the output now.`
          : `'${topOp}' has equal precedence and '${tk}' is left-associative, so the earlier operator goes first — '${topOp}' leaves before '${tk}' may sit down.`;
        t.popToOutput(L.popHigher, reason);
      }
      t.pushOp(i, L.pushOp);
    }
  }

  while (t.top() !== undefined) {
    t.popToOutput(
      L.drain,
      `'${t.top()}' has nothing left to wait for — the input is exhausted, so the remaining operators leave in stack order.`,
    );
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

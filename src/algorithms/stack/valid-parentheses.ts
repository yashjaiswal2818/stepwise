import type { Trace, AltSource } from "@/engine/types";
import { StackTracer } from "../authoring/StackTracer";

export const SOURCE = `function isValid(s) {
  const stack = [];
  const pairs = { ')': '(', ']': '[', '}': '{' };
  for (const ch of s) {
    if (ch === '(' || ch === '[' || ch === '{') {
      stack.push(ch);
    } else {
      if (stack.pop() !== pairs[ch]) return false;
    }
  }
  return stack.length === 0;
}`;

const L = { setup: 2, loop: 4, isOpen: 5, push: 6, popCheck: 8, ret: 11 } as const;

const OPEN = "([{";
const MATCH: Record<string, string> = { ")": "(", "]": "[", "}": "{" };

const PY: AltSource = {
  code: `def is_valid(s):
    stack = []
    pairs = {')': '(', ']': '[', '}': '{'}
    for ch in s:
        if ch in '([{':
            stack.append(ch)
        elif not stack or stack.pop() != pairs[ch]:
            return False
    return not stack`,
  map: { 4: 4, 6: 6, 8: 7, 11: 9 },
};

const C: AltSource = {
  code: `int isValid(char* s) {
    char stack[256];
    int top = 0;
    for (int i = 0; s[i]; i++) {
        char ch = s[i];
        if (ch == '(' || ch == '[' || ch == '{') {
            stack[top++] = ch;
        } else {
            char open = ch == ')' ? '(' : ch == ']' ? '[' : '{';
            if (top == 0 || stack[--top] != open) return 0;
        }
    }
    return top == 0;
}`,
  map: { 4: 4, 6: 7, 8: 10, 11: 13 },
};

export function validParenthesesTrace(chars: string[], datasetId = "default"): Trace {
  const t = new StackTracer(chars, "input");
  t.note(
    "Valid Parentheses — push each opening bracket; every closing bracket must match the top.",
    L.loop,
    "init",
    "The last bracket opened is always the first that must close — 'last in, first out' is literally a stack's contract, so the structure choice IS the algorithm.",
  );

  // The gate is staged once, on the first closer that arrives with ≥ 2 brackets
  // open — at depth 1 "the first one opened" IS the top, two options would both
  // be right, and a gate whose distractor is accidentally correct teaches a lie.
  let askedFirstClose = false;

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (OPEN.includes(ch)) {
      const inside = t.peek(); // live state: what this bracket opens inside of
      t.push(
        i,
        L.push,
        inside
          ? `'${ch}' opened inside '${inside}', so it must close before '${inside}' does — the stack's top holds exactly that promise.`
          : `'${ch}' can't be resolved yet — its closer is somewhere ahead. Parking it keeps the most recent unclosed bracket on top, the only one the next closer may touch.`,
      );
    } else {
      if (!askedFirstClose && t.size() >= 2) {
        askedFirstClose = true;
        t.ask({
          id: "vp-first-close",
          prompt: `Next is '${ch}'. Which bracket is it allowed to match?`,
          options: [
            {
              text: "The first one opened",
              why: "That bracket is the OLDEST promise — matching it now would cross every bracket opened since. Look at the stack: it sits at the bottom.",
            },
            {
              text: `The top of the stack, '${t.peek()}'`,
              why: "The most recent unclosed bracket is the only legal partner — and the stack keeps it on top by construction.",
            },
            {
              text: "Any open bracket of the same type",
              why: "Type alone is not enough — '([)]' has a '(' available for ')', yet it is invalid, because matching it would make '(' and '[' cross.",
            },
          ],
          answerIndex: 1,
        });
      }
      t.matchTop(i, L.popCheck);
      if (t.peek() === MATCH[ch]) {
        const top = t.peek();
        t.popMatch(
          i,
          L.popCheck,
          `'${top}' is fully resolved and leaves — the bracket it was burying is back on top, which is exactly where the next closer will look.`,
        );
      } else {
        const top = t.peek();
        t.fail(
          i,
          L.popCheck,
          top
            ? `'${top}' is still open, so '${ch}' arrived before its partner — matching them anyway would make the pairs cross, and no later input can repair a crossing.`
            : `The stack is empty — '${ch}' has no opener at all. A closer with nothing open can never be matched by anything that comes later.`,
        );
        return build(t, datasetId);
      }
    }
  }
  t.finish(
    t.peek() === undefined,
    L.ret,
    t.peek() === undefined
      ? "An empty stack is the proof — every promise made was kept, in exactly the reverse order of making."
      : "Brackets still on the stack are promises never kept — openers whose closers never arrived.",
  );
  return build(t, datasetId);
}

function build(t: StackTracer, datasetId: string): Trace {
  return t.build({
    exampleId: "valid-parentheses",
    title: "Valid Parentheses",
    code: SOURCE,
    language: "ts",
    sources: { py: PY, c: C },
    datasetId,
    legend: ["active", "compare", "visited", "path"],
  });
}

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
  t.note("Valid Parentheses — push each opening bracket; every closing bracket must match the top.", L.loop, "init");

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (OPEN.includes(ch)) {
      t.push(i, L.push);
    } else {
      t.matchTop(i, L.popCheck);
      if (t.peek() === MATCH[ch]) {
        t.popMatch(i, L.popCheck);
      } else {
        t.fail(i, L.popCheck);
        return build(t, datasetId);
      }
    }
  }
  t.finish(t.peek() === undefined, L.ret);
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

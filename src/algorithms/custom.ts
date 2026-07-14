import type { Trace } from "@/engine/types";
import { getExample } from "./registry";

/** What kind of input an example accepts when a learner (or the AI tutor) types their own. */
export type CustomKind = "numbers" | "string" | "none";

export interface CustomSpec {
  kind: CustomKind;
  /** Optional scalar argument, e.g. a search target. */
  arg?: { label: string; required: boolean };
  /** Values must be non-decreasing (binary search, two pointers). */
  sorted?: boolean;
  min: number;
  max: number;
  placeholder: string;
  note?: string;
}

const nums = (max: number, extra?: Partial<CustomSpec>): CustomSpec => ({
  kind: "numbers",
  min: 2,
  max,
  placeholder: "e.g. 5, 2, 8, 1, 9, 3",
  ...extra,
});

/**
 * Examples that meaningfully re-run on arbitrary input. Tree/graph examples use
 * curated preset structures, so they're intentionally absent (kind "none").
 */
export const CUSTOM_SPECS: Record<string, CustomSpec> = {
  "bubble-sort": nums(10),
  "quick-sort": nums(10),
  "merge-sort": nums(10),
  "binary-search": nums(12, {
    sorted: true,
    arg: { label: "Target", required: true },
    placeholder: "sorted, e.g. 1, 3, 4, 7, 9, 11",
    note: "Values must be sorted ascending.",
  }),
  "two-pointers": nums(12, {
    sorted: true,
    arg: { label: "Target sum", required: true },
    placeholder: "sorted, e.g. 2, 5, 6, 8, 11, 15",
    note: "Values must be sorted ascending.",
  }),
  "two-sum": nums(10, {
    arg: { label: "Target sum", required: true },
    placeholder: "e.g. 5, 3, 8, 2, 9, 6",
  }),
  "reverse-linked-list": nums(8, { placeholder: "e.g. 1, 2, 3, 4" }),
  "sliding-window": {
    kind: "string",
    min: 1,
    max: 14,
    placeholder: "e.g. abcabcbb",
    note: "Any characters — repeats shrink the window.",
  },
  "valid-parentheses": {
    kind: "string",
    min: 1,
    max: 14,
    placeholder: "e.g. ([{}])",
    note: "Only brackets: ( ) [ ] { }",
  },
};

const NONE: CustomSpec = { kind: "none", min: 0, max: 0, placeholder: "" };

export function getCustomSpec(exampleId: string): CustomSpec {
  return CUSTOM_SPECS[exampleId] ?? NONE;
}

export interface CustomInput {
  values: (number | string)[];
  arg?: number;
}

export type CustomResult =
  | { ok: true; input: CustomInput }
  | { ok: false; error: string };

/** Parse + validate free-text input against an example's spec. Shared by the form and the AI tool. */
export function parseCustom(exampleId: string, rawValues: string, rawArg = ""): CustomResult {
  const spec = getCustomSpec(exampleId);
  if (spec.kind === "none") return { ok: false, error: "This example uses a fixed structure." };

  let values: (number | string)[];
  if (spec.kind === "numbers") {
    const parts = rawValues.split(/[\s,]+/).filter(Boolean);
    if (!parts.length) return { ok: false, error: "Enter some numbers." };
    const parsed = parts.map(Number);
    if (parsed.some((n) => !Number.isInteger(n))) return { ok: false, error: "Use whole numbers only." };
    if (parsed.some((n) => n < -99 || n > 99)) return { ok: false, error: "Keep numbers between -99 and 99." };
    values = parsed;
  } else {
    values = rawValues.replace(/\s+/g, "").split("");
    if (exampleId === "valid-parentheses" && values.some((c) => !"()[]{}".includes(c as string))) {
      return { ok: false, error: "Use only brackets: ( ) [ ] { }" };
    }
  }

  if (values.length < spec.min) return { ok: false, error: `Enter at least ${spec.min}.` };
  if (values.length > spec.max) return { ok: false, error: `Keep it to ${spec.max} or fewer.` };

  if (spec.sorted) {
    const ns = values as number[];
    for (let i = 1; i < ns.length; i++) {
      if (ns[i] < ns[i - 1]) return { ok: false, error: "Values must be sorted in ascending order." };
    }
  }

  let arg: number | undefined;
  if (spec.arg?.required) {
    const a = Number(rawArg);
    if (rawArg.trim() === "" || !Number.isFinite(a)) {
      return { ok: false, error: `Enter a ${spec.arg.label.toLowerCase()}.` };
    }
    arg = a;
  }

  return { ok: true, input: { values, arg } };
}

/** Build a trace straight from custom values (bypasses the (id,dataset) memo — inputs vary). */
export function buildCustomTrace(
  exampleId: string,
  values: (number | string)[],
  arg?: number,
): Trace | null {
  const ex = getExample(exampleId);
  if (!ex) return null;
  return ex.build({ id: "custom", label: "Custom", values, arg });
}

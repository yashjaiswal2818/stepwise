"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { SPRING } from "@/engine/canvas/motion";
import { pressFeedback, focusRing } from "@/design-system/ui/interaction";
import { cn } from "@/lib/utils";
import { ToyFrame } from "./shared";

type Notation = "infix" | "prefix" | "postfix";
type Tok = { id: string; label: string; op?: boolean };

// One expression — A + B × C, i.e. A + (B × C) — written three ways. Same ids,
// reordered per notation, so the operators visibly glide to their new seats.
const A: Tok = { id: "a", label: "A" };
const B: Tok = { id: "b", label: "B" };
const C: Tok = { id: "c", label: "C" };
const ADD: Tok = { id: "add", label: "+", op: true };
const MUL: Tok = { id: "mul", label: "×", op: true };

const ORDER: Record<Notation, Tok[]> = {
  infix: [A, ADD, B, MUL, C],
  prefix: [ADD, A, MUL, B, C],
  postfix: [A, B, C, MUL, ADD],
};

const CAPTION: Record<Notation, string> = {
  infix: "Each operator sits between its two operands — the way we write maths by hand.",
  prefix: "Each operator sits before its operands. No parentheses needed to read it.",
  postfix: "Each operator sits after its operands — the form a stack machine evaluates directly.",
};

const NOTATIONS: Notation[] = ["infix", "prefix", "postfix"];

/**
 * Touch the notation: the same expression, A + B × C, re-lettered as infix,
 * prefix, or postfix. The operands never move; the operators glide to their new
 * seats — so "the notation is just where the operator sits" is something you see.
 * The operators wear the active state colour because they're the moving part.
 */
export function NotationToy() {
  const [n, setN] = useState<Notation>("infix");

  return (
    <ToyFrame label="One expression, three notations" hint="A + B × C">
      <div className="flex flex-col gap-3">
        <div className="inline-flex w-fit gap-0.5 rounded-md border border-line bg-base p-0.5">
          {NOTATIONS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setN(k)}
              aria-pressed={n === k}
              className={cn(
                "rounded-sm px-2.5 py-1 text-xs font-medium capitalize transition-colors duration-[var(--duration-fast)] ease-out",
                n === k ? "bg-surface-3 text-fg" : "text-fg-muted hover:text-fg",
                pressFeedback,
                focusRing,
              )}
            >
              {k}
            </button>
          ))}
        </div>

        <div className="flex min-h-[2.75rem] flex-wrap items-center gap-1.5">
          {ORDER[n].map((t) => (
            <motion.span
              key={t.id}
              layout
              transition={SPRING}
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-sm border font-mono text-sm",
                t.op ? "border-state-active text-fg" : "border-line bg-surface-2 text-fg-muted",
              )}
            >
              {t.label}
            </motion.span>
          ))}
        </div>

        <p className="text-2xs leading-snug text-fg-faint">{CAPTION[n]}</p>
      </div>
    </ToyFrame>
  );
}

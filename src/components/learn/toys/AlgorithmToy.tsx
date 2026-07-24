"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { RotateCcw, StepForward } from "lucide-react";
import { DUR, EASE_OUT } from "@/engine/canvas/motion";
import { cn } from "@/lib/utils";
import { ToyButton, ToyFrame } from "./shared";

/** The dealt hand — fixed on first render (SSR-safe); reset deals a fresh one. */
const START = [17, 42, 9];

/**
 * The whole program. The strip below shows exactly ONE line of it at a time —
 * the machine never sees the plan, only the next step.
 */
const INSTRUCTIONS = [
  "flip card 0",
  "flip card 1",
  "keep the bigger, forget the other",
  "flip card 2",
  "keep the bigger",
  "done — the card you kept is the answer",
] as const;

/** Step index at which the run is over (the final line executes nothing). */
const DONE = INSTRUCTIONS.length - 1;

/** Three distinct values, so "keep the bigger" never ties. */
function deal(): number[] {
  const pool = new Set<number>();
  while (pool.size < 3) pool.add(Math.floor(Math.random() * 90) + 10);
  return [...pool];
}

/** Machine state is a pure function of (values, instructions executed). */
function machine(values: number[], step: number) {
  let kept: number | null = null;
  const up = new Set<number>();
  const out = new Set<number>();
  if (step >= 1) {
    up.add(0);
    kept = 0;
  }
  if (step >= 2) up.add(1);
  if (step >= 3) {
    kept = values[0] > values[1] ? 0 : 1;
    out.add(kept === 0 ? 1 : 0);
  }
  if (step >= 4) up.add(2);
  if (step >= 5) {
    const winner = values[kept!] > values[2] ? kept! : 2;
    out.add(winner === kept ? 2 : kept!);
    kept = winner;
  }
  return { kept, up, out, done: step >= DONE };
}

/**
 * You are the computer: three face-down cards and one visible instruction.
 * "do the next step" executes it — flip, compare, keep — and the strip advances.
 * Only one instruction is ever visible, because the machine never sees the plan;
 * face-down cards, because data does not explain itself — you must look. The
 * kept card wears the active colour (the algorithm's entire memory is one card),
 * the forgotten one dims, and on done the kept card locks in as final.
 */
export function AlgorithmToy() {
  const [values, setValues] = useState<number[]>(START);
  const [step, setStep] = useState(0);
  const [runs, setRuns] = useState(0);

  const { kept, up, out, done } = machine(values, step);

  const doNext = () => {
    if (done) return;
    const next = step + 1;
    if (next === DONE) setRuns((r) => r + 1);
    setStep(next);
  };

  const reset = () => {
    setValues(deal());
    setStep(0);
  };

  // The predict beat: after two full runs, ask for the call before the tap.
  const pendingKeep = step === 2 || step === 4;
  const caption = done
    ? "Reset deals new cards — the instructions never change."
    : pendingKeep
      ? runs >= 2
        ? "Before you tap: which card will it keep?"
        : "Two cards are up — it may remember only one."
      : step === 0
        ? "The machine never sees the plan — only this instruction."
        : "Face-down means unknown — the machine has to look.";

  return (
    <ToyFrame label="Algorithm — steps a machine can follow" hint="one dumb step at a time">
      <div className="flex flex-col gap-3">
        <div className="flex min-h-6 items-center gap-2">
          <span className="shrink-0 text-2xs text-fg-faint">the machine sees</span>
          {/* Keyed on step: the old instruction is gone before the new appears. */}
          <motion.span
            key={step}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DUR.base, ease: EASE_OUT }}
            className="rounded-sm border border-line bg-base px-2 py-0.5 font-mono text-xs text-fg"
          >
            {INSTRUCTIONS[step]}
          </motion.span>
        </div>

        <div>
          <div className="flex gap-1.5">
            {values.map((v, i) => {
              const isUp = up.has(i);
              const isOut = out.has(i);
              const isKept = kept === i && step >= 1;
              return (
                <div
                  key={i}
                  role="img"
                  aria-label={
                    !isUp
                      ? `Card ${i}: face down`
                      : isOut
                        ? `Card ${i}: ${v}, forgotten`
                        : isKept
                          ? `Card ${i}: ${v}, kept${done ? " — the answer" : ""}`
                          : `Card ${i}: ${v}`
                  }
                  className={cn(
                    "grid h-12 w-10 shrink-0 place-items-center rounded-sm border font-mono text-sm transition-colors duration-[var(--duration-fast)] ease-out",
                    !isUp && "border-line bg-surface-2 text-fg-faint",
                    isUp && isOut && "border-line bg-surface text-fg-faint",
                    isUp && isKept && !done && "border-state-active bg-surface-3 text-fg",
                    isUp && isKept && done && "border-state-final bg-surface-3 text-fg",
                    isUp && !isKept && !isOut && "border-line-strong bg-surface-2 text-fg",
                  )}
                >
                  {isUp ? (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: DUR.base, ease: EASE_OUT }}
                    >
                      {v}
                    </motion.span>
                  ) : (
                    "?"
                  )}
                </div>
              );
            })}
          </div>
          {/* The card rail is fixed — the instructions name positions, not values. */}
          <div className="mt-1 flex gap-1.5">
            {values.map((_, i) => (
              <span key={i} className="grid w-10 shrink-0 place-items-center font-mono text-2xs text-fg-faint">
                {i}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ToyButton onClick={doNext} disabled={done} aria-label="Do the next instruction">
            <StepForward className="size-3.5" aria-hidden />
            do the next step
          </ToyButton>
          <ToyButton onClick={reset} disabled={step === 0} aria-label="Reset and deal new hidden cards">
            <RotateCcw className="size-3.5" aria-hidden />
            reset
          </ToyButton>
          <p className="min-w-0 text-2xs leading-snug text-fg-faint">{caption}</p>
        </div>
      </div>
    </ToyFrame>
  );
}

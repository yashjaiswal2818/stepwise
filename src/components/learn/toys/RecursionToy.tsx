"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronsDown, ChevronsUp, RotateCcw } from "lucide-react";
import { DUR, EASE_OUT } from "@/engine/canvas/motion";
import { cn } from "@/lib/utils";
import { ToyButton, ToyFrame } from "./shared";

let uid = 300;
const DEPTH = 3; // countdown(3) … countdown(0) → 4 frames deep

type Frame = { id: number; n: number };
type Phase = "idle" | "descending" | "unwinding";

/**
 * Touch recursion: [step in] pushes the next countdown(n) frame onto the call
 * stack — each new call stacks on TOP and wears the active colour because it is
 * the one currently executing, while the frames beneath it are frozen, waiting.
 * Hit the base case countdown(0) and the direction flips: [step out] pops frames
 * one at a time, each flashing final as it returns its value to its caller. The
 * stack grows in, then unwinds out — that pairing IS the shape of recursion.
 */
export function RecursionToy() {
  const [frames, setFrames] = useState<Frame[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  // The frame that just returned — held for one beat in the final colour.
  const [returning, setReturning] = useState<number | null>(null);

  const stepIn = () => {
    setReturning(null);
    setFrames((s) => {
      const next = s.length === 0 ? DEPTH : s[s.length - 1].n - 1;
      const grown = [...s, { id: uid++, n: next }];
      setPhase(next === 0 ? "unwinding" : "descending");
      return grown;
    });
  };

  const stepOut = () => {
    setFrames((s) => {
      const top = s[s.length - 1];
      setReturning(top ? top.id : null);
      const rest = s.slice(0, -1);
      setPhase(rest.length === 0 ? "idle" : "unwinding");
      return rest;
    });
  };

  const reset = () => {
    setFrames([]);
    setPhase("idle");
    setReturning(null);
  };

  const top = frames[frames.length - 1];
  const caption = (() => {
    if (frames.length === 0) return "The stack is empty — call countdown(3) to begin.";
    if (phase === "unwinding" && top && top.n === 0)
      return "countdown(0) is the base case — it returns without calling again.";
    if (phase === "unwinding")
      return `countdown(${top.n}) returns to countdown(${top.n + 1}).`;
    if (top && frames.length > 1)
      return `countdown(${top.n}) is waiting for countdown(${top.n - 1}).`;
    return `countdown(${top!.n}) is executing.`;
  })();

  return (
    <ToyFrame label="Recursion — a function that calls itself" hint="the call stack">
      <div className="flex items-end gap-4">
        <div className="flex h-36 w-32 flex-col justify-end gap-1">
          <AnimatePresence initial={false} mode="popLayout">
            {[...frames].reverse().map((f, ri) => {
              const isTop = ri === 0;
              return (
                <motion.div
                  key={f.id}
                  layout
                  initial={{ opacity: 0, y: -16, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -16, scale: 0.92 }}
                  transition={{ duration: DUR.base, ease: EASE_OUT }}
                  className={cn(
                    "grid h-7 shrink-0 place-items-center rounded-sm border font-mono text-xs",
                    isTop
                      ? "border-state-active bg-surface-3 text-fg"
                      : "border-line bg-surface-2 text-fg-muted",
                  )}
                >
                  countdown({f.n})
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* The frame that just returned, flashing final for one beat as it unwinds. */}
          <AnimatePresence>
            {returning !== null && (
              <motion.div
                key={returning}
                initial={{ opacity: 0, y: -12, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.92 }}
                transition={{ duration: DUR.base, ease: EASE_OUT }}
                className="grid h-7 shrink-0 place-items-center rounded-sm border border-state-final bg-surface-2 font-mono text-xs text-fg-muted"
              >
                returned
              </motion.div>
            )}
          </AnimatePresence>

          {frames.length === 0 && returning === null && (
            <div className="grid h-7 shrink-0 place-items-center rounded-sm border border-dashed border-line text-2xs text-fg-faint">
              no calls yet
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          {phase === "unwinding" || (frames.length > 0 && top && top.n === 0) ? (
            <ToyButton onClick={stepOut} aria-label="Step out — return from the top frame">
              <ChevronsUp className="size-3.5" aria-hidden />
              step out
            </ToyButton>
          ) : (
            <ToyButton onClick={stepIn} aria-label="Step in — call the next countdown frame">
              <ChevronsDown className="size-3.5" aria-hidden />
              {frames.length === 0 ? "call countdown(3)" : "step in"}
            </ToyButton>
          )}
          <ToyButton onClick={reset} disabled={frames.length === 0 && returning === null} aria-label="Reset the call stack">
            <RotateCcw className="size-3.5" aria-hidden />
            reset
          </ToyButton>
          <p className="mt-0.5 max-w-[9rem] text-2xs leading-snug text-fg-faint">{caption}</p>
        </div>
      </div>
    </ToyFrame>
  );
}

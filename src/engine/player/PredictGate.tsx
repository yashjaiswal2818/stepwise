"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check } from "lucide-react";
import { usePlayer } from "./store";
import { Button } from "@/design-system/ui/Button";
import { Kbd } from "@/design-system/ui/Kbd";
import { focusRing, pressFeedback, disabledState } from "@/design-system/ui/interaction";
import { DUR, EASE_OUT } from "@/engine/canvas/motion";
import { cn } from "@/lib/utils";

/**
 * The predict-gate: playback pauses, the learner calls the next move before the
 * algorithm makes it. Renders IN the Narration slot (a swap, not a stack) —
 * the question is answered by reading the canvas, so nothing may occlude it,
 * and this is the narration voice switching mood: "Now: what happened" becomes
 * "Next: what happens?".
 *
 * Design constraints carried here:
 * - Chips are pure chrome (color means algorithm state; a quiz is not state).
 * - The resolved correct option gets the achromatic `--marker` outline — the
 *   same accessibility rule selection uses everywhere else.
 * - No penalty styling exists: a wrong pick keeps its chrome and gains a quiet
 *   mono tag. Evaluative copy ("not quite", "oops") is banned; the panel states
 *   what happened and why.
 * - The reveal is the canvas advancing to the real step (answerGate moves
 *   `index`); nothing decorates it.
 * - Loading and error states are n/a by design: answering is synchronous and
 *   client-side — there is nothing to await and nothing to fail.
 */
export function PredictGate({ onStopAsking }: { onStopAsking?: () => void }) {
  const gate = usePlayer((s) => s.gate);
  const step = usePlayer((s) => (s.gate ? s.trace?.steps[s.gate.forIndex] : undefined));
  const reduced = useReducedMotion();

  const firstOptionRef = useRef<HTMLButtonElement>(null);
  const continueRef = useRef<HTMLButtonElement>(null);

  const phase = gate?.phase;
  const forIndex = gate?.forIndex;

  // Focus follows the required interaction: the first option on open (playback
  // is already paused — the one moment focus-stealing is correct), Continue on
  // resolve (Enter/Space immediately continue).
  useEffect(() => {
    if (phase === "open") firstOptionRef.current?.focus();
    else if (phase === "resolved") continueRef.current?.focus();
  }, [phase, forIndex]);

  // When the gate closes entirely, hand focus to the transport's play button so
  // Space works without a mouse trip. Keyed on presence, not identity — the
  // open→resolved transition must not fire this.
  const hasGate = !!gate;
  useEffect(() => {
    if (!hasGate) return;
    return () => document.getElementById("player-play")?.focus();
  }, [hasGate]);

  if (!gate) return null;

  const resolved = gate.phase === "resolved" && gate.pickedIndex != null;
  const picked = gate.pickedIndex ?? -1;
  const correct = resolved && picked === gate.ask.answerIndex;
  const pickedOpt = resolved ? gate.ask.options[picked] : undefined;
  const correctOpt = gate.ask.options[gate.ask.answerIndex];

  // Feedback lines, never evaluative: the diagnosis for the picked option, then
  // the step's why register when it adds something.
  const feedback: string[] = [];
  if (resolved && step) {
    if (correct) {
      const w = correctOpt.why || step.why;
      if (w) feedback.push(w);
    } else {
      if (pickedOpt?.why) feedback.push(pickedOpt.why);
      if (step.why && step.why !== pickedOpt?.why) feedback.push(step.why);
    }
  }
  const announce = resolved && step ? (correct ? `Right. ${step.narration}` : `The algorithm: ${step.narration}`) : "";

  return (
    <motion.div
      key={gate.forIndex}
      initial={reduced ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DUR.base, ease: EASE_OUT }}
      role="group"
      aria-labelledby="gate-prompt"
      className="shrink-0 border-t border-line px-5 py-4 sm:px-6"
    >
      <p className="mb-1.5 text-2xs font-medium tracking-tight text-fg-faint">Predict</p>
      <p id="gate-prompt" className="max-w-prose text-pretty text-md leading-relaxed text-fg">
        {gate.ask.prompt}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {gate.ask.options.map((o, k) => {
          const isAnswer = k === gate.ask.answerIndex;
          return (
            <button
              key={k}
              ref={k === 0 ? firstOptionRef : undefined}
              type="button"
              disabled={resolved}
              onClick={() => usePlayer.getState().answerGate(k)}
              className={cn(
                "inline-flex h-8 items-center gap-2 rounded-sm border px-3 text-sm font-medium",
                focusRing,
                pressFeedback,
                disabledState,
                !resolved && "border-line bg-surface-2 text-fg hover:border-line-strong hover:bg-surface-3",
                resolved &&
                  (isAnswer
                    ? // What the algorithm did: selection chrome + the achromatic
                      // marker rule — never a colored fill, and never dimmed.
                      "border-line-strong bg-surface-3 text-fg outline outline-2 outline-marker disabled:opacity-100"
                    : "border-line bg-surface-2 text-fg-muted"),
              )}
            >
              {!resolved && (
                <Kbd aria-hidden="true" className="hidden sm:inline-flex">
                  {k + 1}
                </Kbd>
              )}
              <span>{o.text}</span>
              {resolved && isAnswer && <Check aria-hidden className="size-3.5" />}
              {resolved && picked === k && !isAnswer && (
                <span className="font-mono text-2xs text-fg-muted">· your pick</span>
              )}
            </button>
          );
        })}
      </div>

      {!resolved ? (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <button
            type="button"
            onClick={() => usePlayer.getState().skipGate()}
            className={cn("text-xs font-medium text-fg-muted hover:text-fg", focusRing)}
          >
            Skip
          </button>
          {onStopAsking && (
            <button
              type="button"
              onClick={() => {
                usePlayer.getState().skipGate();
                onStopAsking();
              }}
              className={cn("text-xs font-medium text-fg-muted hover:text-fg", focusRing)}
            >
              Stop asking
            </button>
          )}
          <p aria-hidden="true" className="ml-auto hidden items-center gap-1.5 text-2xs text-fg-faint sm:flex">
            <Kbd>1</Kbd>–<Kbd>{String(gate.ask.options.length)}</Kbd> answer · <Kbd>Esc</Kbd> skip
          </p>
        </div>
      ) : (
        <div className="mt-3">
          {step && <p className="max-w-prose text-pretty text-md leading-relaxed text-fg">{step.narration}</p>}
          {feedback.map((line, i) => (
            <p key={i} className="mt-1 max-w-prose text-pretty text-md leading-relaxed text-fg-muted">
              {line}
            </p>
          ))}
          <Button ref={continueRef} size="sm" className="mt-3" onClick={() => usePlayer.getState().closeGate()}>
            Continue
          </Button>
        </div>
      )}

      {/* One polite announcement per resolve — the canvas label already carries
          the revealed narration for continuous playback. */}
      <div aria-live="polite" className="sr-only">
        {announce}
      </div>
    </motion.div>
  );
}

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { DUR, EASE_OUT } from "@/engine/canvas/motion";
import { cn } from "@/lib/utils";
import { ToyButton, ToyFrame } from "./shared";

let uid = 100;
const rand = () => Math.floor(Math.random() * 90) + 10;
const MAX = 4;

/**
 * Touch the stack: push slides a value onto the top, pop lifts it off. The top
 * cell — the only one push/pop ever act on — is the one wearing the active state
 * colour, so "LIFO" is something you feel, not read. Colour here IS a running
 * operation, which is exactly what chroma is reserved for.
 */
export function StackToy() {
  const [items, setItems] = useState(() => [
    { id: uid++, v: 5 },
    { id: uid++, v: 8 },
  ]);

  const push = () => setItems((s) => (s.length >= MAX ? s : [...s, { id: uid++, v: rand() }]));
  const pop = () => setItems((s) => s.slice(0, -1));

  return (
    <ToyFrame label="Stack — last in, first out" hint="push / pop">
      <div className="flex items-end gap-4">
        <div className="flex h-36 w-16 flex-col justify-end gap-1">
          <AnimatePresence initial={false} mode="popLayout">
            {[...items].reverse().map((it, ri) => {
              const isTop = ri === 0;
              return (
                <motion.div
                  key={it.id}
                  layout
                  initial={{ opacity: 0, y: -16, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -16, scale: 0.92 }}
                  transition={{ duration: DUR.base, ease: EASE_OUT }}
                  className={cn(
                    "grid h-7 shrink-0 place-items-center rounded-sm border font-mono text-sm",
                    isTop
                      ? "border-state-active bg-surface-3 text-fg"
                      : "border-line bg-surface-2 text-fg-muted",
                  )}
                >
                  {it.v}
                </motion.div>
              );
            })}
          </AnimatePresence>
          {items.length === 0 && (
            <div className="grid h-7 shrink-0 place-items-center rounded-sm border border-dashed border-line text-2xs text-fg-faint">
              empty
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <ToyButton onClick={push} disabled={items.length >= MAX} aria-label="Push a value onto the stack">
            <ArrowUp className="size-3.5" aria-hidden />
            push
          </ToyButton>
          <ToyButton onClick={pop} disabled={items.length === 0} aria-label="Pop the top value off the stack">
            <ArrowDown className="size-3.5" aria-hidden />
            pop
          </ToyButton>
          <p className="mt-0.5 max-w-[9rem] text-2xs leading-snug text-fg-faint">
            You only ever touch the top.
          </p>
        </div>
      </div>
    </ToyFrame>
  );
}

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LogIn, LogOut } from "lucide-react";
import { DUR, EASE_OUT, SPRING } from "@/engine/canvas/motion";
import { cn } from "@/lib/utils";
import { ToyButton, ToyFrame } from "./shared";

let uid = 300;
const rand = () => Math.floor(Math.random() * 90) + 10;
const MAX = 5;

/**
 * Touch the queue: enqueue slides a value in at the rear, dequeue pulls one off
 * the front and the rest shift down to fill the gap. The FRONT cell — the only
 * one dequeue ever acts on — wears the active state colour, so "FIFO" is the
 * opposite thing you feel from the Stack: a queue touches the first, not the last.
 */
export function QueueToy() {
  const [items, setItems] = useState(() => [
    { id: uid++, v: 5 },
    { id: uid++, v: 8 },
    { id: uid++, v: 3 },
  ]);

  const enqueue = () => setItems((q) => (q.length >= MAX ? q : [...q, { id: uid++, v: rand() }]));
  const dequeue = () => setItems((q) => q.slice(1));

  return (
    <ToyFrame label="Queue — first in, first out" hint="enqueue / dequeue">
      <div className="flex flex-col gap-3">
        <div className="flex h-16 items-center gap-1.5">
          <span className="shrink-0 text-2xs font-medium text-fg-faint">OUT →</span>
          <div className="flex flex-1 items-center gap-1.5">
            <AnimatePresence initial={false} mode="popLayout">
              {items.map((it, i) => {
                const isFront = i === 0;
                return (
                  <motion.div
                    key={it.id}
                    layout
                    initial={{ opacity: 0, x: 16, scale: 0.92 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -16, scale: 0.92 }}
                    transition={{ ...SPRING, opacity: { duration: DUR.base, ease: EASE_OUT } }}
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-sm border font-mono text-sm",
                      isFront
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
              <div className="grid h-9 flex-1 place-items-center rounded-sm border border-dashed border-line text-2xs text-fg-faint">
                empty
              </div>
            )}
          </div>
          <span className="shrink-0 text-2xs font-medium text-fg-faint">← IN</span>
        </div>

        {/* front / rear markers sit under the ends — the queue only ever touches the front. */}
        {items.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="w-[3.25rem] shrink-0" aria-hidden />
            <div className="flex flex-1 items-center justify-between">
              <span className="text-2xs text-state-active">front</span>
              {items.length > 1 && <span className="text-2xs text-fg-faint">rear</span>}
            </div>
            <span className="w-[2.5rem] shrink-0" aria-hidden />
          </div>
        )}

        <div className="flex items-center gap-2">
          <ToyButton onClick={enqueue} disabled={items.length >= MAX} aria-label="Enqueue a value at the rear">
            <LogIn className="size-3.5" aria-hidden />
            enqueue
          </ToyButton>
          <ToyButton onClick={dequeue} disabled={items.length === 0} aria-label="Dequeue the front value">
            <LogOut className="size-3.5" aria-hidden />
            dequeue
          </ToyButton>
          <p className="text-2xs text-fg-faint">You only ever leave from the front.</p>
        </div>
      </div>
    </ToyFrame>
  );
}

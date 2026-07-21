"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Shuffle } from "lucide-react";
import { SPRING } from "@/engine/canvas/motion";
import { cn } from "@/lib/utils";
import { ToyButton, ToyFrame } from "./shared";

let aid = 200;
const mk = (v: number) => ({ id: aid++, v });
const START = [5, 2, 8, 1, 9];

/**
 * Touch the array: tap two cells to swap them and watch the values SLIDE past
 * each other while the index rail below stays put — so "a swap moves the value,
 * not the position" is something you do. This is the atom every sort is built on.
 */
export function ArrayToy() {
  const [cells, setCells] = useState(() => START.map(mk));
  const [sel, setSel] = useState<number | null>(null);

  const tap = (idx: number) => {
    if (sel === null) return setSel(idx);
    if (sel === idx) return setSel(null);
    setCells((c) => {
      const n = [...c];
      [n[sel], n[idx]] = [n[idx], n[sel]];
      return n;
    });
    setSel(null);
  };

  const shuffle = () => {
    setSel(null);
    setCells((c) => {
      const n = [...c];
      for (let i = n.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [n[i], n[j]] = [n[j], n[i]];
      }
      return n;
    });
  };

  return (
    <ToyFrame label="Array — values in indexed slots" hint="tap two to swap">
      <div className="flex flex-col gap-3">
        <div>
          <div className="flex gap-1.5">
            {cells.map((cell, i) => {
              const selected = sel === i;
              return (
                <motion.button
                  key={cell.id}
                  layout
                  transition={SPRING}
                  type="button"
                  onClick={() => tap(i)}
                  aria-pressed={selected}
                  aria-label={`Value ${cell.v} at index ${i}`}
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-sm border font-mono text-sm transition-colors duration-[var(--duration-fast)] ease-out",
                    selected
                      ? "border-state-active bg-surface-3 text-fg"
                      : "border-line bg-surface-2 text-fg-muted hover:border-line-strong hover:text-fg",
                  )}
                >
                  {cell.v}
                </motion.button>
              );
            })}
          </div>
          {/* The index rail is fixed — it labels positions, not values, so it never moves. */}
          <div className="mt-1 flex gap-1.5">
            {cells.map((_, i) => (
              <span key={i} className="grid size-9 shrink-0 place-items-center font-mono text-2xs text-fg-faint">
                {i}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ToyButton onClick={shuffle} aria-label="Shuffle the array">
            <Shuffle className="size-3.5" aria-hidden />
            shuffle
          </ToyButton>
          <p className="text-2xs text-fg-faint">
            {sel === null ? "Tap a cell to pick it up." : "Tap another to swap them."}
          </p>
        </div>
      </div>
    </ToyFrame>
  );
}

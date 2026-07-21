"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus } from "lucide-react";
import { DUR, EASE_OUT } from "@/engine/canvas/motion";
import { cn } from "@/lib/utils";
import { ToyButton, ToyFrame } from "./shared";

let hid = 300;
const BUCKETS = 5;
const MAX = 6;
const rand = () => Math.floor(Math.random() * 90) + 10;

type Cell = { id: number; v: number };

/**
 * Touch the hash table: insert a value and watch it skip straight to bucket
 * (value % 5) — no scanning, the key computes its own address. The arithmetic
 * shows for a beat, the target bucket wears the active colour as the value drops
 * in, and two values landing in one bucket stack up: a collision you can see.
 */
export function HashToy() {
  const [buckets, setBuckets] = useState<Cell[][]>(() =>
    Array.from({ length: BUCKETS }, () => [] as Cell[]),
  );
  const [count, setCount] = useState(0);
  const [last, setLast] = useState<{ v: number; b: number } | null>(null);

  const insert = () => {
    if (count >= MAX) return;
    const v = rand();
    const b = v % BUCKETS;
    setLast({ v, b });
    setCount((c) => c + 1);
    setBuckets((bs) => bs.map((cells, i) => (i === b ? [...cells, { id: hid++, v }] : cells)));
  };

  const reset = () => {
    setBuckets(Array.from({ length: BUCKETS }, () => []));
    setCount(0);
    setLast(null);
  };

  const activeBucket = count > 0 ? last?.b : null;

  return (
    <ToyFrame label="Hash table — the key computes its address" hint="value % 5">
      <div className="flex flex-col gap-3">
        <div className="flex h-6 items-center">
          {last ? (
            <p className="font-mono text-2xs text-fg-muted">
              <span className="text-fg">{last.v}</span> % {BUCKETS} ={" "}
              <span className="text-state-active">{last.b}</span>
              <span className="ml-1.5 text-fg-faint">→ no scanning, straight to the bucket</span>
            </p>
          ) : (
            <p className="text-2xs text-fg-faint">Insert a value — it jumps to bucket (value % 5).</p>
          )}
        </div>

        <div>
          <div className="flex gap-1.5">
            {buckets.map((cells, i) => {
              const isActive = i === activeBucket;
              return (
                <div key={i} className="flex flex-1 flex-col items-stretch">
                  <div
                    className={cn(
                      "flex min-h-[4.5rem] flex-col justify-end gap-1 rounded-sm border p-1 transition-colors duration-[var(--duration-base)] ease-out",
                      isActive ? "border-state-active bg-surface-3" : "border-line bg-surface-2",
                    )}
                  >
                    <AnimatePresence initial={false}>
                      {cells.map((cell, ci) => {
                        const isNewest = isActive && ci === cells.length - 1;
                        return (
                          <motion.div
                            key={cell.id}
                            layout
                            initial={{ opacity: 0, y: -28, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: DUR.base, ease: EASE_OUT }}
                            className={cn(
                              "grid h-6 shrink-0 place-items-center rounded-sm border font-mono text-2xs",
                              isNewest
                                ? "border-state-active bg-surface-3 text-fg"
                                : "border-line bg-surface text-fg-muted",
                            )}
                          >
                            {cell.v}
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                  <span className="mt-1 grid place-items-center font-mono text-2xs text-fg-faint">{i}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ToyButton onClick={insert} disabled={count >= MAX} aria-label="Insert a random value into the hash table">
            <Plus className="size-3.5" aria-hidden />
            insert
          </ToyButton>
          <ToyButton onClick={reset} disabled={count === 0} aria-label="Clear the hash table">
            reset
          </ToyButton>
          <p className="text-2xs text-fg-faint">
            {count >= MAX ? "Full — reset to try again." : "Two in one bucket is a collision."}
          </p>
        </div>
      </div>
    </ToyFrame>
  );
}

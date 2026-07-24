"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ToyButton, ToyFrame } from "./shared";

const MIN_N = 4;
const MAX_N = 64;

/* Dot-run geometry, in viewBox units. One fixed viewBox for every row, left-
   aligned — same n, same slot width, so only the strategy differs. */
const SLOT = 4;
const VB_W = MAX_N * SLOT + 2;
const VB_H = 8;

/** Every count is COMPUTED from n in render — derived, never hardcoded. */
type Row = { key: string; label: string; count: (n: number) => number };
const ROWS: readonly Row[] = [
  { key: "one", label: "look once", count: () => 1 },
  { key: "each", label: "look at each", count: (n) => n },
  { key: "halve", label: "halve it", count: (n) => Math.ceil(Math.log2(n)) + 1 },
];

/**
 * Touch growth: drag n and three strategies re-count their looks — a flat 1, a
 * dot per item, and one dot per halving. "double it" doubles n and lights only
 * the DELTA dots, because the question is never "how fast" but "what does
 * doubling cost": flat gains nothing, linear gains n, halving gains exactly one.
 * Dot runs, not smooth curves — work is counted looks, not a shape drawn by
 * authority. (No n-squared row: three simultaneous shapes is the ceiling.)
 */
export function GrowthToy() {
  const [n, setN] = useState(8);
  // Two lifetimes: the delta highlight lasts one beat; the caption's arithmetic
  // stays until the learner moves n again.
  const [flashFrom, setFlashFrom] = useState<number | null>(null);
  const [doubledFrom, setDoubledFrom] = useState<number | null>(null);

  const flashT = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(flashT.current), []);

  const double = () => {
    if (n * 2 > MAX_N) return;
    window.clearTimeout(flashT.current);
    setFlashFrom(n);
    setDoubledFrom(n);
    setN(n * 2);
    flashT.current = window.setTimeout(() => setFlashFrom(null), 900);
  };

  const onSlider = (value: number) => {
    window.clearTimeout(flashT.current);
    setN(value);
    setFlashFrom(null);
    setDoubledFrom(null);
  };

  const caption =
    doubledFrom !== null
      ? `n doubled: ${ROWS.map((r) => `${r.label} gained ${r.count(n) - r.count(doubledFrom)}`).join(", ")}.`
      : n * 2 > MAX_N
        ? "Too big to double — drag n back down. The shapes never change."
        : "Each dot is one look. Doubling n asks each strategy for its price.";

  return (
    <ToyFrame label="Growth — count the looks" hint="drag n, then double it">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={MIN_N}
            max={MAX_N}
            step={1}
            value={n}
            onChange={(e) => onSlider(Number(e.target.value))}
            aria-label="Problem size n"
            className="min-w-0 flex-1 accent-accent"
          />
          <span className="shrink-0 font-mono text-xs text-fg">n = {n}</span>
        </div>

        <div className="flex flex-col gap-1.5">
          {ROWS.map((row) => {
            const count = row.count(n);
            const from = flashFrom !== null ? row.count(flashFrom) : null;
            return (
              <div key={row.key} className="flex items-center gap-2">
                <span className="w-18 shrink-0 text-2xs text-fg-muted">{row.label}</span>
                <svg
                  viewBox={`0 0 ${VB_W} ${VB_H}`}
                  preserveAspectRatio="xMinYMid meet"
                  className="h-2 min-w-0 flex-1"
                  aria-hidden
                >
                  {Array.from({ length: count }, (_, i) => (
                    <circle
                      key={i}
                      cx={2 + SLOT / 2 + i * SLOT}
                      cy={VB_H / 2}
                      r={1.7}
                      className={cn(
                        "transition-[fill] duration-[var(--duration-base)] ease-out",
                        from !== null && i >= from ? "fill-state-active" : "fill-fg-faint",
                      )}
                    />
                  ))}
                </svg>
                <span
                  className="w-7 shrink-0 text-right font-mono text-2xs text-fg-muted"
                  aria-label={`${count} looks`}
                >
                  {count}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ToyButton onClick={double} disabled={n * 2 > MAX_N} aria-label="Double n">
            <ChevronsRight className="size-3.5" aria-hidden />
            double it
          </ToyButton>
          <p className="min-w-0 text-2xs leading-snug text-fg-faint">{caption}</p>
        </div>
      </div>
    </ToyFrame>
  );
}

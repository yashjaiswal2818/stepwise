"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { RotateCcw } from "lucide-react";
import { DUR, EASE_OUT } from "@/engine/canvas/motion";
import { cn } from "@/lib/utils";
import { ToyButton, ToyFrame } from "./shared";

const CELLS = 10;
/** This stretch of memory happens to begin at 1024 — the rail counts from it. */
const BASE = 1024;
/** Addresses are DERIVED, never hardcoded per cell — an address is arithmetic. */
const addrOf = (i: number) => BASE + i;

const SMALL = 90;
const SMALL_AT = 2; // → address 1026
const BIG_AT = 5; //   → address 1029, the big value's first cell
const BIG_LEN = 4;

/** Numerals and addresses always read in mono, even mid-sentence. */
const mono = (v: number | string) => <span className="font-mono text-fg-muted">{v}</span>;

const DEFAULT_MSG = "Tap a cell — every cell has an address; none has a name.";

/**
 * Touch memory: a row of ten identical byte cells over a fixed address rail.
 * Tap a cell and the readout gives its address — computed as 1024 + i, nothing
 * more. "store 90" fills one cell; "store a big number" fills four consecutive
 * cells under a bracket whose address sits over the FIRST of them. Identical
 * cell size = memory is uniform, values are not; the rail never moves =
 * addresses label places, not contents; and no cell is ever labeled "score" —
 * names do not exist in the machine, so the label would be a lie.
 */
export function MemoryToy() {
  const [smallStored, setSmallStored] = useState(false);
  const [bigStored, setBigStored] = useState(false);
  const [sel, setSel] = useState<number | null>(null);
  const [flash, setFlash] = useState<"small" | "big" | null>(null);
  const [action, setAction] = useState<ReactNode>(null);

  const flashT = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(flashT.current), []);
  const flashFor = (kind: "small" | "big") => {
    window.clearTimeout(flashT.current);
    setFlash(kind);
    flashT.current = window.setTimeout(() => setFlash(null), 900);
  };

  const inBig = (i: number) => bigStored && i >= BIG_AT && i < BIG_AT + BIG_LEN;

  const tap = (i: number) => {
    setSel((cur) => (cur === i ? null : i));
    setAction(null);
  };

  const store90 = () => {
    setSmallStored(true);
    setSel(null);
    setAction(
      <>
        {mono(SMALL)} lives at {mono(addrOf(SMALL_AT))} — remember the address, not the value
      </>,
    );
    flashFor("small");
  };

  const storeBig = () => {
    setBigStored(true);
    setSel(null);
    setAction(
      <>
        a big number takes {mono(BIG_LEN)} cells — its address is {mono(addrOf(BIG_AT))}, the first
      </>,
    );
    flashFor("big");
  };

  const reset = () => {
    window.clearTimeout(flashT.current);
    setSmallStored(false);
    setBigStored(false);
    setSel(null);
    setFlash(null);
    setAction(null);
  };

  const pristine = !smallStored && !bigStored && sel === null;

  const readout: ReactNode =
    sel !== null ? (
      sel === SMALL_AT && smallStored ? (
        <>
          address {mono(addrOf(sel))} · holds {mono(SMALL)}
        </>
      ) : inBig(sel) ? (
        <>
          address {mono(addrOf(sel))} · inside the big value that starts at {mono(addrOf(BIG_AT))}
        </>
      ) : (
        <>address {mono(addrOf(sel))} · empty</>
      )
    ) : (
      (action ?? DEFAULT_MSG)
    );

  return (
    <ToyFrame label="Memory — numbered cells" hint="tap a cell to see its address">
      <div className="flex flex-col gap-3">
        <div className="flex min-h-6 items-center">
          <p className="text-2xs leading-snug text-fg-faint">{readout}</p>
        </div>

        <div className="max-w-sm">
          {/* Bracket row — height is reserved even when empty, so the cells and
              the address rail below NEVER move. */}
          <div className="grid h-6 grid-cols-10 gap-1">
            {bigStored && (
              <div className="relative" style={{ gridColumn: `${BIG_AT + 1} / span ${BIG_LEN}` }}>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: DUR.base, ease: EASE_OUT }}
                  className="absolute inset-x-0 bottom-0"
                >
                  {/* The bracket's address sits over its FIRST cell — a big
                      value's address is where it starts. */}
                  <span className="absolute bottom-1.5 left-0 whitespace-nowrap font-mono text-2xs text-fg-faint">
                    {addrOf(BIG_AT)} · {BIG_LEN} cells
                  </span>
                  <div className="h-1.5 rounded-t-xs border-x border-t border-line-strong" />
                </motion.div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-10 gap-1">
            {Array.from({ length: CELLS }, (_, i) => {
              const selected = sel === i;
              const holdsSmall = smallStored && i === SMALL_AT;
              const big = inBig(i);
              const flashing = (flash === "small" && holdsSmall) || (flash === "big" && big);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => tap(i)}
                  aria-pressed={selected}
                  aria-label={`Byte at address ${addrOf(i)} — ${
                    holdsSmall ? `holds ${SMALL}` : big ? "part of the big value" : "empty"
                  }`}
                  className={cn(
                    "grid h-9 min-w-0 place-items-center rounded-sm border font-mono text-xs transition-colors duration-[var(--duration-fast)] ease-out",
                    selected
                      ? "border-state-active bg-surface-3 text-fg"
                      : flashing
                        ? "border-state-final bg-surface-3 text-fg"
                        : holdsSmall
                          ? "border-line bg-surface-2 text-fg-muted hover:border-line-strong hover:text-fg"
                          : big
                            ? "border-line bg-surface-3 text-fg-muted hover:border-line-strong"
                            : "border-line bg-surface-2 text-fg-faint hover:border-line-strong hover:text-fg-muted",
                  )}
                >
                  {holdsSmall ? (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: DUR.base, ease: EASE_OUT }}
                    >
                      {SMALL}
                    </motion.span>
                  ) : (
                    ""
                  )}
                </button>
              );
            })}
          </div>

          {/* The address rail never moves — it labels places, not contents. */}
          <div className="mt-1 grid grid-cols-10 gap-1">
            {Array.from({ length: CELLS }, (_, i) => (
              <span key={i} className="min-w-0 text-center font-mono text-2xs text-fg-faint">
                {addrOf(i)}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ToyButton onClick={store90} disabled={smallStored} aria-label="Store 90 into one cell">
            store <span className="font-mono">{SMALL}</span>
          </ToyButton>
          <ToyButton onClick={storeBig} disabled={bigStored} aria-label="Store a big number across four cells">
            store a big number
          </ToyButton>
          <ToyButton onClick={reset} disabled={pristine} aria-label="Clear the memory row">
            <RotateCcw className="size-3.5" aria-hidden />
            reset
          </ToyButton>
        </div>
      </div>
    </ToyFrame>
  );
}

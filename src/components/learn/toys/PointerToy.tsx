"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, PenLine, RotateCcw, Trash2 } from "lucide-react";
import { DUR, EASE_OUT } from "@/engine/canvas/motion";
import { cn } from "@/lib/utils";
import { ToyButton, ToyFrame } from "./shared";

/** ListView's convention — synthetic but stable; the point is that they MATCH. */
const addressOf = (i: number) => 3200 + i * 400;

const START_VALUES = [7, 13] as const;
const WRITE_VALUE = 99;

/* Fixed canvas geometry (the GraphToy idiom). The SVG arrows and the HTML cells
   read the same constants, so the arrow genuinely leaves the contents cell —
   the thing doing the pointing. */
const W = 260;
const H = 136;
const VAR_X = 30; // left edge of the contents cell; the name sits OUTSIDE it
const VAR_W = 56;
const VAR_H = 32;
const VAR_Y = [20, 84] as const;
const BOX_X = 192;
const BOX_W = 56;
const BOX_H = 36;
const BOX_Y = [12, 76] as const;

type VarName = "a" | "b";
const VARS: VarName[] = ["a", "b"];

/** Numerals and addresses always read in mono, even mid-sentence. */
const mono = (v: number | string) => <span className="font-mono text-fg-muted">{v}</span>;

const DEFAULT_MSG = "Tap a variable, then a box — the variable will hold the box's address.";

/** A straight arrow whose colour states are CSS-driven, like the renderers. */
function Arrow({
  x1,
  y1,
  x2,
  y2,
  dashed,
  on,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  dashed: boolean;
  on: boolean;
}) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const head = 7;
  const wing = 3.5;
  const bx = x2 - head * Math.cos(ang);
  const by = y2 - head * Math.sin(ang);
  const px = -Math.sin(ang) * wing;
  const py = Math.cos(ang) * wing;
  const strokeCls = on ? "stroke-state-active" : dashed ? "stroke-state-path" : "stroke-line-strong";
  const fillCls = on ? "fill-state-active" : dashed ? "fill-state-path" : "fill-line-strong";
  return (
    <>
      <line
        x1={x1}
        y1={y1}
        x2={bx}
        y2={by}
        strokeWidth={on ? 2 : 1.5}
        strokeDasharray={dashed ? "5 4" : undefined}
        className={cn("transition-[stroke] duration-[var(--duration-base)] ease-out", strokeCls)}
      />
      <polygon
        points={`${x2},${y2} ${bx + px},${by + py} ${bx - px},${by - py}`}
        className={cn("transition-[fill] duration-[var(--duration-base)] ease-out", fillCls)}
      />
    </>
  );
}

/**
 * Touch a pointer: variables on the left (name outside — names live in source
 * code, not in the machine), heap boxes on the right with their addresses
 * printed beneath. Point a variable at a box and its contents become that box's
 * literal address — read the number in the cell, find the same number under the
 * box. Point b at the same box and there are two arrows, one box; change the
 * value THROUGH b and reading through a sees it — aliasing, shown not asserted.
 * Free the box and the target withdraws but the stale address is deliberately
 * KEPT: the dashed arrow is a dangling pointer, the address outliving the thing.
 */
export function PointerToy() {
  const [values, setValues] = useState<number[]>([...START_VALUES]);
  const [alive, setAlive] = useState<boolean[]>([true, true]);
  const [ptr, setPtr] = useState<Record<VarName, number | null>>({ a: null, b: null });
  const [sel, setSel] = useState<VarName | null>(null);
  const [flash, setFlash] = useState<{ v: VarName; box: number } | null>(null);
  const [msg, setMsg] = useState<ReactNode>(DEFAULT_MSG);

  const flashT = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(flashT.current), []);
  const flashFor = (v: VarName, box: number) => {
    window.clearTimeout(flashT.current);
    setFlash({ v, box });
    flashT.current = window.setTimeout(() => setFlash(null), 900);
  };

  const tapVar = (v: VarName) => {
    const next = sel === v ? null : v;
    setSel(next);
    setMsg(next === null ? DEFAULT_MSG : <>now tap a box — {mono(v)} will hold its address</>);
  };

  const tapBox = (i: number) => {
    if (sel === null) {
      setMsg("Tap a variable first — the arrow starts from its contents.");
      return;
    }
    const v = sel;
    const other: VarName = v === "a" ? "b" : "a";
    setPtr((p) => ({ ...p, [v]: i }));
    setSel(null);
    setMsg(
      ptr[other] === i ? (
        "Copying a pointer copies the address — there is still one box."
      ) : (
        <>
          {mono(v)} now holds {mono(addressOf(i))} — the address, not the value.
        </>
      ),
    );
  };

  const followA = () => {
    const box = ptr.a;
    if (box === null) return;
    flashFor("a", box);
    setMsg(
      alive[box] ? (
        <>
          {mono("a")} holds {mono(addressOf(box))} → the box at {mono(addressOf(box))} holds{" "}
          {mono(values[box])}.
        </>
      ) : (
        <>
          {mono("a")} holds {mono(addressOf(box))} → nothing lives at {mono(addressOf(box))} now.
          Reading it is the bug.
        </>
      ),
    );
  };

  const writeB = () => {
    const box = ptr.b;
    if (box === null || !alive[box]) return;
    setValues((vals) => vals.map((x, i) => (i === box ? WRITE_VALUE : x)));
    flashFor("b", box);
    setMsg(
      ptr.a === box ? (
        <>
          Wrote {mono(WRITE_VALUE)} through {mono("b")} — now follow {mono("a")}.
        </>
      ) : (
        <>
          Wrote {mono(WRITE_VALUE)} through {mono("b")} — the box at {mono(addressOf(box))} changed.
        </>
      ),
    );
  };

  const freeBox = () => {
    const box = ptr.a;
    if (box === null || !alive[box]) return;
    window.clearTimeout(flashT.current);
    setFlash(null);
    setAlive((al) => al.map((x, i) => (i === box ? false : x)));
    setMsg(
      <>
        {mono("a")} still holds {mono(addressOf(box))} — but {mono(addressOf(box))} holds nothing
        now. A dangling pointer: the address outlives the thing.
      </>,
    );
  };

  const reset = () => {
    window.clearTimeout(flashT.current);
    setValues([...START_VALUES]);
    setAlive([true, true]);
    setPtr({ a: null, b: null });
    setSel(null);
    setFlash(null);
    setMsg(DEFAULT_MSG);
  };

  const pristine =
    sel === null &&
    ptr.a === null &&
    ptr.b === null &&
    alive.every(Boolean) &&
    values.every((v, i) => v === START_VALUES[i]);

  return (
    <ToyFrame label="Pointers — a value that is an address" hint="tap a variable, then a box">
      <div className="flex flex-col gap-3">
        <div className="relative mx-auto" style={{ width: W, height: H }}>
          <svg className="absolute inset-0" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden>
            <AnimatePresence>
              {VARS.map((v, vi) => {
                const box = ptr[v];
                if (box === null) return null;
                return (
                  <motion.g
                    key={`${v}:${box}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: DUR.base, ease: EASE_OUT }}
                  >
                    {/* The arrow leaves the CONTENTS cell — the thing doing the
                        pointing — and it is just a drawing of the number in it. */}
                    <Arrow
                      x1={VAR_X + VAR_W}
                      y1={VAR_Y[vi] + VAR_H / 2}
                      x2={BOX_X - 2}
                      y2={BOX_Y[box] + BOX_H / 2}
                      dashed={!alive[box]}
                      on={flash?.v === v && flash.box === box}
                    />
                  </motion.g>
                );
              })}
            </AnimatePresence>
          </svg>

          {VARS.map((v, i) => (
            <div key={v}>
              <span
                className="absolute flex items-center justify-end pr-1.5 text-sm text-fg-muted"
                style={{ left: 6, top: VAR_Y[i], width: VAR_X - 8, height: VAR_H }}
                aria-hidden
              >
                {v}
              </span>
              <button
                type="button"
                onClick={() => tapVar(v)}
                aria-pressed={sel === v}
                aria-label={`Variable ${v} — holds ${
                  ptr[v] === null ? "nothing" : `address ${addressOf(ptr[v])}`
                }`}
                className={cn(
                  "absolute grid place-items-center rounded-sm border font-mono text-sm transition-colors duration-[var(--duration-fast)] ease-out",
                  sel === v
                    ? "border-state-active bg-surface-3 text-fg"
                    : "border-line bg-surface-2 text-fg-muted hover:border-line-strong hover:text-fg",
                )}
                style={{ left: VAR_X, top: VAR_Y[i], width: VAR_W, height: VAR_H }}
              >
                {ptr[v] === null ? "∅" : addressOf(ptr[v])}
              </button>
            </div>
          ))}

          {[0, 1].map((i) => (
            <div key={i}>
              <div className="absolute" style={{ left: BOX_X, top: BOX_Y[i], width: BOX_W, height: BOX_H }}>
                <AnimatePresence initial={false}>
                  {alive[i] ? (
                    <motion.button
                      key="live"
                      type="button"
                      onClick={() => tapBox(i)}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: DUR.base, ease: EASE_OUT }}
                      aria-label={`Box at address ${addressOf(i)} — holds ${values[i]}`}
                      className={cn(
                        "absolute inset-0 grid place-items-center rounded-sm border font-mono text-sm transition-colors duration-[var(--duration-fast)] ease-out",
                        flash?.box === i
                          ? "border-state-active bg-surface-3 text-fg"
                          : "border-line bg-surface-2 text-fg-muted hover:border-line-strong hover:text-fg",
                      )}
                    >
                      <motion.span
                        key={values[i]}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: DUR.base, ease: EASE_OUT }}
                      >
                        {values[i]}
                      </motion.span>
                    </motion.button>
                  ) : (
                    /* The box is gone; its outline stays dashed — and lights the
                       broken colour when a dangling read lands on it. */
                    <motion.div
                      key="ghost"
                      role="img"
                      aria-label={`Freed box — address ${addressOf(i)} holds nothing`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: DUR.base, ease: EASE_OUT }}
                      className={cn(
                        "absolute inset-0 rounded-sm border border-dashed transition-colors duration-[var(--duration-base)] ease-out",
                        flash?.box === i ? "border-state-path" : "border-line",
                      )}
                    />
                  )}
                </AnimatePresence>
              </div>
              {/* The address is a property of the PLACE — it stays when the box goes. */}
              <span
                className="absolute mt-0.5 text-center font-mono text-2xs text-fg-faint"
                style={{ left: BOX_X, top: BOX_Y[i] + BOX_H, width: BOX_W }}
              >
                {addressOf(i)}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ToyButton onClick={followA} disabled={ptr.a === null} aria-label="Follow the pointer in a">
            <ArrowRight className="size-3.5" aria-hidden />
            follow a
          </ToyButton>
          <ToyButton
            onClick={writeB}
            disabled={ptr.b === null || !alive[ptr.b]}
            aria-label="Change the pointed-to value through b"
          >
            <PenLine className="size-3.5" aria-hidden />
            change it through b
          </ToyButton>
          <ToyButton
            onClick={freeBox}
            disabled={ptr.a === null || !alive[ptr.a]}
            aria-label="Free the box a points to"
          >
            <Trash2 className="size-3.5" aria-hidden />
            free the box
          </ToyButton>
          <ToyButton onClick={reset} disabled={pristine} aria-label="Reset boxes and pointers">
            <RotateCcw className="size-3.5" aria-hidden />
            reset
          </ToyButton>
        </div>

        <p className="min-h-8 text-2xs leading-snug text-fg-faint">{msg}</p>
      </div>
    </ToyFrame>
  );
}

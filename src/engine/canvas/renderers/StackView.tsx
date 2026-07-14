"use client";

import { AnimatePresence, motion } from "motion/react";
import type { StackScene, ElementState } from "@/engine/types";
import { stateColor } from "@/design-system/state-palette";
import { SPRING } from "../motion";

const strokeFor = (s: ElementState) => (s === "default" ? "var(--state-default-border)" : stateColor(s));
const textFor = (s: ElementState) => (s === "default" ? "var(--state-default-fg)" : "var(--state-ink)");

const VB_W = 420;
const VB_H = 320;
const IN_W = 30;
const IN_GAP = 6;
const IN_Y = 22;
const FR_W = 92;
const FR_H = 32;
const FR_GAP = 6;
const BASE_Y = 292;

export function StackView({ scene }: { scene: StackScene }) {
  const input = scene.input;
  const inN = input?.cells.length ?? 0;
  const inTotalW = inN * IN_W + (inN - 1) * IN_GAP;
  const inStartX = (VB_W - inTotalW) / 2;
  const inX = (i: number) => inStartX + i * (IN_W + IN_GAP);

  const frameX = (VB_W - FR_W) / 2;
  const frameY = (i: number) => BASE_Y - FR_H - i * (FR_H + FR_GAP);
  const topIdx = scene.frames.length - 1;

  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid meet" className="h-full w-full">
      {input && (
        <>
          {input.label && (
            <text x={inStartX} y={IN_Y - 8} fontSize={10} fill="var(--text-faint)" fontFamily="var(--font-geist-mono)">
              {input.label}
            </text>
          )}
          {input.cells.map((c) => (
            <g key={c.id}>
              <rect
                x={inX(c.index)}
                y={IN_Y}
                width={IN_W}
                height={IN_W}
                rx={7}
                className="transition-[fill,stroke] duration-200"
                style={{ fill: stateColor(c.state), stroke: strokeFor(c.state) }}
                strokeWidth={1.4}
              />
              <text
                x={inX(c.index) + IN_W / 2}
                y={IN_Y + IN_W / 2 + 5}
                textAnchor="middle"
                fontSize={15}
                fontWeight={600}
                className="transition-[fill] duration-200"
                style={{ fill: textFor(c.state) }}
                fontFamily="var(--font-geist-mono)"
              >
                {c.value}
              </text>
            </g>
          ))}
          {input.pointer != null && input.pointer >= 0 && (
            <motion.path
              initial={false}
              animate={{ x: inX(input.pointer) + IN_W / 2 }}
              transition={SPRING}
              d={`M0 ${IN_Y + IN_W + 3} L-6 ${IN_Y + IN_W + 12} L6 ${IN_Y + IN_W + 12} Z`}
              fill="var(--brand)"
            />
          )}
        </>
      )}

      <line x1={frameX - 10} y1={BASE_Y} x2={frameX + FR_W + 10} y2={BASE_Y} stroke="var(--border-strong)" strokeWidth={2.5} strokeLinecap="round" />
      <text x={VB_W / 2} y={BASE_Y + 18} textAnchor="middle" fontSize={10} fill="var(--text-faint)" fontFamily="var(--font-geist-mono)">
        stack
      </text>

      <AnimatePresence>
        {scene.frames.map((f) => (
          <motion.g
            key={f.id}
            initial={{ opacity: 0, y: frameY(f.index) - 34 }}
            animate={{ opacity: 1, y: frameY(f.index) }}
            exit={{ opacity: 0, y: frameY(f.index) - 34, scale: 0.9 }}
            transition={{ y: SPRING, opacity: { duration: 0.2 }, scale: { duration: 0.2 } }}
          >
            <rect
              x={frameX}
              width={FR_W}
              height={FR_H}
              rx={8}
              className="transition-[fill,stroke] duration-200"
              style={{ fill: stateColor(f.state), stroke: strokeFor(f.state) }}
              strokeWidth={1.5}
            />
            <text
              x={VB_W / 2}
              y={FR_H / 2 + 6}
              textAnchor="middle"
              fontSize={16}
              fontWeight={600}
              className="transition-[fill] duration-200"
              style={{ fill: textFor(f.state) }}
              fontFamily="var(--font-geist-mono)"
            >
              {f.value}
            </text>
          </motion.g>
        ))}
      </AnimatePresence>

      {topIdx >= 0 && (
        <motion.text
          initial={false}
          animate={{ y: frameY(topIdx) + FR_H / 2 + 4 }}
          transition={SPRING}
          x={frameX + FR_W + 12}
          fontSize={10}
          fill="var(--text-muted)"
          fontFamily="var(--font-geist-mono)"
        >
          ← top
        </motion.text>
      )}
    </svg>
  );
}

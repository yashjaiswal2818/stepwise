"use client";

import { AnimatePresence, motion } from "motion/react";
import type { HashScene, ElementState } from "@/engine/types";
import { stateColor } from "@/design-system/state-palette";
import { SPRING } from "../motion";

const strokeFor = (s: ElementState) => (s === "default" ? "var(--state-default-border)" : stateColor(s));
const textFor = (s: ElementState) => (s === "default" ? "var(--state-default-fg)" : "var(--state-ink)");
const fillFor = (s: ElementState) => (s === "default" ? "var(--surface-2)" : stateColor(s));

const VB_W = 460;
const VB_H = 300;
const IN_W = 34;
const IN_GAP = 8;
const IN_Y = 34;
const MAP_X = 40;
const MAP_Y = 100;
const MAP_W = 380;
const MAP_H = 176;
const PILL_W = 74;
const PILL_H = 32;
const GX = 10;
const GY = 12;
const PER_ROW = 4;

export function HashTableView({ scene }: { scene: HashScene }) {
  const input = scene.input;
  const inN = input?.cells.length ?? 0;
  const inTotalW = inN * IN_W + (inN - 1) * IN_GAP;
  const inStartX = (VB_W - inTotalW) / 2;
  const inX = (i: number) => inStartX + i * (IN_W + IN_GAP);

  const startX = MAP_X + 18;
  const startY = MAP_Y + 44;
  const px = (idx: number) => startX + (idx % PER_ROW) * (PILL_W + GX);
  const py = (idx: number) => startY + Math.floor(idx / PER_ROW) * (PILL_H + GY);

  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid meet" className="h-full w-full">
      {input && (
        <>
          {input.label && (
            <text x={inStartX} y={14} fontSize={10} fill="var(--text-faint)" fontFamily="var(--font-geist-mono)">
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
              <text x={inX(c.index) + IN_W / 2} y={IN_Y + IN_W + 12} textAnchor="middle" fontSize={9} fill="var(--text-faint)" fontFamily="var(--font-geist-mono)">
                {c.index}
              </text>
            </g>
          ))}
          {input.pointer != null && input.pointer >= 0 && (
            <motion.path
              initial={false}
              animate={{ x: inX(input.pointer) + IN_W / 2 }}
              transition={SPRING}
              d={`M0 ${IN_Y - 3} L-6 ${IN_Y - 12} L6 ${IN_Y - 12} Z`}
              fill="var(--brand)"
            />
          )}
        </>
      )}

      <rect x={MAP_X} y={MAP_Y} width={MAP_W} height={MAP_H} rx={14} fill="var(--surface)" stroke="var(--border)" />
      <text x={MAP_X + 16} y={MAP_Y + 24} fontSize={11} fill="var(--text-muted)" fontFamily="var(--font-geist-mono)">
        {scene.mapLabel ?? "map"}
      </text>
      {scene.lookupKey && (
        <>
          <rect x={MAP_X + MAP_W - 104} y={MAP_Y + 10} width={88} height={20} rx={6} fill="var(--brand-soft)" stroke="var(--brand)" />
          <text x={MAP_X + MAP_W - 60} y={MAP_Y + 24} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--brand-strong)" fontFamily="var(--font-geist-mono)">
            need {scene.lookupKey}
          </text>
        </>
      )}
      {scene.entries.length === 0 && (
        <text x={MAP_X + MAP_W / 2} y={MAP_Y + MAP_H / 2 + 6} textAnchor="middle" fontSize={11} fill="var(--text-faint)" fontFamily="var(--font-geist-mono)">
          empty
        </text>
      )}

      <AnimatePresence>
        {scene.entries.map((e, idx) => (
          <motion.g
            key={e.id}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1, x: px(idx), y: py(idx) }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ x: SPRING, y: SPRING, opacity: { duration: 0.2 }, scale: { duration: 0.2 } }}
          >
            <rect
              width={PILL_W}
              height={PILL_H}
              rx={8}
              className="transition-[fill,stroke] duration-200"
              style={{ fill: fillFor(e.state), stroke: strokeFor(e.state) }}
              strokeWidth={1.4}
            />
            <text
              x={PILL_W / 2}
              y={PILL_H / 2 + 5}
              textAnchor="middle"
              fontSize={13}
              fontWeight={600}
              className="transition-[fill] duration-200"
              style={{ fill: textFor(e.state) }}
              fontFamily="var(--font-geist-mono)"
            >
              {e.key} → {e.value}
            </text>
          </motion.g>
        ))}
      </AnimatePresence>
    </svg>
  );
}

"use client";

import { AnimatePresence, motion } from "motion/react";
import type { QueueScene, ElementState } from "@/engine/types";
import { stateColor } from "@/design-system/state-palette";
import { SPRING } from "../motion";

const strokeFor = (s: ElementState) => (s === "default" ? "var(--state-default-border)" : stateColor(s));
const textFor = (s: ElementState) => (s === "default" ? "var(--state-default-fg)" : "var(--state-ink)");
const fillFor = (s: ElementState) => (s === "default" ? "var(--surface-2)" : stateColor(s));

const IW = 50;
const GAP = 12;
const PAD = 84;
const Y = 74;
const VB_H = 150;

export function QueueView({ scene }: { scene: QueueScene }) {
  const n = scene.items.length;
  const cx = (i: number) => PAD + i * (IW + GAP);
  const VB_W = PAD * 2 + Math.max(n, 3) * (IW + GAP) - GAP;

  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid meet" className="h-full w-full">
      {/* lane */}
      <rect x={PAD - 12} y={Y - IW / 2 - 8} width={VB_W - 2 * (PAD - 12)} height={IW + 16} rx={12} fill="none" stroke="var(--border)" strokeDasharray="5 5" />

      {/* front (out) / rear (in) markers */}
      <text x={PAD - 30} y={Y - 4} textAnchor="end" fontSize={11} fontWeight={600} fill="var(--text-muted)" fontFamily="var(--font-geist-mono)">front</text>
      <text x={PAD - 30} y={Y + 12} textAnchor="end" fontSize={9} fill="var(--text-faint)" fontFamily="var(--font-geist-mono)">out ←</text>
      <text x={VB_W - PAD + 30} y={Y - 4} textAnchor="start" fontSize={11} fontWeight={600} fill="var(--text-muted)" fontFamily="var(--font-geist-mono)">rear</text>
      <text x={VB_W - PAD + 30} y={Y + 12} textAnchor="start" fontSize={9} fill="var(--text-faint)" fontFamily="var(--font-geist-mono)">← in</text>

      <AnimatePresence>
        {scene.items.map((c) => (
          <motion.g
            key={c.id}
            initial={{ opacity: 0, x: cx(n) - IW / 2, y: Y - IW / 2 }}
            animate={{ opacity: 1, x: cx(c.index) - IW / 2, y: Y - IW / 2 }}
            exit={{ opacity: 0, x: cx(-1) - IW / 2, y: Y - IW / 2 }}
            transition={{ x: SPRING, opacity: { duration: 0.2 } }}
          >
            <rect
              width={IW}
              height={IW}
              rx={9}
              className="transition-[fill,stroke] duration-200"
              style={{ fill: fillFor(c.state), stroke: strokeFor(c.state) }}
              strokeWidth={1.5}
            />
            <text
              x={IW / 2}
              y={IW / 2 + 6}
              textAnchor="middle"
              fontSize={17}
              fontWeight={600}
              className="transition-[fill] duration-200"
              style={{ fill: textFor(c.state) }}
              fontFamily="var(--font-geist-mono)"
            >
              {c.value}
            </text>
          </motion.g>
        ))}
      </AnimatePresence>

      {n === 0 && (
        <text x={VB_W / 2} y={Y + 5} textAnchor="middle" fontSize={12} fill="var(--text-faint)" fontFamily="var(--font-geist-mono)">
          empty queue
        </text>
      )}
    </svg>
  );
}

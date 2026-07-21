"use client";

import { AnimatePresence, motion } from "motion/react";
import type { QueueScene, ElementState } from "@/engine/types";
import { stateColor, stateFill } from "@/design-system/state-palette";
import { DUR, EASE_OUT, SPRING } from "../motion";

const strokeFor = (s: ElementState) => (s === "default" ? "var(--state-default-border)" : stateColor(s));
const textFor = (s: ElementState) => (s === "default" ? "var(--state-default-fg)" : "var(--state-ink)");
const fillFor = (s: ElementState) => (s === "default" ? "var(--surface-2)" : stateFill(s));

const IW = 50;
const GAP = 12;
const PAD = 84;
const Y = 74;
const VB_H = 150;

export function QueueView({ scene }: { scene: QueueScene }) {
  const n = scene.items.length;
  const cx = (i: number) => PAD + i * (IW + GAP);
  const slots = Math.max(n, 3); // keep a readable lane when the queue is nearly empty
  const VB_W = PAD * 2 + slots * (IW + GAP) - GAP;

  /* cx() is a cell's CENTRE, so the lane has to be derived from cell EDGES.
     Deriving it from the padding directly left the front cell hanging outside
     the lane that is supposed to contain it, with dead space at the rear. */
  const LANE_PAD = 12;
  const laneX = cx(0) - IW / 2 - LANE_PAD;
  const laneRight = cx(slots - 1) + IW / 2 + LANE_PAD;

  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid meet" className="h-full w-full">
      {/* the lane: items live between front and rear */}
      <rect x={laneX} y={Y - IW / 2 - 8} width={laneRight - laneX} height={IW + 16} rx={10} fill="none" stroke="var(--border)" strokeDasharray="5 5" />

      {/* front (out) / rear (in) markers, anchored to the lane's real edges */}
      <text x={laneX - 8} y={Y - 4} textAnchor="end" fontSize={11} fontWeight={600} fill="var(--text-muted)" fontFamily="var(--font-mono)">front</text>
      <text x={laneX - 8} y={Y + 12} textAnchor="end" fontSize={9} fill="var(--text-muted)" fontFamily="var(--font-mono)">out ←</text>
      <text x={laneRight + 8} y={Y - 4} textAnchor="start" fontSize={11} fontWeight={600} fill="var(--text-muted)" fontFamily="var(--font-mono)">rear</text>
      <text x={laneRight + 8} y={Y + 12} textAnchor="start" fontSize={9} fill="var(--text-muted)" fontFamily="var(--font-mono)">← in</text>

      <AnimatePresence>
        {scene.items.map((c) => (
          <motion.g
            key={c.id}
            initial={{ opacity: 0, x: cx(n) - IW / 2, y: Y - IW / 2 }}
            animate={{ opacity: 1, x: cx(c.index) - IW / 2, y: Y - IW / 2 }}
            exit={{ opacity: 0, x: cx(-1) - IW / 2, y: Y - IW / 2 }}
            transition={{ x: SPRING, opacity: { duration: DUR.base, ease: EASE_OUT } }}
          >
            <rect
              width={IW}
              height={IW}
              rx={7}
              className="transition-[fill,stroke] duration-[var(--duration-base)] ease-out"
              style={{ fill: fillFor(c.state), stroke: strokeFor(c.state) }}
              strokeWidth={1.5}
            />
            <text
              x={IW / 2}
              y={IW / 2 + 6}
              textAnchor="middle"
              fontSize={17}
              fontWeight={600}
              className="transition-[fill] duration-[var(--duration-base)] ease-out"
              style={{ fill: textFor(c.state) }}
              fontFamily="var(--font-mono)"
            >
              {c.value}
            </text>
          </motion.g>
        ))}
      </AnimatePresence>

      {n === 0 && (
        <text x={VB_W / 2} y={Y + 5} textAnchor="middle" fontSize={12} fill="var(--text-muted)" fontFamily="var(--font-mono)">
          empty queue
        </text>
      )}
    </svg>
  );
}

"use client";

import { AnimatePresence, motion } from "motion/react";
import type { ArrayScene, Cell, ElementState } from "@/engine/types";
import { stateColor, stateFill } from "@/design-system/state-palette";
import { arrayLayout } from "../layout/arrayLayout";
import { DUR, EASE_OUT, POP_SPRING, SPRING } from "../motion";

/** Transient examination states lift the cell slightly for a physical "beat" per step. */
const LIFT_STATES = new Set<ElementState>(["active", "compare", "swap"]);

function strokeFor(s: ElementState) {
  return s === "default" ? "var(--state-default-border)" : stateColor(s);
}
function textFor(s: ElementState) {
  return s === "default" ? "var(--state-default-fg)" : "var(--state-ink)";
}

export function ArrayView({ scene }: { scene: ArrayScene }) {
  const { pos, slotCenterX, cellW, cellH, cellY, viewW, viewH } = arrayLayout(scene.cells);
  const hasAux = !!scene.aux;
  const auxLabelY = viewH + 10;
  const auxY = viewH + 20;
  const totalH = hasAux ? auxY + cellH + 10 : viewH;

  return (
    <svg viewBox={`0 0 ${viewW} ${totalH}`} preserveAspectRatio="xMidYMid meet" className="h-full w-full">
      {/* regions (subarrays / windows) drawn behind cells */}
      {scene.regions.map((r) => {
        const xs = r.covers.map((id) => pos[id]?.x).filter((x): x is number => x != null);
        if (!xs.length) return null;
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs) + cellW;
        return (
          <g key={r.id}>
            <motion.rect
              initial={false}
              animate={{ x: minX - 6, width: maxX - minX + 12 }}
              transition={SPRING}
              y={cellY - 6}
              height={cellH + 12}
              rx={12}
              fill={`color-mix(in oklab, ${stateColor(r.state)} 12%, transparent)`}
              stroke={stateColor(r.state)}
              strokeWidth={1.25}
              strokeDasharray="5 4"
            />
            {r.label && (
              <motion.text
                initial={false}
                animate={{ x: minX - 2 }}
                transition={SPRING}
                y={cellY - 10}
                fontSize={9.5}
                fontWeight={600}
                fill={stateColor(r.state)}
                fontFamily="var(--font-mono)"
              >
                {r.label}
              </motion.text>
            )}
          </g>
        );
      })}

      {/* cells */}
      <AnimatePresence>
        {scene.cells.map((c: Cell) => (
          <motion.g
            key={c.id}
            initial={{ opacity: 0, y: cellY + 10 }}
            animate={{
              x: pos[c.id].x,
              y: pos[c.id].y,
              opacity: 1,
              scale: LIFT_STATES.has(c.state) ? 1.08 : 1,
            }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ x: SPRING, y: SPRING, opacity: { duration: DUR.base, ease: EASE_OUT }, scale: POP_SPRING }}
          >
            <rect
              width={cellW}
              height={cellH}
              rx={10}
              className="transition-[fill,stroke] duration-[var(--duration-base)] ease-out"
              style={{ fill: stateFill(c.state), stroke: strokeFor(c.state) }}
              strokeWidth={1.5}
            />
            <text
              x={cellW / 2}
              y={cellH / 2 + 6}
              textAnchor="middle"
              className="transition-[fill] duration-[var(--duration-base)] ease-out"
              style={{ fill: textFor(c.state) }}
              fontSize={19}
              fontWeight={600}
              fontFamily="var(--font-mono)"
            >
              {c.value}
            </text>
          </motion.g>
        ))}
      </AnimatePresence>

      {/* pointer chips — pointers sharing a cell merge into one labelled chip */}
      {(() => {
        const byTarget = new Map<string, typeof scene.pointers>();
        for (const p of scene.pointers) {
          const arr = byTarget.get(p.target) ?? [];
          arr.push(p);
          byTarget.set(p.target, arr);
        }
        return [...byTarget.entries()].map(([targetId, ptrs]) => {
          const target = pos[targetId];
          if (!target) return null;
          const cx = target.x + cellW / 2;
          const label = ptrs.map((p) => p.label).join(" ");
          const w = Math.max(24, label.length * 7.2 + 12);
          const color = ptrs[0].color ?? "var(--state-active)";
          return (
            <motion.g key={targetId} initial={false} animate={{ x: cx }} transition={SPRING}>
              <rect x={-w / 2} y={cellY - 32} width={w} height={18} rx={5} fill={color} />
              <text x={0} y={cellY - 19} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--state-ink)" fontFamily="var(--font-mono)">
                {label}
              </text>
              <path d={`M0 ${cellY - 4} l-5 -8 h10 z`} fill={color} />
            </motion.g>
          );
        });
      })()}

      {/* index ticks */}
      {slotCenterX.map((x, i) => (
        <text key={i} x={x} y={viewH - 7} textAnchor="middle" fontSize={11} fill="var(--text-faint)" fontFamily="var(--font-mono)">
          {i}
        </text>
      ))}

      {/* aux row (merge buffer) */}
      {scene.aux && (
        <>
          <text x={6} y={auxLabelY} fontSize={10} fill="var(--text-faint)" fontFamily="var(--font-mono)">
            {scene.aux.label ?? "buffer"}
          </text>
          <AnimatePresence>
            {scene.aux.cells.map((c) => (
              <motion.g
                key={c.id}
                initial={{ opacity: 0, y: auxY + 12 }}
                animate={{ opacity: 1, x: slotCenterX[c.index] - cellW / 2, y: auxY }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ x: SPRING, y: SPRING, opacity: { duration: DUR.base, ease: EASE_OUT }, scale: { duration: DUR.base, ease: EASE_OUT } }}
              >
                <rect
                  width={cellW}
                  height={cellH}
                  rx={10}
                  className="transition-[fill,stroke] duration-[var(--duration-base)] ease-out"
                  style={{ fill: stateFill(c.state), stroke: strokeFor(c.state) }}
                  strokeWidth={1.5}
                />
                <text
                  x={cellW / 2}
                  y={cellH / 2 + 6}
                  textAnchor="middle"
                  fontSize={19}
                  fontWeight={600}
                  style={{ fill: textFor(c.state) }}
                  fontFamily="var(--font-mono)"
                >
                  {c.value}
                </text>
              </motion.g>
            ))}
          </AnimatePresence>
        </>
      )}
    </svg>
  );
}

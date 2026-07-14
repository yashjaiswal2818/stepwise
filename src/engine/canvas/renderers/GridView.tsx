"use client";

import { AnimatePresence, motion } from "motion/react";
import type { GridScene, GridCell, Frame, ElementState } from "@/engine/types";
import { stateColor } from "@/design-system/state-palette";

const CS = 44;
const GAP = 4;
const PAD = 14;

const fill = (c: GridCell) => {
  if (c.passable === false) return "var(--surface-3)";
  if (c.state === "default") {
    if (c.weight && c.weight > 1) {
      return `color-mix(in oklab, var(--state-frontier) ${Math.min(30, c.weight * 7)}%, var(--surface-2))`;
    }
    return "var(--surface-2)";
  }
  return stateColor(c.state);
};
const stroke = (c: GridCell) =>
  c.state === "default" || c.passable === false ? "var(--border)" : stateColor(c.state);
const ink = (c: GridCell) =>
  c.state === "default" || c.passable === false ? "var(--text-muted)" : "var(--state-ink)";

function FrontierPanel({ frames, label }: { frames: Frame[]; label?: string }) {
  return (
    <div className="flex w-24 shrink-0 flex-col gap-1.5 rounded-xl border border-line bg-surface/50 p-2">
      <span className="pb-1 text-center text-[10px] font-medium text-fg-faint">{label ?? "frontier"}</span>
      <AnimatePresence mode="popLayout">
        {frames.map((f) => (
          <motion.div
            key={f.id}
            layout
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.2 }}
            className="rounded-lg border px-2 py-1 text-center font-mono text-xs"
            style={{
              borderColor: f.state === "default" ? "var(--border)" : stateColor(f.state),
              background:
                f.state === "default"
                  ? "var(--surface-2)"
                  : `color-mix(in oklab, ${stateColor(f.state)} 16%, var(--surface))`,
              color: "var(--text)",
            }}
          >
            {f.value}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function GridView({ scene }: { scene: GridScene }) {
  const W = scene.cols * (CS + GAP) - GAP;
  const H = scene.rows * (CS + GAP) - GAP;
  const x = (c: number) => PAD + c * (CS + GAP);
  const y = (r: number) => PAD + r * (CS + GAP);
  const hasFrontier = !!scene.frontier && scene.frontier.length > 0;

  return (
    <div className="flex h-full w-full items-stretch gap-3">
      <svg viewBox={`0 0 ${W + PAD * 2} ${H + PAD * 2}`} preserveAspectRatio="xMidYMid meet" className="h-full min-w-0 flex-1">
        {scene.cells.map((c) => (
          <g key={c.id}>
            <rect
              x={x(c.c)}
              y={y(c.r)}
              width={CS}
              height={CS}
              rx={8}
              className="transition-[fill,stroke] duration-200"
              style={{ fill: fill(c), stroke: stroke(c) }}
              strokeWidth={1.5}
            />
            {c.weight != null && c.weight > 1 && c.passable !== false && (
              <text x={x(c.c) + 6} y={y(c.r) + 13} fontSize={9} fontWeight={700} fill="var(--state-frontier)" fontFamily="var(--font-geist-mono)">
                {c.weight}
              </text>
            )}
            {c.value != null && c.value !== "" && (
              <text
                x={x(c.c) + CS / 2}
                y={y(c.r) + CS / 2 + 5}
                textAnchor="middle"
                fontSize={14}
                fontWeight={600}
                className="transition-[fill] duration-200"
                style={{ fill: ink(c) }}
                fontFamily="var(--font-geist-mono)"
              >
                {c.value}
              </text>
            )}
          </g>
        ))}
      </svg>
      {hasFrontier && <FrontierPanel frames={scene.frontier!} label={scene.label} />}
    </div>
  );
}

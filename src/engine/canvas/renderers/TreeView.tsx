"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { TreeScene, Frame, ElementState } from "@/engine/types";
import { stateColor, stateFill } from "@/design-system/state-palette";
import { treeLayout } from "../layout/treeLayout";
import { DUR, EASE_OUT, SPRING } from "../motion";

const R = 20;
const strokeFor = (s: ElementState) => (s === "default" ? "var(--state-default-border)" : stateColor(s));
const textFor = (s: ElementState) => (s === "default" ? "var(--text)" : "var(--state-ink)");
const nodeFill = (s: ElementState) => (s === "default" ? "var(--surface-2)" : stateFill(s));

function CallStack({ frames }: { frames: Frame[] }) {
  return (
    <div className="flex w-24 shrink-0 flex-col justify-end gap-1.5 rounded-xl border border-line bg-surface/50 p-2">
      <span className="pb-1 text-center text-2xs font-medium text-fg-faint">call stack</span>
      <AnimatePresence mode="popLayout">
        {[...frames].reverse().map((f) => (
          <motion.div
            key={f.id}
            layout
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: DUR.base, ease: EASE_OUT }}
            className="rounded-lg border px-2 py-1.5 text-center font-mono text-xs"
            style={{
              borderColor: f.state === "active" ? "var(--state-active)" : "var(--border)",
              background: f.state === "active" ? "color-mix(in oklab, var(--state-active) 15%, var(--surface))" : "var(--surface-2)",
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

export function TreeView({ scene }: { scene: TreeScene }) {
  const sig = scene.nodes.map((n) => n.id).join(",") + "|" + scene.edges.map((e) => e.id).join(",");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const { pos, viewW, viewH } = useMemo(() => treeLayout(scene.nodes, scene.edges), [sig]);
  const hasStack = !!scene.callStack && scene.callStack.length > 0;

  return (
    <div className="flex h-full w-full items-stretch gap-3">
      <svg viewBox={`0 0 ${viewW} ${viewH}`} preserveAspectRatio="xMidYMid meet" className="h-full min-w-0 flex-1">
        {scene.edges.map((e) => {
          const a = pos[e.source];
          const b = pos[e.target];
          if (!a || !b) return null;
          return <line key={e.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--border-strong)" strokeWidth={1.6} />;
        })}
        {scene.nodes.map((n) => {
          const p = pos[n.id];
          if (!p) return null;
          return (
            <g key={n.id}>
              <motion.circle
                initial={false}
                animate={{ cx: p.x, cy: p.y }}
                transition={SPRING}
                r={R}
                className="transition-[fill,stroke] duration-[var(--duration-base)] ease-out"
                style={{ fill: nodeFill(n.state), stroke: strokeFor(n.state) }}
                strokeWidth={1.8}
              />
              <motion.text
                initial={false}
                animate={{ x: p.x, y: p.y + 5 }}
                transition={SPRING}
                textAnchor="middle"
                fontSize={15}
                fontWeight={600}
                className="transition-[fill] duration-[var(--duration-base)] ease-out"
                style={{ fill: textFor(n.state) }}
                fontFamily="var(--font-mono)"
              >
                {n.value}
              </motion.text>
              {n.label && (
                <motion.g initial={false} animate={{ x: p.x + R - 3, y: p.y - R + 3 }} transition={SPRING}>
                  <circle r={9} fill="var(--state-visited)" stroke="var(--bg)" strokeWidth={1.5} />
                  <text textAnchor="middle" y={3.5} fontSize={10} fontWeight={700} fill="var(--state-ink)" fontFamily="var(--font-mono)">
                    {n.label}
                  </text>
                </motion.g>
              )}
            </g>
          );
        })}
      </svg>
      {hasStack && <CallStack frames={scene.callStack!} />}
    </div>
  );
}

"use client";

import { AnimatePresence, motion } from "motion/react";
import type { GraphScene, ElementState, Frame } from "@/engine/types";
import { stateColor, stateFill } from "@/design-system/state-palette";
import { DUR, EASE_OUT } from "../motion";

const R = 22;
const strokeFor = (s: ElementState) => (s === "default" ? "var(--state-default-border)" : stateColor(s));
const textFor = (s: ElementState) => (s === "default" ? "var(--text)" : "var(--state-ink)");
const nodeFill = (s: ElementState) => (s === "default" ? "var(--surface-2)" : stateFill(s));
const edgeStroke = (s: ElementState) => (s === "default" ? "var(--border-strong)" : stateColor(s));

function FrontierPanel({ frames, label }: { frames: Frame[]; label?: string }) {
  return (
    <div className="flex w-24 shrink-0 flex-col gap-1.5 rounded-xl border border-line bg-surface/50 p-2">
      <span className="pb-1 text-center text-2xs font-medium text-fg-faint">{label ?? "queue"}</span>
      <AnimatePresence mode="popLayout">
        {frames.map((f) => (
          <motion.div
            key={f.id}
            layout
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: DUR.base, ease: EASE_OUT }}
            className="rounded-lg border px-2 py-1 text-center font-mono text-xs"
            style={{
              borderColor: f.state === "default" ? "var(--border)" : stateColor(f.state),
              background: f.state === "default" ? "var(--surface-2)" : `color-mix(in oklab, ${stateColor(f.state)} 16%, var(--surface))`,
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

export function GraphView({ scene }: { scene: GraphScene }) {
  const pos = new Map(scene.nodes.map((n) => [n.id, { x: n.x ?? 0, y: n.y ?? 0 }]));
  const xs = scene.nodes.map((n) => n.x ?? 0);
  const ys = scene.nodes.map((n) => n.y ?? 0);
  const minX = Math.min(...xs) - 36;
  const minY = Math.min(...ys) - 36;
  const W = Math.max(...xs) + 36 - minX;
  const H = Math.max(...ys) + 36 - minY;
  const hasFrontier = !!scene.frontier && scene.frontier.length > 0;

  return (
    <div className="flex h-full w-full items-stretch gap-3">
      <svg viewBox={`${minX} ${minY} ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="h-full min-w-0 flex-1">
        {scene.edges.map((e) => {
          const a = pos.get(e.source);
          const b = pos.get(e.target);
          if (!a || !b) return null;
          return (
            <line
              key={e.id}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              className="transition-[stroke] duration-[var(--duration-base)] ease-out"
              style={{ stroke: edgeStroke(e.state) }}
              strokeWidth={e.state === "default" ? 1.6 : 2.6}
            />
          );
        })}
        {scene.nodes.map((n) => {
          const p = pos.get(n.id)!;
          return (
            <g key={n.id}>
              <circle
                cx={p.x}
                cy={p.y}
                r={R}
                className="transition-[fill,stroke] duration-[var(--duration-base)] ease-out"
                style={{ fill: nodeFill(n.state), stroke: strokeFor(n.state) }}
                strokeWidth={1.8}
              />
              <text
                x={p.x}
                y={p.y + 5}
                textAnchor="middle"
                fontSize={15}
                fontWeight={600}
                className="transition-[fill] duration-[var(--duration-base)] ease-out"
                style={{ fill: textFor(n.state) }}
                fontFamily="var(--font-mono)"
              >
                {n.value}
              </text>
            </g>
          );
        })}
      </svg>
      {hasFrontier && <FrontierPanel frames={scene.frontier!} label={scene.label} />}
    </div>
  );
}

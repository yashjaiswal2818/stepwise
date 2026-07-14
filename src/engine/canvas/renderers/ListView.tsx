"use client";

import { AnimatePresence, motion } from "motion/react";
import type { ListScene, ElementState } from "@/engine/types";
import { stateColor } from "@/design-system/state-palette";
import { SPRING } from "../motion";

const R = 22;
const GAP = 92;
const PADX = 48;
const Y = 90;
const VB_H = 208;

const strokeFor = (s: ElementState) => (s === "default" ? "var(--state-default-border)" : stateColor(s));
const textFor = (s: ElementState) => (s === "default" ? "var(--state-default-fg)" : "var(--state-ink)");
const nodeFill = (s: ElementState) => (s === "default" ? "var(--surface-2)" : stateColor(s));
const edgeStroke = (s: ElementState) => (s === "default" ? "var(--border-strong)" : stateColor(s));

export function ListView({ scene }: { scene: ListScene }) {
  const idx = new Map(scene.nodes.map((n, i) => [n.id, i]));
  const cx = (i: number) => PADX + i * GAP;
  const n = scene.nodes.length;
  const VB_W = PADX * 2 + (n - 1) * GAP;

  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid meet" className="h-full w-full">
      <defs>
        <marker id="ll-arrow" markerWidth="7" markerHeight="7" refX="5.5" refY="3" orient="auto" markerUnits="userSpaceOnUse">
          <path d="M0 0 L6 3 L0 6 z" fill="var(--border-strong)" />
        </marker>
        <marker id="ll-arrow-hi" markerWidth="7" markerHeight="7" refX="5.5" refY="3" orient="auto" markerUnits="userSpaceOnUse">
          <path d="M0 0 L6 3 L0 6 z" fill="var(--state-swap)" />
        </marker>
      </defs>

      {/* edges */}
      <AnimatePresence>
        {scene.edges.map((e) => {
          const si = idx.get(e.source);
          const ti = idx.get(e.target);
          if (si == null || ti == null) return null;
          const x1 = cx(si);
          const x2 = cx(ti);
          const hi = e.state !== "default";
          const marker = hi ? "url(#ll-arrow-hi)" : "url(#ll-arrow)";
          let d: string;
          if (ti > si) {
            d = `M ${x1 + R} ${Y} L ${x2 - R} ${Y}`;
          } else {
            const arcH = 30 + (Math.abs(ti - si) - 1) * 22;
            const mx = (x1 + x2) / 2;
            d = `M ${x1 - R} ${Y} C ${mx} ${Y + arcH} ${mx} ${Y + arcH} ${x2 + R} ${Y}`;
          }
          return (
            <motion.path
              key={e.id}
              d={d}
              fill="none"
              stroke={edgeStroke(e.state)}
              strokeWidth={hi ? 2.4 : 1.7}
              markerEnd={marker}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
            />
          );
        })}
      </AnimatePresence>

      {/* nodes */}
      {scene.nodes.map((nd, i) => (
        <g key={nd.id}>
          <circle
            cx={cx(i)}
            cy={Y}
            r={R}
            className="transition-[fill,stroke] duration-200"
            style={{ fill: nodeFill(nd.state), stroke: strokeFor(nd.state) }}
            strokeWidth={1.7}
          />
          <text
            x={cx(i)}
            y={Y + 5}
            textAnchor="middle"
            fontSize={15}
            fontWeight={600}
            className="transition-[fill] duration-200"
            style={{ fill: nd.state === "default" ? "var(--text)" : textFor(nd.state) }}
            fontFamily="var(--font-geist-mono)"
          >
            {nd.value}
          </text>
        </g>
      ))}

      {/* pointer chips (grouped by node) */}
      {(() => {
        const byTarget = new Map<string, typeof scene.pointers>();
        for (const p of scene.pointers) {
          const arr = byTarget.get(p.target) ?? [];
          arr.push(p);
          byTarget.set(p.target, arr);
        }
        return [...byTarget.entries()].map(([targetId, ptrs]) => {
          const ti = idx.get(targetId);
          if (ti == null) return null;
          const label = ptrs.map((p) => p.label).join(" ");
          const w = Math.max(26, label.length * 7.2 + 12);
          const color = ptrs[0].color ?? "var(--brand)";
          return (
            <motion.g key={targetId} initial={false} animate={{ x: cx(ti) }} transition={SPRING}>
              <rect x={-w / 2} y={Y - R - 30} width={w} height={18} rx={5} fill={color} />
              <text x={0} y={Y - R - 17} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--brand-fg)" fontFamily="var(--font-geist-mono)">
                {label}
              </text>
              <path d={`M0 ${Y - R - 4} l-5 -8 h10 z`} fill={color} />
            </motion.g>
          );
        });
      })()}
    </svg>
  );
}

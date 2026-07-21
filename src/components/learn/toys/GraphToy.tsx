"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { SPRING } from "@/engine/canvas/motion";
import { focusRing, pressFeedback } from "@/design-system/ui/interaction";
import { cn } from "@/lib/utils";
import { ToyFrame } from "./shared";

const W = 260;
const H = 160;

/** A small fixed graph. Positions are frozen — a graph is defined by its edges,
 *  not by where we draw the dots, so nothing ever moves. */
const NODES = [
  { id: "A", x: 42, y: 44 },
  { id: "B", x: 130, y: 30 },
  { id: "C", x: 218, y: 52 },
  { id: "D", x: 60, y: 122 },
  { id: "E", x: 150, y: 126 },
  { id: "F", x: 222, y: 118 },
] as const;

type NodeId = (typeof NODES)[number]["id"];

const EDGES: [NodeId, NodeId][] = [
  ["A", "B"],
  ["B", "C"],
  ["A", "D"],
  ["B", "E"],
  ["C", "F"],
  ["D", "E"],
  ["E", "F"],
];

const posOf = (id: NodeId) => NODES.find((n) => n.id === id)!;

/**
 * Touch the graph: tap a node and it lights up in the active colour while its
 * direct neighbours — and only they — light up as the frontier, with the edges
 * between them brightening. Everything else stays neutral, so "a graph is which
 * nodes are adjacent" is something you explore one node at a time. Colour here IS
 * a running operation (exploring adjacency), which is what chroma is reserved for.
 */
export function GraphToy() {
  const [sel, setSel] = useState<NodeId | null>(null);

  const neighbours = useMemo(() => {
    if (sel === null) return new Set<NodeId>();
    const s = new Set<NodeId>();
    for (const [u, v] of EDGES) {
      if (u === sel) s.add(v);
      if (v === sel) s.add(u);
    }
    return s;
  }, [sel]);

  return (
    <ToyFrame label="Graph — nodes joined by edges" hint="tap a node to see who it connects to">
      <div className="relative mx-auto" style={{ width: W, height: H }}>
        <svg
          className="absolute inset-0"
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          aria-hidden
        >
          {EDGES.map(([u, v]) => {
            const a = posOf(u);
            const b = posOf(v);
            const on = sel !== null && (u === sel || v === sel);
            return (
              <line
                key={`${u}-${v}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                strokeWidth={on ? 2 : 1}
                className={cn(
                  "transition-[stroke,stroke-width] duration-[var(--duration-base)] ease-out",
                  on ? "stroke-state-active" : "stroke-line-strong",
                )}
              />
            );
          })}
        </svg>

        {NODES.map((n) => {
          const isSel = n.id === sel;
          const isNbr = neighbours.has(n.id);
          return (
            <div
              key={n.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: n.x, top: n.y }}
            >
              <motion.button
                type="button"
                onClick={() => setSel((cur) => (cur === n.id ? null : n.id))}
                aria-pressed={isSel}
                aria-label={
                  isSel
                    ? `Node ${n.id}, selected`
                    : isNbr
                      ? `Node ${n.id}, neighbour of ${sel}`
                      : `Node ${n.id}`
                }
                animate={{ scale: isSel ? 1.1 : 1 }}
                transition={SPRING}
                className={cn(
                  "grid size-8 place-items-center rounded-full border font-mono text-sm",
                  "transition-colors duration-[var(--duration-fast)] ease-out",
                  focusRing,
                  pressFeedback,
                  isSel
                    ? "border-state-active bg-surface-3 text-fg"
                    : isNbr
                      ? "border-state-frontier bg-surface-3 text-fg"
                      : "border-line bg-surface-2 text-fg-muted hover:border-line-strong hover:text-fg",
                )}
              >
                {n.id}
              </motion.button>
            </div>
          );
        })}
      </div>

      <p className="mt-2 text-2xs text-fg-faint">
        {sel === null
          ? "Tap a node to light up its neighbours."
          : `${sel} connects to ${[...neighbours].join(", ")}.`}
      </p>
    </ToyFrame>
  );
}

"use client";

import { AnimatePresence, motion } from "motion/react";
import type { ListScene, ElementState } from "@/engine/types";
import { STATE_KEYS, stateColor } from "@/design-system/state-palette";
import { SPRING } from "../motion";

/**
 * A singly-linked list drawn the way it's taught: each node is one box split
 * into a data cell and a next-pointer cell, and the arrow leaves the POINTER
 * cell — because that's the thing doing the pointing. The pointer cell shows the
 * address of the node it references, and every node carries its own address
 * underneath, so a learner can match `3600` in one node's pointer to the `3600`
 * label under the next one. A node with no next shows NULL.
 *
 * Nodes hold fixed positions (ListTracer never moves them); only the arrows
 * change. That's what makes "reverse a list" read correctly — the boxes stay
 * put and the links visibly flip backward, routed under the row so a reversed
 * link can't be confused with a forward one.
 */

const DATA_W = 58;
const PTR_W = 46;
const BOX_W = DATA_W + PTR_W;
const BOX_H = 46;
const GAP = 54;
const PITCH = BOX_W + GAP;
const PADX = 76; // room for the Head label + its arrow
const BOX_Y = 84;
const CY = BOX_Y + BOX_H / 2;
const ADDR_Y = BOX_Y + BOX_H + 16; // each node's own address
const ARC_Y = BOX_Y + BOX_H + 42; // backward / skipping links route below the labels
const VB_H = 196;

/** Synthetic but stable addresses — the point is that they match up, not that they're real. */
const addressOf = (i: number) => 3200 + i * 400;

const strokeFor = (s: ElementState) =>
  s === "default" ? "var(--state-default-border)" : stateColor(s);
const boxFill = (s: ElementState) => (s === "default" ? "var(--surface-2)" : stateColor(s));
const valueInk = (s: ElementState) => (s === "default" ? "var(--text)" : "var(--state-ink)");
const pointerInk = (s: ElementState) => (s === "default" ? "var(--text-muted)" : "var(--state-ink)");
const edgeStroke = (s: ElementState) => (s === "default" ? "var(--border-strong)" : stateColor(s));

export function ListView({ scene }: { scene: ListScene }) {
  const index = new Map(scene.nodes.map((n, i) => [n.id, i]));
  const left = (i: number) => PADX + i * PITCH;
  const n = scene.nodes.length;
  const VB_W = PADX * 2 + n * BOX_W + Math.max(0, n - 1) * GAP;

  /** Where each node's next points, so the pointer cell can show that address. */
  const nextOf = new Map<string, string>();
  const hasIncoming = new Set<string>();
  for (const e of scene.edges) {
    nextOf.set(e.source, e.target);
    hasIncoming.add(e.target);
  }

  // The head is the node nothing points to. Once an algorithm rewires the list
  // (reversing it, say) the first box is no longer the head, so the label is
  // dropped rather than left lying — the algorithm's own pointer chip marks the
  // new head at that point.
  const showHead = n > 0 && !hasIncoming.has(scene.nodes[0].id);

  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid meet" className="h-full w-full">
      <defs>
        {STATE_KEYS.map((s) => (
          <marker
            key={s}
            id={`ll-tip-${s}`}
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="3"
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <path d="M0 0 L6.5 3 L0 6 z" fill={edgeStroke(s)} />
          </marker>
        ))}
        {scene.nodes.map((nd, i) => (
          <clipPath key={nd.id} id={`ll-box-${nd.id}`}>
            <rect x={left(i)} y={BOX_Y} width={BOX_W} height={BOX_H} rx={9} />
          </clipPath>
        ))}
      </defs>

      {/* Head → first node (only while the first box really is the head) */}
      {showHead && (
        <g>
          <text
            x={PADX - 34}
            y={CY - 12}
            textAnchor="middle"
            fontSize={12}
            fontWeight={700}
            fill="var(--text-muted)"
          >
            Head
          </text>
          <path
            d={`M ${PADX - 34} ${CY - 6} V ${CY} H ${PADX - 9}`}
            fill="none"
            stroke="var(--border-strong)"
            strokeWidth={1.8}
            markerEnd="url(#ll-tip-default)"
          />
        </g>
      )}

      {/* next-pointer arrows */}
      <AnimatePresence>
        {scene.edges.map((e) => {
          const si = index.get(e.source);
          const ti = index.get(e.target);
          if (si == null || ti == null) return null;

          const fromPtrX = left(si) + DATA_W + PTR_W / 2;
          const adjacent = ti === si + 1;
          const d = adjacent
            ? // straight hop: out of the pointer cell into the next node's edge
              `M ${left(si) + BOX_W} ${CY} H ${left(ti) - 8}`
            : // backward or skipping: dip below the address labels so it can't be
              // mistaken for a forward link
              `M ${fromPtrX} ${BOX_Y + BOX_H} C ${fromPtrX} ${ARC_Y}, ${left(ti) + BOX_W / 2} ${ARC_Y}, ${
                left(ti) + BOX_W / 2
              } ${BOX_Y + BOX_H + 7}`;

          return (
            <motion.path
              key={e.id}
              d={d}
              fill="none"
              stroke={edgeStroke(e.state)}
              strokeWidth={e.state === "default" ? 1.8 : 2.4}
              markerEnd={`url(#ll-tip-${e.state})`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
          );
        })}
      </AnimatePresence>

      {/* nodes: [ data | next ] */}
      {scene.nodes.map((nd, i) => {
        const x = left(i);
        const target = nextOf.get(nd.id);
        const targetIdx = target != null ? index.get(target) : undefined;
        const pointerLabel = targetIdx != null ? String(addressOf(targetIdx)) : "NULL";

        return (
          <g key={nd.id}>
            <g clipPath={`url(#ll-box-${nd.id})`}>
              <rect
                x={x}
                y={BOX_Y}
                width={BOX_W}
                height={BOX_H}
                className="transition-[fill] duration-200"
                style={{ fill: boxFill(nd.state) }}
              />
              {/* the pointer half sits a shade back from the data half */}
              <rect x={x + DATA_W} y={BOX_Y} width={PTR_W} height={BOX_H} fill="var(--text)" opacity={0.07} />
            </g>

            <line
              x1={x + DATA_W}
              y1={BOX_Y}
              x2={x + DATA_W}
              y2={BOX_Y + BOX_H}
              stroke={strokeFor(nd.state)}
              strokeWidth={1.2}
              opacity={0.65}
            />
            <rect
              x={x}
              y={BOX_Y}
              width={BOX_W}
              height={BOX_H}
              rx={9}
              fill="none"
              className="transition-[stroke] duration-200"
              style={{ stroke: strokeFor(nd.state) }}
              strokeWidth={1.8}
            />

            <text
              x={x + DATA_W / 2}
              y={CY + 5}
              textAnchor="middle"
              fontSize={16}
              fontWeight={650}
              className="transition-[fill] duration-200"
              style={{ fill: valueInk(nd.state) }}
              fontFamily="var(--font-geist-mono)"
            >
              {nd.value}
            </text>

            <text
              x={x + DATA_W + PTR_W / 2}
              y={CY + 4}
              textAnchor="middle"
              fontSize={pointerLabel === "NULL" ? 10.5 : 11.5}
              fontWeight={pointerLabel === "NULL" ? 700 : 550}
              className="transition-[fill] duration-200"
              style={{ fill: pointerInk(nd.state) }}
              fontFamily="var(--font-geist-mono)"
            >
              {pointerLabel}
            </text>

            {/* the node's own address — matches the pointer value in whatever points here */}
            <text
              x={x + BOX_W / 2}
              y={ADDR_Y}
              textAnchor="middle"
              fontSize={10}
              fill="var(--text-faint)"
              fontFamily="var(--font-geist-mono)"
            >
              {addressOf(i)}
            </text>
          </g>
        );
      })}

      {/* algorithm pointers (prev / cur / next), grouped per node */}
      {(() => {
        const byTarget = new Map<string, typeof scene.pointers>();
        for (const p of scene.pointers) {
          const arr = byTarget.get(p.target) ?? [];
          arr.push(p);
          byTarget.set(p.target, arr);
        }
        return [...byTarget.entries()].map(([targetId, ptrs]) => {
          const ti = index.get(targetId);
          if (ti == null) return null;
          const label = ptrs.map((p) => p.label).join(" ");
          const w = Math.max(28, label.length * 7.4 + 14);
          const color = ptrs[0].color ?? "var(--brand)";
          return (
            <motion.g
              key={targetId}
              initial={false}
              animate={{ x: left(ti) + BOX_W / 2 }}
              transition={SPRING}
            >
              <rect x={-w / 2} y={BOX_Y - 32} width={w} height={19} rx={5} fill={color} />
              <text
                x={0}
                y={BOX_Y - 18.5}
                textAnchor="middle"
                fontSize={11}
                fontWeight={700}
                fill="var(--brand-fg)"
                fontFamily="var(--font-geist-mono)"
              >
                {label}
              </text>
              <path d={`M0 ${BOX_Y - 4} l-5 -9 h10 z`} fill={color} />
            </motion.g>
          );
        });
      })()}
    </svg>
  );
}

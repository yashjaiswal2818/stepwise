"use client";

import type { FC } from "react";
import { motion } from "motion/react";
import type { StructureSlug } from "@/curriculum/structures";

/* Shared 200×120 canvas. Fills use palette vars; motion drives position/opacity/
   scale (which interpolate smoothly) rather than fill keyframes (which snap). */

const loop = (extra: object = {}) => ({
  repeat: Infinity,
  repeatType: "loop" as const,
  ease: "easeInOut" as const,
  ...extra,
});

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 200 120" className="h-full w-full" fill="none">
      {children}
    </svg>
  );
}

/* ---------------------------------------------------------------- Arrays */
function ArraysPreview() {
  const vals = [5, 2, 8, 1, 9, 4];
  const w = 28, gap = 5, startX = (200 - (vals.length * w + (vals.length - 1) * gap)) / 2, y = 44;
  const xOf = (i: number) => startX + i * (w + gap);
  const pairX = [0, 1, 2, 3, 4].map((k) => xOf(k) - 3);
  return (
    <Frame>
      {vals.map((v, i) => (
        <g key={i}>
          <rect x={xOf(i)} y={y} width={w} height={32} rx={7} fill="var(--state-default)" stroke="var(--state-default-border)" />
          <text x={xOf(i) + w / 2} y={y + 21} textAnchor="middle" fontSize="14" fontWeight="600" fill="var(--state-default-fg)" fontFamily="var(--font-geist-mono)">{v}</text>
        </g>
      ))}
      <motion.rect
        y={y - 3} width={w * 2 + gap + 6} height={38} rx={9}
        fill="color-mix(in oklab, var(--state-compare) 12%, transparent)"
        stroke="var(--state-compare)" strokeWidth={1.5}
        initial={{ x: pairX[0] }}
        animate={{ x: pairX }}
        transition={loop({ duration: 3.2, times: [0, 0.25, 0.5, 0.75, 1] })}
      />
    </Frame>
  );
}

/* --------------------------------------------------------- Linked Lists */
/* Each node is one box split into a data cell and a next-pointer cell, and the
   arrow leaves the pointer cell — the same shape the full visualization uses.
   At this size an address won't read, so the pointer cell uses the textbook
   dot-and-arrow notation, with ∅ marking the end of the list. */
function LinkedListPreview() {
  const DATA_W = 29, PTR_W = 19, BOX_W = DATA_W + PTR_W, BOX_H = 28;
  const GAP = 18, PITCH = BOX_W + GAP, startX = 10, topY = 52;
  const cy = topY + BOX_H / 2;
  const vals = [3, 7, 4];
  const xOf = (i: number) => startX + i * PITCH;

  return (
    <Frame>
      <defs>
        {vals.map((_, i) => (
          <clipPath key={i} id={`llp-${i}`}>
            <rect x={xOf(i)} y={topY} width={BOX_W} height={BOX_H} rx={6} />
          </clipPath>
        ))}
      </defs>

      {/* next pointers */}
      {vals.slice(0, -1).map((_, i) => (
        <g key={i} stroke="var(--border-strong)" strokeWidth={1.5}>
          <line x1={xOf(i) + BOX_W} y1={cy} x2={xOf(i + 1) - 5} y2={cy} />
          <polygon
            points={`${xOf(i + 1) - 5},${cy - 3.5} ${xOf(i + 1) - 0.5},${cy} ${xOf(i + 1) - 5},${cy + 3.5}`}
            fill="var(--border-strong)"
            stroke="none"
          />
        </g>
      ))}

      {vals.map((v, i) => {
        const x = xOf(i);
        const isLast = i === vals.length - 1;
        return (
          <g key={i}>
            <g clipPath={`url(#llp-${i})`}>
              <rect x={x} y={topY} width={BOX_W} height={BOX_H} fill="var(--surface-2)" />
              <rect x={x + DATA_W} y={topY} width={PTR_W} height={BOX_H} fill="var(--text)" opacity={0.07} />
            </g>
            <line x1={x + DATA_W} y1={topY} x2={x + DATA_W} y2={topY + BOX_H} stroke="var(--state-swap)" strokeWidth={1} opacity={0.5} />
            <rect x={x} y={topY} width={BOX_W} height={BOX_H} rx={6} fill="none" stroke="var(--state-swap)" strokeWidth={1.5} />
            <text x={x + DATA_W / 2} y={cy + 4.5} textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--text)" fontFamily="var(--font-geist-mono)">{v}</text>
            {isLast ? (
              <text x={x + DATA_W + PTR_W / 2} y={cy + 4} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--text-muted)" fontFamily="var(--font-geist-mono)">∅</text>
            ) : (
              <circle cx={x + DATA_W + PTR_W / 2} cy={cy} r={2.6} fill="var(--border-strong)" />
            )}
          </g>
        );
      })}

      <motion.g
        initial={{ x: xOf(0) + BOX_W / 2 }}
        animate={{ x: vals.map((_, i) => xOf(i) + BOX_W / 2) }}
        transition={loop({ duration: 3, times: [0, 0.5, 1] })}
      >
        <rect x={-16} y={topY - 30} width={32} height={16} rx={5} fill="var(--state-active)" />
        <text x={0} y={topY - 18} textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--state-ink)">cur</text>
        <path d={`M0 ${topY - 12} l-4 -6 h8 z`} fill="var(--state-active)" />
      </motion.g>
    </Frame>
  );
}

/* --------------------------------------------------------------- Stacks */
function StacksPreview() {
  const bw = 74, bx = (200 - bw) / 2, bh = 22, baseY = 96;
  const resting = [0, 1, 2].map((i) => baseY - i * (bh + 4));
  return (
    <Frame>
      <line x1={bx - 8} y1={baseY + bh + 3} x2={bx + bw + 8} y2={baseY + bh + 3} stroke="var(--border-strong)" strokeWidth={2} strokeLinecap="round" />
      {resting.map((ry, i) => (
        <g key={i}>
          <rect x={bx} y={ry} width={bw} height={bh} rx={6} fill="var(--surface-2)" stroke="var(--border-strong)" />
          <text x={200 / 2} y={ry + 15} textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--text-muted)" fontFamily="var(--font-geist-mono)">{[12, 7, 5][i]}</text>
        </g>
      ))}
      <motion.g
        initial={{ y: -34, opacity: 0 }}
        animate={{ y: [-34, baseY - 3 * (bh + 4) + 34, baseY - 3 * (bh + 4) + 34, -34], opacity: [0, 1, 1, 0] }}
        transition={loop({ duration: 2.6, times: [0, 0.35, 0.75, 1], repeatDelay: 0.2 })}
      >
        <rect x={bx} y={0} width={bw} height={bh} rx={6} fill="color-mix(in oklab, var(--state-active) 20%, var(--surface))" stroke="var(--state-active)" strokeWidth={1.5} />
        <text x={200 / 2} y={15} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--state-active)" fontFamily="var(--font-geist-mono)">9</text>
      </motion.g>
    </Frame>
  );
}

/* --------------------------------------------------------------- Queues */
function QueuePreview() {
  const y = 50, size = 30, gap = 10, n = 4, period = 3.6;
  const startX = 178, endX = -8;
  return (
    <Frame>
      <rect x={6} y={y - 6} width={188} height={size + 12} rx={10} fill="none" stroke="var(--border)" strokeDasharray="4 5" />
      <text x={186} y={y + size + 26} textAnchor="end" fontSize="9" fill="var(--text-faint)" fontWeight="600">IN →</text>
      <text x={14} y={y + size + 26} textAnchor="start" fontSize="9" fill="var(--text-faint)" fontWeight="600">→ OUT</text>
      {Array.from({ length: n }).map((_, i) => (
        <motion.g
          key={i}
          initial={{ x: startX - (i * (size + gap)) }}
          animate={{ x: [startX, endX] }}
          transition={{ duration: period, ease: "linear", repeat: Infinity, delay: -(i * period) / n }}
        >
          <rect x={0} y={y} width={size} height={size} rx={7} fill="color-mix(in oklab, var(--state-frontier) 16%, var(--surface))" stroke="var(--state-frontier)" strokeWidth={1.4} />
          <text x={size / 2} y={y + 20} textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--state-frontier)" fontFamily="var(--font-geist-mono)">{[1, 2, 3, 4][i]}</text>
        </motion.g>
      ))}
    </Frame>
  );
}

/* ----------------------------------------------------------- Hash Table */
function HashPreview() {
  const buckets = [28, 76, 124, 172], top = 22, floor = 92;
  const keys = [
    { x: buckets[2], v: 7, d: 0 },
    { x: buckets[0], v: 3, d: 0.7 },
    { x: buckets[3], v: 1, d: 1.4 },
    { x: buckets[1], v: 8, d: 2.1 },
  ];
  return (
    <Frame>
      {buckets.map((bx, i) => (
        <g key={i}>
          <rect x={bx - 15} y={floor} width={30} height={22} rx={5} fill="var(--surface-2)" stroke="var(--border-strong)" />
          <text x={bx} y={floor + 34} textAnchor="middle" fontSize="9" fill="var(--text-faint)" fontFamily="var(--font-geist-mono)">{i}</text>
        </g>
      ))}
      {keys.map((k, i) => (
        <motion.circle
          key={i}
          cx={k.x} r={11}
          fill="color-mix(in oklab, var(--accent-cyan) 20%, var(--surface))"
          stroke="var(--accent-cyan)" strokeWidth={1.5}
          initial={{ cy: top, opacity: 0 }}
          animate={{ cy: [top, floor + 11, floor + 11, top], opacity: [0, 1, 1, 0] }}
          transition={loop({ duration: 2.8, times: [0, 0.45, 0.8, 1], delay: k.d, repeatDelay: 2 })}
        />
      ))}
      {keys.map((k, i) => (
        <motion.text
          key={i}
          x={k.x} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--accent-cyan)" fontFamily="var(--font-geist-mono)"
          initial={{ y: top + 4, opacity: 0 }}
          animate={{ y: [top + 4, floor + 15, floor + 15, top + 4], opacity: [0, 1, 1, 0] }}
          transition={loop({ duration: 2.8, times: [0, 0.45, 0.8, 1], delay: k.d, repeatDelay: 2 })}
        >{k.v}</motion.text>
      ))}
    </Frame>
  );
}

/* ---------------------------------------------------------------- Trees */
const TREE_NODES = [
  { id: 0, x: 100, y: 20 },
  { id: 1, x: 62, y: 58 },
  { id: 2, x: 138, y: 58 },
  { id: 3, x: 38, y: 96 },
  { id: 4, x: 84, y: 96 },
  { id: 5, x: 116, y: 96 },
  { id: 6, x: 162, y: 96 },
];
const TREE_EDGES = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]];
const INORDER = [3, 1, 4, 0, 5, 2, 6];
function TreePreview() {
  return (
    <Frame>
      {TREE_EDGES.map(([a, b], i) => (
        <line key={i} x1={TREE_NODES[a].x} y1={TREE_NODES[a].y} x2={TREE_NODES[b].x} y2={TREE_NODES[b].y} stroke="var(--border-strong)" strokeWidth={1.5} />
      ))}
      {TREE_NODES.map((n) => {
        const order = INORDER.indexOf(n.id);
        return (
          <g key={n.id}>
            <circle cx={n.x} cy={n.y} r={13} fill="var(--surface-2)" stroke="var(--border-strong)" strokeWidth={1.5} />
            <motion.circle
              cx={n.x} cy={n.y} r={13} fill="color-mix(in oklab, var(--state-final) 22%, transparent)" stroke="var(--state-final)" strokeWidth={2}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 1, 0] }}
              transition={loop({ duration: 3.6, times: [0, 0.08, 0.85, 1], delay: order * 0.32, repeatDelay: 0.8 })}
            />
            <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--text)" fontFamily="var(--font-geist-mono)">{[4, 2, 6, 1, 3, 5, 7][n.id]}</text>
          </g>
        );
      })}
    </Frame>
  );
}

/* --------------------------------------------------------------- Graphs */
const G_NODES = [
  { id: 0, x: 40, y: 60, ring: 0 },
  { id: 1, x: 92, y: 30, ring: 1 },
  { id: 2, x: 96, y: 92, ring: 1 },
  { id: 3, x: 150, y: 46, ring: 2 },
  { id: 4, x: 160, y: 96, ring: 2 },
];
const G_EDGES = [[0, 1], [0, 2], [1, 3], [2, 4], [2, 3], [3, 4]];
function GraphPreview() {
  return (
    <Frame>
      {G_EDGES.map(([a, b], i) => (
        <line key={i} x1={G_NODES[a].x} y1={G_NODES[a].y} x2={G_NODES[b].x} y2={G_NODES[b].y} stroke="var(--border-strong)" strokeWidth={1.5} />
      ))}
      {G_NODES.map((n) => (
        <g key={n.id}>
          <circle cx={n.x} cy={n.y} r={13} fill="var(--surface-2)" stroke="var(--border-strong)" strokeWidth={1.5} />
          <motion.circle
            cx={n.x} cy={n.y} r={13} fill="color-mix(in oklab, var(--state-path) 22%, transparent)" stroke="var(--state-path)" strokeWidth={2}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.6, 1, 1, 1] }}
            style={{ transformOrigin: `${n.x}px ${n.y}px` }}
            transition={loop({ duration: 3.4, times: [0, 0.12, 0.82, 1], delay: n.ring * 0.55, repeatDelay: 0.9 })}
          />
        </g>
      ))}
    </Frame>
  );
}

/* ------------------------------------------------------------ Recursion */
function RecursionPreview() {
  const frames = [0, 1, 2, 3];
  const fw = 118, fh = 17, cx = 100;
  return (
    <Frame>
      {frames.map((i) => {
        const w = fw - i * 22;
        return (
          <motion.g
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: [0, 1, 1, 1, 0], y: [8, 0, 0, 0, 8] }}
            transition={loop({ duration: 4.2, times: [0, 0.12, 0.5, 0.88, 1], delay: 0.28 + i * 0.28, repeatDelay: 0.4 })}
          >
            <rect x={cx - w / 2} y={22 + i * (fh + 5)} width={w} height={fh} rx={5}
              fill="color-mix(in oklab, var(--brand) 16%, var(--surface))" stroke="var(--brand-strong)" strokeWidth={1.2} />
            <text x={cx} y={22 + i * (fh + 5) + 12} textAnchor="middle" fontSize="9.5" fontWeight="600" fill="var(--brand-strong)" fontFamily="var(--font-geist-mono)">f({4 - i})</text>
          </motion.g>
        );
      })}
    </Frame>
  );
}

const MAP: Record<StructureSlug, FC> = {
  arrays: ArraysPreview,
  "linked-lists": LinkedListPreview,
  stacks: StacksPreview,
  queues: QueuePreview,
  "hash-tables": HashPreview,
  trees: TreePreview,
  graphs: GraphPreview,
  recursion: RecursionPreview,
};

export function StructurePreview({ slug }: { slug: StructureSlug }) {
  const C = MAP[slug];
  return <C />;
}

"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, RotateCcw } from "lucide-react";
import { SPRING_SOFT } from "@/engine/canvas/motion";
import { ToyButton, ToyFrame } from "./shared";

type Node = { id: number; v: number; left: Node | null; right: Node | null };

let tid = 500;
const mk = (v: number): Node => ({ id: tid++, v, left: null, right: null });
const rand = () => Math.floor(Math.random() * 90) + 10;

const MAX_NODES = 7;
const MAX_DEPTH = 3;

const VB_W = 260;
const VB_H = 150;
const PAD_X = 24;
const PAD_Y = 22;
const R = 13;

const clone = (n: Node | null): Node | null =>
  n ? { id: n.id, v: n.v, left: clone(n.left), right: clone(n.right) } : null;

function has(n: Node | null, v: number): boolean {
  if (!n) return false;
  if (n.v === v) return true;
  return has(v < n.v ? n.left : n.right, v);
}

function count(n: Node | null): number {
  return n ? 1 + count(n.left) + count(n.right) : 0;
}

/** Walk from the root like a real BST insert. Returns the new tree, the ids of
 *  the compared nodes (the path), and the new node's id — or null if the value
 *  is a duplicate or the slot would sit past the depth cap. */
function tryInsert(root: Node, v: number) {
  if (has(root, v)) return null;
  const newRoot = clone(root)!;
  let cur = newRoot;
  let depth = 0;
  const path: number[] = [cur.id];
  for (;;) {
    if (depth + 1 > MAX_DEPTH) return null;
    if (v < cur.v) {
      if (!cur.left) {
        cur.left = mk(v);
        return { root: newRoot, path, newId: cur.left.id };
      }
      cur = cur.left;
    } else {
      if (!cur.right) {
        cur.right = mk(v);
        return { root: newRoot, path, newId: cur.right.id };
      }
      cur = cur.right;
    }
    depth += 1;
    path.push(cur.id);
  }
}

function seed(): Node {
  // A small, balanced starting shape: 50 with 30 (left) and 70 (right).
  const root = mk(50);
  root.left = mk(30);
  root.right = mk(70);
  return root;
}

type Laid = { id: number; v: number; x: number; y: number; left: Node | null; right: Node | null };

/** x by in-order rank (so it reads left-to-right sorted), y by depth. */
function layout(root: Node): Laid[] {
  const flat: { n: Node; depth: number; rank: number }[] = [];
  let rank = 0;
  const walk = (n: Node | null, depth: number) => {
    if (!n) return;
    walk(n.left, depth + 1);
    flat.push({ n, depth, rank: rank++ });
    walk(n.right, depth + 1);
  };
  walk(root, 0);
  const n = flat.length;
  const stepX = n > 1 ? (VB_W - 2 * PAD_X) / (n - 1) : 0;
  const stepY = (VB_H - 2 * PAD_Y) / MAX_DEPTH;
  return flat.map(({ n: node, depth, rank }) => ({
    id: node.id,
    v: node.v,
    left: node.left,
    right: node.right,
    x: n > 1 ? PAD_X + rank * stepX : VB_W / 2,
    y: PAD_Y + depth * stepY,
  }));
}

/**
 * Touch the binary search tree: [insert] drops a random value in and you watch
 * it walk the root — smaller ducks left, larger goes right — lighting the
 * comparison path in the active colour until it lands in an empty slot and the
 * new node scales in. The rule (every left child smaller, every right larger)
 * is something you see enforced, one hop at a time.
 */
export function TreeToy() {
  const [root, setRoot] = useState<Node>(seed);
  const [active, setActive] = useState<Set<number>>(() => new Set());

  const laid = useMemo(() => layout(root), [root]);
  const pos = useMemo(() => new Map(laid.map((l) => [l.id, l])), [laid]);
  const total = laid.length;

  const edges = useMemo(() => {
    const out: { id: number; fx: number; fy: number; tx: number; ty: number; on: boolean }[] = [];
    for (const l of laid) {
      for (const child of [l.left, l.right]) {
        if (!child) continue;
        const c = pos.get(child.id);
        if (!c) continue;
        out.push({ id: child.id, fx: l.x, fy: l.y, tx: c.x, ty: c.y, on: active.has(l.id) && active.has(c.id) });
      }
    }
    return out;
  }, [laid, pos, active]);

  const insert = () => {
    if (total >= MAX_NODES) return;
    for (let attempt = 0; attempt < 48; attempt++) {
      const res = tryInsert(root, rand());
      if (!res) continue;
      setRoot(res.root);
      const ids = new Set([...res.path, res.newId]);
      setActive(ids);
      window.setTimeout(() => setActive(new Set()), 900);
      return;
    }
  };

  const reset = () => {
    setActive(new Set());
    setRoot(mk(rand()));
  };

  return (
    <ToyFrame label="Binary search tree — smaller left, larger right" hint="insert / reset">
      <div className="flex flex-col gap-3">
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="h-[150px] w-full"
          role="img"
          aria-label={`Binary search tree with ${total} node${total === 1 ? "" : "s"}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <AnimatePresence>
            {edges.map((e) => (
              <motion.line
                key={e.id}
                initial={{ opacity: 0 }}
                animate={{ x1: e.fx, y1: e.fy, x2: e.tx, y2: e.ty, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={SPRING_SOFT}
                stroke={e.on ? "var(--state-active)" : "var(--border-strong)"}
                strokeWidth={e.on ? 1.75 : 1}
              />
            ))}
          </AnimatePresence>

          <AnimatePresence>
            {laid.map((l) => {
              const on = active.has(l.id);
              return (
                <motion.g
                  key={l.id}
                  initial={{ opacity: 0, scale: 0.2, x: l.x, y: l.y }}
                  animate={{ opacity: 1, scale: 1, x: l.x, y: l.y }}
                  exit={{ opacity: 0, scale: 0.2 }}
                  transition={SPRING_SOFT}
                >
                  <circle
                    r={R}
                    fill="var(--surface-2)"
                    stroke={on ? "var(--state-active)" : "var(--border-strong)"}
                    strokeWidth={on ? 2 : 1}
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={12}
                    fontFamily="var(--font-mono, monospace)"
                    fill={on ? "var(--text)" : "var(--text-muted)"}
                  >
                    {l.v}
                  </text>
                </motion.g>
              );
            })}
          </AnimatePresence>
        </svg>

        <div className="flex items-center gap-2">
          <ToyButton onClick={insert} disabled={total >= MAX_NODES} aria-label="Insert a random value into the tree">
            <Plus className="size-3.5" aria-hidden />
            insert
          </ToyButton>
          <ToyButton onClick={reset} aria-label="Reset the tree to a single root">
            <RotateCcw className="size-3.5" aria-hidden />
            reset
          </ToyButton>
          <p className="text-2xs text-fg-faint">
            {total >= MAX_NODES ? "Full — reset to keep going." : "Each value walks down to its slot."}
          </p>
        </div>
      </div>
    </ToyFrame>
  );
}

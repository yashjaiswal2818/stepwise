import { stratify, tree } from "d3-hierarchy";
import type { GNode, GEdge } from "@/engine/types";

export interface TreeLayout {
  pos: Record<string, { x: number; y: number }>;
  viewW: number;
  viewH: number;
}

const PAD = 40;
const DX = 66; // horizontal spacing between siblings
const DY = 78; // vertical spacing between levels

/**
 * d3-hierarchy (Reingold–Tilford) layout. Pure function of the tree STRUCTURE
 * (nodes + parent/child edges), never of per-step state — so positions are
 * stable across the whole trace and only colors animate.
 */
export function treeLayout(nodes: GNode[], edges: GEdge[]): TreeLayout {
  const parentOf = new Map<string, string>();
  const childrenOf = new Map<string, { id: string; side?: "left" | "right" }[]>();
  for (const e of edges) {
    parentOf.set(e.target, e.source);
    if (!childrenOf.has(e.source)) childrenOf.set(e.source, []);
    childrenOf.get(e.source)!.push({ id: e.target, side: e.side });
  }

  const root = stratify<GNode>()
    .id((d) => d.id)
    .parentId((d) => parentOf.get(d.id))(nodes);

  tree<GNode>().nodeSize([DX, DY])(root);

  const raw: Record<string, { x: number; y: number }> = {};
  root.each((d) => {
    raw[d.data.id] = { x: d.x ?? 0, y: d.y ?? 0 };
  });

  // Reingold–Tilford places an ONLY child directly below its parent, so a
  // left-only and a right-only child are indistinguishable — the "skewed" tree
  // draws as a straight stick and inorder traversal (left, node, right) cannot be
  // read off the picture. Shift each only-child's whole subtree to its real side.
  const collectSubtree = (id: string, acc: string[]): string[] => {
    acc.push(id);
    for (const c of childrenOf.get(id) ?? []) collectSubtree(c.id, acc);
    return acc;
  };
  const SHIFT = DX * 0.5;
  const queue: string[] = [root.data.id];
  while (queue.length) {
    const id = queue.shift()!;
    const kids = childrenOf.get(id) ?? [];
    if (kids.length === 1) {
      const only = kids[0];
      const dir = only.side === "left" ? -1 : only.side === "right" ? 1 : 0;
      if (dir !== 0) for (const d of collectSubtree(only.id, [])) raw[d].x += dir * SHIFT;
    }
    for (const k of kids) queue.push(k.id);
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const id in raw) {
    minX = Math.min(minX, raw[id].x);
    maxX = Math.max(maxX, raw[id].x);
    maxY = Math.max(maxY, raw[id].y);
  }

  const pos: Record<string, { x: number; y: number }> = {};
  for (const id in raw) pos[id] = { x: raw[id].x - minX + PAD, y: raw[id].y + PAD };

  return { pos, viewW: maxX - minX + PAD * 2, viewH: maxY + PAD * 2 };
}

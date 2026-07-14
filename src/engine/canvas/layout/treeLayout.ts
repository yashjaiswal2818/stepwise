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
  for (const e of edges) parentOf.set(e.target, e.source);

  const root = stratify<GNode>()
    .id((d) => d.id)
    .parentId((d) => parentOf.get(d.id))(nodes);

  tree<GNode>().nodeSize([DX, DY])(root);

  let minX = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const raw: Record<string, { x: number; y: number }> = {};
  root.each((d) => {
    raw[d.data.id] = { x: d.x ?? 0, y: d.y ?? 0 };
    minX = Math.min(minX, d.x ?? 0);
    maxX = Math.max(maxX, d.x ?? 0);
    maxY = Math.max(maxY, d.y ?? 0);
  });

  const pos: Record<string, { x: number; y: number }> = {};
  for (const id in raw) pos[id] = { x: raw[id].x - minX + PAD, y: raw[id].y + PAD };

  return { pos, viewW: maxX - minX + PAD * 2, viewH: maxY + PAD * 2 };
}

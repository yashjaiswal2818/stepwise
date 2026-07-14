import { STRUCTURES } from "./structures";
import { PROBLEMS } from "./catalog";
import type { Difficulty } from "@/design-system/ui/Badge";

/** World coordinate space the map is authored in; scaled to fit the viewport. */
export const VIEW = { w: 1040, h: 720 };

export interface CNode {
  id: string;
  kind: "structure" | "problem";
  label: string;
  x: number;
  y: number;
  accent: string;
  href: string;
  structure: string;
  difficulty?: Difficulty;
}
export interface CEdge {
  from: string;
  to: string;
  kind: "builds" | "has";
}

/**
 * Hand-authored positions — a curated constellation, not a physics layout, so it
 * reads cleanly and stays stable. Clusters roughly follow "builds on" flow left→right
 * but deliberately cross-link (BFS↔queue, call stack↔recursion) so it's a web, not a ladder.
 */
const POS: Record<string, [number, number]> = {
  // structure hubs
  arrays: [190, 330],
  "hash-tables": [380, 150],
  "linked-lists": [180, 560],
  stacks: [440, 600],
  queues: [660, 620],
  recursion: [530, 360],
  trees: [760, 330],
  graphs: [910, 400],
  // problems
  "two-pointers": [110, 190],
  "sliding-window": [270, 120],
  "binary-search": [340, 350],
  "bubble-sort": [90, 430],
  "quick-sort": [250, 470],
  "merge-sort": [390, 440],
  "two-sum": [510, 100],
  "reverse-linked-list": [70, 650],
  "detect-cycle": [300, 660],
  "valid-parentheses": [560, 650],
  queue: [780, 660],
  "max-depth": [620, 250],
  "binary-tree-traversal": [820, 190],
  "number-of-islands": [990, 260],
  "bfs-dfs": [1000, 480],
  dijkstra: [910, 590],
};

const structBySlug = Object.fromEntries(STRUCTURES.map((s) => [s.slug, s]));

const structureNodes: CNode[] = STRUCTURES.filter((s) => POS[s.slug]).map((s) => ({
  id: s.slug,
  kind: "structure",
  label: s.title,
  x: POS[s.slug][0],
  y: POS[s.slug][1],
  accent: s.accent,
  href: s.href,
  structure: s.slug,
}));

const problemNodes: CNode[] = PROBLEMS.filter((p) => POS[p.slug]).map((p) => ({
  id: p.slug,
  kind: "problem",
  label: p.title,
  x: POS[p.slug][0],
  y: POS[p.slug][1],
  accent: structBySlug[p.structure]?.accent ?? "var(--brand)",
  href: `/problem/${p.slug}`,
  structure: p.structure,
  difficulty: p.difficulty,
}));

export const NODES: CNode[] = [...structureNodes, ...problemNodes];
export const NODE_BY_ID: Record<string, CNode> = Object.fromEntries(NODES.map((n) => [n.id, n]));

/** Conceptual "builds on / relates to" links between structure hubs. */
const BUILDS: [string, string][] = [
  ["arrays", "hash-tables"],
  ["arrays", "linked-lists"],
  ["linked-lists", "stacks"],
  ["linked-lists", "queues"],
  ["stacks", "recursion"],
  ["recursion", "trees"],
  ["trees", "graphs"],
  ["graphs", "queues"],
];

export const EDGES: CEdge[] = [
  ...BUILDS.map(([from, to]) => ({ from, to, kind: "builds" as const })),
  ...problemNodes.map((p) => ({ from: p.structure, to: p.id, kind: "has" as const })),
];

/** Adjacency (both directions) for hover highlighting. */
export const NEIGHBORS: Record<string, Set<string>> = (() => {
  const m: Record<string, Set<string>> = {};
  for (const n of NODES) m[n.id] = new Set();
  for (const e of EDGES) {
    m[e.from]?.add(e.to);
    m[e.to]?.add(e.from);
  }
  return m;
})();

/** Problem slugs under each structure hub — a hub glows once any of its problems is explored. */
export const STRUCTURE_CHILDREN: Record<string, string[]> = (() => {
  const m: Record<string, string[]> = {};
  for (const p of problemNodes) (m[p.structure] ??= []).push(p.id);
  return m;
})();

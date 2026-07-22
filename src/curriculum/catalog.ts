import type { Difficulty } from "@/design-system/ui/Badge";
import type { StructureSlug } from "./structures";

export interface Problem {
  slug: string;
  title: string;
  topic: string;
  difficulty: Difficulty;
  tier: number;
  /** Which bespoke renderer this problem lives in (drives the placeholder preview for now). */
  structure: StructureSlug;
}

export interface Tier {
  n: number;
  name: string;
  blurb: string;
}

export const TIERS: Tier[] = [
  { n: 1, name: "Foundations", blurb: "Arrays, hashing, and the pointer patterns everything builds on." },
  { n: 2, name: "Linear & Recursive", blurb: "Linked lists and the call stack — your bridge to trees and graphs." },
  { n: 3, name: "Trees", blurb: "Branching structures and the traversals that walk them." },
  { n: 4, name: "Graphs, Sorting & Search", blurb: "Explore networks, order the unordered, and find the shortest path." },
];

/** The canonical starter examples — the seed curriculum for Stepwise.
 *  Anything that needs the count reads `PROBLEMS.length`; don't restate it here,
 *  it goes stale the moment a problem is added. */
export const PROBLEMS: Problem[] = [
  { slug: "two-sum", title: "Two Sum", topic: "Hashing", difficulty: "Easy", tier: 1, structure: "hash-tables" },
  { slug: "two-pointers", title: "Two Pointers", topic: "Two Pointers", difficulty: "Easy", tier: 1, structure: "arrays" },
  { slug: "sliding-window", title: "Longest Substring", topic: "Sliding Window", difficulty: "Medium", tier: 1, structure: "arrays" },
  { slug: "valid-parentheses", title: "Valid Parentheses", topic: "Stack", difficulty: "Easy", tier: 1, structure: "stacks" },
  { slug: "infix-to-postfix", title: "Infix → Postfix", topic: "Stack", difficulty: "Medium", tier: 1, structure: "stacks" },
  { slug: "queue", title: "Queue (FIFO)", topic: "Queue", difficulty: "Easy", tier: 1, structure: "queues" },
  { slug: "reverse-linked-list", title: "Reverse Linked List", topic: "Linked List", difficulty: "Easy", tier: 2, structure: "linked-lists" },
  { slug: "detect-cycle", title: "Detect a Cycle", topic: "Fast & Slow Pointers", difficulty: "Easy", tier: 2, structure: "linked-lists" },
  { slug: "max-depth", title: "Maximum Depth", topic: "Recursion", difficulty: "Easy", tier: 2, structure: "recursion" },
  { slug: "binary-tree-traversal", title: "Binary Tree Traversals", topic: "Trees", difficulty: "Medium", tier: 3, structure: "trees" },
  { slug: "binary-search", title: "Binary Search", topic: "Searching", difficulty: "Easy", tier: 4, structure: "arrays" },
  { slug: "bubble-sort", title: "Bubble Sort", topic: "Sorting", difficulty: "Easy", tier: 4, structure: "arrays" },
  { slug: "merge-sort", title: "Merge Sort", topic: "Sorting", difficulty: "Medium", tier: 4, structure: "arrays" },
  { slug: "quick-sort", title: "Quick Sort", topic: "Sorting", difficulty: "Medium", tier: 4, structure: "arrays" },
  { slug: "number-of-islands", title: "Number of Islands", topic: "Graphs", difficulty: "Medium", tier: 4, structure: "graphs" },
  { slug: "bfs-dfs", title: "Graph Traversal", topic: "Graphs", difficulty: "Medium", tier: 4, structure: "graphs" },
  { slug: "dijkstra", title: "Dijkstra's Shortest Path", topic: "Pathfinding", difficulty: "Hard", tier: 4, structure: "graphs" },
];

const BY_SLUG = new Map(PROBLEMS.map((p) => [p.slug, p]));

export function getProblem(slug: string): Problem | undefined {
  return BY_SLUG.get(slug);
}

/**
 * Look up a problem by slug. Returns undefined for a slug that isn't in the
 * catalog — callers should 404.
 *
 * This used to fabricate plausible metadata for ANY slug (title-cased from the
 * URL, topic "Coming soon"), which meant /problem/total-nonsense rendered a
 * real-looking page for a problem that does not exist. Every /problem/ link in
 * the app derives from PROBLEMS, so the fallback only ever fired for typos and
 * crawlers. A catalog slug that isn't implemented yet is a different case, and
 * `isImplemented()` in the registry already handles it.
 */
export function resolveProblem(slug: string): Problem | undefined {
  return BY_SLUG.get(slug);
}

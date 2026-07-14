import type { Trace } from "@/engine/types";
import { bubbleSortTrace } from "./sorting/bubble";
import { quickSortTrace } from "./sorting/quick";
import { mergeSortTrace } from "./sorting/merge";
import { queueTrace } from "./queue/queue-ops";
import { binarySearchTrace } from "./searching/binary-search";
import { twoPointersTrace } from "./two-pointers/pair-sum";
import { longestSubstringTrace } from "./sliding-window/longest-substring";
import { validParenthesesTrace } from "./stack/valid-parentheses";
import { reverseListTrace } from "./linked-list/reverse";
import { detectCycleTrace } from "./linked-list/detect-cycle";
import { twoSumTrace } from "./hashing/two-sum";
import { traversalTrace } from "./trees/traversals";
import { maxDepthTrace } from "./trees/max-depth";
import { numberOfIslandsTrace } from "./graphs/number-of-islands";
import { dijkstraTrace } from "./graphs/dijkstra";
import { bfsDfsTrace } from "./graphs/bfs-dfs";

export interface Dataset {
  id: string;
  label: string;
  values: (number | string)[];
  /** Optional scalar arg (search target, two-sum target). */
  arg?: number;
}

export interface ExampleDef {
  id: string;
  build: (ds: Dataset) => Trace;
  datasets: Dataset[];
}

const nums = (ds: Dataset) => ds.values as number[];
const strs = (ds: Dataset) => ds.values as string[];

/** Every implemented example. As phases land renderers, entries are added here. */
export const REGISTRY: Record<string, ExampleDef> = {
  "bubble-sort": {
    id: "bubble-sort",
    build: (ds) => bubbleSortTrace(nums(ds), ds.id),
    datasets: [
      { id: "default", label: "Mixed", values: [5, 2, 8, 1, 9, 3] },
      { id: "reversed", label: "Worst case", values: [6, 5, 4, 3, 2, 1] },
      { id: "nearly", label: "Nearly sorted", values: [2, 1, 3, 5, 4, 6] },
    ],
  },
  "quick-sort": {
    id: "quick-sort",
    build: (ds) => quickSortTrace(nums(ds), ds.id),
    datasets: [
      { id: "default", label: "Mixed", values: [7, 2, 9, 4, 3, 8, 1] },
      { id: "reversed", label: "Worst case", values: [6, 5, 4, 3, 2, 1] },
    ],
  },
  "merge-sort": {
    id: "merge-sort",
    build: (ds) => mergeSortTrace(nums(ds), ds.id),
    datasets: [
      { id: "default", label: "Mixed", values: [6, 3, 8, 2, 7, 4] },
      { id: "reversed", label: "Worst case", values: [6, 5, 4, 3, 2, 1] },
    ],
  },
  queue: {
    id: "queue",
    build: (ds) => queueTrace(nums(ds), ds.id),
    datasets: [{ id: "default", label: "Demo", values: [] }],
  },
  "binary-search": {
    id: "binary-search",
    build: (ds) => binarySearchTrace(nums(ds), ds.arg ?? 0, ds.id),
    datasets: [
      { id: "default", label: "Find 9", values: [1, 3, 4, 7, 9, 11, 15, 20], arg: 9 },
      { id: "miss", label: "Find 8 (absent)", values: [1, 3, 4, 7, 9, 11, 15, 20], arg: 8 },
    ],
  },
  "two-pointers": {
    id: "two-pointers",
    build: (ds) => twoPointersTrace(nums(ds), ds.arg ?? 0, ds.id),
    datasets: [
      { id: "default", label: "Target 14", values: [2, 5, 6, 8, 11, 15], arg: 14 },
      { id: "alt", label: "Target 13", values: [1, 3, 4, 6, 8, 9], arg: 13 },
    ],
  },
  "sliding-window": {
    id: "sliding-window",
    build: (ds) => longestSubstringTrace(strs(ds), ds.id),
    datasets: [
      { id: "default", label: "abcabcbb", values: "abcabcbb".split("") },
      { id: "alt", label: "pwwkew", values: "pwwkew".split("") },
    ],
  },
  "valid-parentheses": {
    id: "valid-parentheses",
    build: (ds) => validParenthesesTrace(strs(ds), ds.id),
    datasets: [
      { id: "nested", label: "([{}])", values: "([{}])".split("") },
      { id: "flat", label: "()[]{}", values: "()[]{}".split("") },
      { id: "invalid", label: "([)]", values: "([)]".split("") },
    ],
  },
  "reverse-linked-list": {
    id: "reverse-linked-list",
    build: (ds) => reverseListTrace(nums(ds), ds.id),
    datasets: [
      { id: "default", label: "1 → 2 → 3 → 4", values: [1, 2, 3, 4] },
      { id: "five", label: "5 nodes", values: [5, 4, 3, 2, 1] },
    ],
  },
  "detect-cycle": {
    id: "detect-cycle",
    build: (ds) => detectCycleTrace(nums(ds), ds.arg ?? -1, ds.id),
    datasets: [
      { id: "default", label: "Has a cycle", values: [3, 2, 0, 4], arg: 1 },
      { id: "none", label: "No cycle", values: [1, 2, 3, 4], arg: -1 },
    ],
  },
  "two-sum": {
    id: "two-sum",
    build: (ds) => twoSumTrace(nums(ds), ds.arg ?? 0, ds.id),
    datasets: [
      { id: "default", label: "Target 17", values: [5, 3, 8, 2, 9, 6], arg: 17 },
      { id: "alt", label: "Target 12", values: [10, 4, 7, 2, 8, 15], arg: 12 },
    ],
  },
  "binary-tree-traversal": {
    id: "binary-tree-traversal",
    build: (ds) => traversalTrace([], ds.id),
    datasets: [
      { id: "inorder", label: "Inorder", values: [] },
      { id: "preorder", label: "Preorder", values: [] },
      { id: "postorder", label: "Postorder", values: [] },
      { id: "level", label: "Level-order", values: [] },
    ],
  },
  "max-depth": {
    id: "max-depth",
    build: (ds) => maxDepthTrace([], ds.id),
    datasets: [
      { id: "default", label: "Unbalanced", values: [] },
      { id: "full", label: "Full", values: [] },
      { id: "skewed", label: "Left-skewed", values: [] },
    ],
  },
  "number-of-islands": {
    id: "number-of-islands",
    build: (ds) => numberOfIslandsTrace([], ds.id),
    datasets: [
      { id: "default", label: "4 islands", values: [] },
      { id: "scattered", label: "Scattered", values: [] },
    ],
  },
  dijkstra: {
    id: "dijkstra",
    build: (ds) => dijkstraTrace([], ds.id),
    datasets: [
      { id: "default", label: "Mud maze", values: [] },
      { id: "terrain", label: "Open terrain", values: [] },
    ],
  },
  "bfs-dfs": {
    id: "bfs-dfs",
    build: (ds) => bfsDfsTrace([], ds.id),
    datasets: [
      { id: "bfs", label: "BFS", values: [] },
      { id: "dfs", label: "DFS", values: [] },
    ],
  },
};

export function isImplemented(exampleId: string): boolean {
  return exampleId in REGISTRY;
}

export function getExample(exampleId: string): ExampleDef | undefined {
  return REGISTRY[exampleId];
}

/**
 * Per-example complexity + the one pattern insight a learner should walk away with.
 * `time`/`space` are Big-O strings; `idea` is the transferable takeaway (distinct from the
 * step-by-step DESCRIPTIONS, which explain what the algorithm does).
 */
export interface Lesson {
  time: string;
  space: string;
  idea: string;
}

export const LESSONS: Record<string, Lesson> = {
  "bubble-sort": {
    time: "O(n²)",
    space: "O(1)",
    idea: "Adjacent-swap sorting. Simple to reason about, but every pass only fixes one element — quadratic work makes it impractical beyond tiny inputs.",
  },
  "quick-sort": {
    time: "O(n log n) avg",
    space: "O(log n)",
    idea: "Divide and conquer by partitioning around a pivot. Fast on average; a bad pivot (already-sorted input) degrades it to O(n²).",
  },
  "merge-sort": {
    time: "O(n log n)",
    space: "O(n)",
    idea: "Split to single elements, then merge sorted halves. Guaranteed O(n log n) and stable — the trade-off is the O(n) buffer.",
  },
  queue: {
    time: "O(1) per op",
    space: "O(n)",
    idea: "First-in, first-out. Enqueue at the rear, dequeue from the front — the engine behind breadth-first search.",
  },
  "binary-search": {
    time: "O(log n)",
    space: "O(1)",
    idea: "Halve the search space each step. Only works on sorted data — that precondition is what buys the logarithmic speed.",
  },
  "two-pointers": {
    time: "O(n)",
    space: "O(1)",
    idea: "Two indices converging from the ends of a sorted array. Replaces a nested O(n²) scan with a single linear pass.",
  },
  "sliding-window": {
    time: "O(n)",
    space: "O(k)",
    idea: "Grow a window right, shrink it left on a violation. Each element enters and leaves the window at most once — linear, not quadratic.",
  },
  "valid-parentheses": {
    time: "O(n)",
    space: "O(n)",
    idea: "A stack matches each closing bracket to the most recent opener. LIFO order is exactly what nesting requires.",
  },
  "infix-to-postfix": {
    time: "O(n)",
    space: "O(n)",
    idea: "A stack holds operators until precedence or a ')' forces them out — converting infix to postfix in one left-to-right pass. The same LIFO insight as bracket matching, now carrying operators instead of just openers.",
  },
  "reverse-linked-list": {
    time: "O(n)",
    space: "O(1)",
    idea: "Three pointers (prev, curr, next) flip each link in place. No extra list — just careful pointer rewiring.",
  },
  "detect-cycle": {
    time: "O(n)",
    space: "O(1)",
    idea: "Floyd's tortoise & hare: a fast pointer laps a slow one inside any loop. Detects cycles without a visited set.",
  },
  "two-sum": {
    time: "O(n)",
    space: "O(n)",
    idea: "Trade space for time — a hash map turns 'have I seen the complement?' into an O(1) lookup, collapsing O(n²) to O(n).",
  },
  "binary-tree-traversal": {
    time: "O(n)",
    space: "O(h)",
    idea: "Every traversal visits all n nodes; the order (in/pre/post/level) decides the sequence. Recursion's depth is the tree height h.",
  },
  "max-depth": {
    time: "O(n)",
    space: "O(h)",
    idea: "A node's depth is 1 + the deeper subtree. The call stack does the bookkeeping as recursion unwinds back up.",
  },
  "number-of-islands": {
    time: "O(rows·cols)",
    space: "O(rows·cols)",
    idea: "Flood-fill each unvisited land cell once. Counting connected components = counting how many flood-fills you start.",
  },
  dijkstra: {
    time: "O(E log V)",
    space: "O(V)",
    idea: "Always expand the nearest unsettled node. A priority queue keeps that 'nearest' choice cheap — greedy, and provably shortest on non-negative weights.",
  },
  "bfs-dfs": {
    time: "O(V + E)",
    space: "O(V)",
    idea: "Same graph, two frontiers: a queue sweeps level-by-level (BFS); a stack/recursion plunges deep first (DFS).",
  },
};

export function getLesson(exampleId: string): Lesson | undefined {
  return LESSONS[exampleId];
}

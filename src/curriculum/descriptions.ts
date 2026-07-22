/**
 * One-paragraph plain-English summaries, shown in the workspace header while the
 * learner is in beginner mode.
 *
 * These live here rather than inside `ProblemWorkspace` because that component is
 * `"use client"` — prose sitting in it ships to the browser as part of the client
 * bundle and re-renders with it. Content is data; keep it out of components.
 *
 * Keyed by example id (the problem slug). A missing key is not an error — the
 * workspace falls back to a generic line.
 */
export const DESCRIPTIONS: Record<string, string> = {
  "bubble-sort":
    "Repeatedly compare adjacent elements and swap them when they're out of order. After each pass the largest remaining value bubbles to its final position.",
  "quick-sort":
    "Pick a pivot, partition the range so smaller values sit left and larger sit right, then recurse on each side. The pivot lands in its final spot every partition.",
  "binary-search":
    "On a sorted array, check the middle element and discard the half that can't contain the target — halving the search space every step.",
  "two-pointers":
    "On a sorted array, start a pointer at each end. Move them inward based on whether the current sum is too small or too large until they meet the target.",
  "sliding-window":
    "Grow a window to the right one character at a time. When a character repeats, shrink the window from the left, tracking the longest window seen.",
  "valid-parentheses":
    "Scan the string, pushing every opening bracket. Each closing bracket must match the bracket on top of the stack — otherwise the string is invalid.",
  "infix-to-postfix":
    "Scan the expression left to right. Operands go straight to the output; operators wait on a stack until a higher- or equal-precedence operator, or a closing parenthesis, forces them off. The result is postfix — readable with no parentheses and no precedence rules.",
  "reverse-linked-list":
    "Walk the list with three pointers. Save the next node, flip the current node's pointer to face backward, then advance — reversing the list in a single pass.",
  "detect-cycle":
    "Two pointers move at different speeds. If the list has a cycle, the fast pointer laps the slow one and they meet; if it reaches the end, there's no cycle.",
  "two-sum":
    "For each number, compute the complement that would reach the target. If we've already seen it, we're done; otherwise store the current number and keep scanning — O(n) with a hash map.",
  "merge-sort":
    "Recursively split the array into halves until each piece is trivially sorted, then merge sorted halves back together using a small buffer. Stable, O(n log n).",
  queue:
    "A queue is first-in, first-out. New items join at the rear; we always remove from the front — the opposite of a stack.",
  "binary-tree-traversal":
    "Walk every node of a tree. Switch the traversal order (in / pre / post / level) to see how the visit sequence changes — the recursion is tracked on the call stack.",
  "max-depth":
    "A node's depth is one plus the deeper of its two subtrees. The recursion descends to the leaves, then the call stack unwinds, computing each subtree's depth on the way back up.",
  "number-of-islands":
    "Scan a grid of land and water. Each time you hit unvisited land, flood-fill the whole connected island so it's counted once — the number of flood-fills is the island count.",
  dijkstra:
    "Grow a frontier outward from the start, always expanding the nearest unvisited cell. Each cell records its shortest distance; once the target is reached, trace the path back.",
  "bfs-dfs":
    "Explore a graph from a starting node. BFS uses a queue to sweep outward level by level; DFS uses a stack (recursion) to plunge deep before backtracking.",
};

/** The description for an example, or a generic fallback. */
export function getDescription(exampleId: string): string {
  return DESCRIPTIONS[exampleId] ?? "Step through the algorithm and watch each change.";
}

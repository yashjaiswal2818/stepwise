export type StructureSlug =
  | "arrays"
  | "linked-lists"
  | "stacks"
  | "queues"
  | "hash-tables"
  | "trees"
  | "graphs"
  | "recursion";

export interface Structure {
  slug: StructureSlug;
  title: string;
  blurb: string;
  /** CSS color used for the card's accent glow + preview tint. */
  accent: string;
  /** Deep link into a representative example. */
  href: string;
  tryLabel: string;
}

/** The eight "worlds" shown on the landing page, each with a bespoke preview. */
export const STRUCTURES: Structure[] = [
  {
    slug: "arrays",
    title: "Arrays",
    blurb: "Data lined up in order — indexed, contiguous, and instantly addressable.",
    accent: "var(--state-compare)",
    href: "/problem/bubble-sort",
    tryLabel: "Bubble Sort",
  },
  {
    slug: "linked-lists",
    title: "Linked Lists",
    blurb: "Elements joined in a chain, each node quietly pointing to the next.",
    accent: "var(--state-swap)",
    href: "/problem/reverse-linked-list",
    tryLabel: "Reverse a List",
  },
  {
    slug: "stacks",
    title: "Stacks",
    blurb: "Last in, first out — a tower of blocks that grows and unwinds.",
    accent: "var(--state-active)",
    href: "/problem/valid-parentheses",
    tryLabel: "Valid Parentheses",
  },
  {
    slug: "queues",
    title: "Queues",
    blurb: "First come, first served — data flowing through in an orderly line.",
    accent: "var(--state-frontier)",
    href: "/problem/queue",
    tryLabel: "Queue Operations",
  },
  {
    slug: "hash-tables",
    title: "Hash Tables",
    blurb: "Keys mapped straight to buckets for instant, almost magical lookup.",
    accent: "var(--accent-cyan)",
    href: "/problem/two-sum",
    tryLabel: "Two Sum",
  },
  {
    slug: "trees",
    title: "Trees",
    blurb: "Branching hierarchies where every node opens into more.",
    accent: "var(--state-final)",
    href: "/problem/binary-tree-traversal",
    tryLabel: "Tree Traversals",
  },
  {
    slug: "graphs",
    title: "Graphs",
    blurb: "A web of nodes and edges modeling any network of relationships.",
    accent: "var(--state-path)",
    href: "/problem/number-of-islands",
    tryLabel: "Number of Islands",
  },
  {
    slug: "recursion",
    title: "Recursion",
    blurb: "Problems that solve themselves by calling themselves — frame by frame.",
    accent: "var(--brand-strong)",
    href: "/problem/max-depth",
    tryLabel: "Maximum Depth",
  },
];

export interface FeaturedExample {
  slug: string;
  title: string;
  topic: string;
  difficulty: "Easy" | "Medium" | "Hard";
}

/** A teaser strip of canonical problems. */
export const FEATURED: FeaturedExample[] = [
  { slug: "merge-sort", title: "Merge Sort", topic: "Divide & Conquer", difficulty: "Medium" },
  { slug: "binary-search", title: "Binary Search", topic: "Searching", difficulty: "Easy" },
  { slug: "sliding-window", title: "Longest Substring", topic: "Sliding Window", difficulty: "Medium" },
  { slug: "detect-cycle", title: "Detect a Cycle", topic: "Fast & Slow Pointers", difficulty: "Easy" },
  { slug: "quick-sort", title: "Quick Sort", topic: "Partitioning", difficulty: "Medium" },
  { slug: "dijkstra", title: "Dijkstra's Path", topic: "Pathfinding", difficulty: "Hard" },
];

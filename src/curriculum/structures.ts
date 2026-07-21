import { PROBLEMS, type Problem } from "./catalog";

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
  /** Deep link into a representative example. */
  href: string;
  tryLabel: string;
}

/**
 * The eight "worlds" shown on the landing page, each with a bespoke preview.
 *
 * No per-structure `accent`: colour in this product means algorithm state, so a
 * structure cannot own a hue. Identity is carried by the icon, the label, and the
 * bespoke preview — and the old mapping wasn't even injective (linked-lists and
 * recursion were both --state-swap), so two "different" worlds read as one colour.
 */
export const STRUCTURES: Structure[] = [
  {
    slug: "arrays",
    title: "Arrays",
    blurb: "Data lined up in order — indexed, contiguous, and instantly addressable.",
    href: "/problem/bubble-sort",
    tryLabel: "Bubble Sort",
  },
  {
    slug: "linked-lists",
    title: "Linked Lists",
    blurb: "Elements joined in a chain, each node quietly pointing to the next.",
    href: "/problem/reverse-linked-list",
    tryLabel: "Reverse a List",
  },
  {
    slug: "stacks",
    title: "Stacks",
    blurb: "Last in, first out — a tower of blocks that grows and unwinds.",
    href: "/problem/valid-parentheses",
    tryLabel: "Valid Parentheses",
  },
  {
    slug: "queues",
    title: "Queues",
    blurb: "First come, first served — data flowing through in an orderly line.",
    href: "/problem/queue",
    tryLabel: "Queue Operations",
  },
  {
    slug: "hash-tables",
    title: "Hash Tables",
    blurb: "Keys mapped straight to buckets for instant, almost magical lookup.",
    href: "/problem/two-sum",
    tryLabel: "Two Sum",
  },
  {
    slug: "trees",
    title: "Trees",
    blurb: "Branching hierarchies where every node opens into more.",
    href: "/problem/binary-tree-traversal",
    tryLabel: "Tree Traversals",
  },
  {
    slug: "graphs",
    title: "Graphs",
    blurb: "A web of nodes and edges modeling any network of relationships.",
    href: "/problem/number-of-islands",
    tryLabel: "Number of Islands",
  },
  {
    slug: "recursion",
    title: "Recursion",
    blurb: "Problems that solve themselves by calling themselves — frame by frame.",
    href: "/problem/max-depth",
    tryLabel: "Maximum Depth",
  },
];

/**
 * A featured problem is a catalog problem — not a copy of one.
 *
 * This list used to restate title/topic/difficulty inline, and it had already
 * drifted: it billed Merge Sort as "Divide & Conquer" and Quick Sort as
 * "Partitioning" while the catalog called both "Sorting", and it shortened
 * "Dijkstra's Shortest Path" to "Dijkstra's Path". The landing page and
 * /problems disagreed about the same problem.
 *
 * So curation lives here and facts live in catalog.ts. Renaming a problem or
 * re-filing its topic now moves both surfaces at once, and there is no second
 * place to forget.
 */
export type FeaturedExample = Problem;

const FEATURED_SLUGS = [
  "merge-sort",
  "binary-search",
  "sliding-window",
  "detect-cycle",
  "quick-sort",
  "dijkstra",
];

export const FEATURED: FeaturedExample[] = FEATURED_SLUGS.map((slug) => {
  const problem = PROBLEMS.find((p) => p.slug === slug);
  if (!problem) {
    // Fail at import — which means at `next build`, since / is prerendered —
    // rather than silently dropping a card and shipping a short strip.
    throw new Error(
      `curriculum/structures: FEATURED references "${slug}", which is not in PROBLEMS (curriculum/catalog.ts). ` +
        `Fix the slug or remove it from FEATURED_SLUGS.`,
    );
  }
  return problem;
});

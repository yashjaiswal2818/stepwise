/**
 * Foundations — the Phase-0 pre-concept units that sit BEFORE the eight
 * structures. A deliberate sibling of the chapter system, not a widening of
 * `StructureSlug`: that union feeds four exhaustive Records (icons, toys,
 * landing previews, `Problem.structure`) that would all break or lie if a
 * "memory" unit pretended to be a ninth world. A memory cell is not a world;
 * it is the ground the worlds stand on.
 *
 * Like a chapter, a unit is a Trace like any other — its steps come from a
 * tracer in `src/algorithms/lessons/`, registered as `lesson-<slug>`, executed
 * at runtime. Only curriculum metadata lives here.
 */

export type FoundationSlug = "data-and-algorithms" | "memory" | "pointers" | "growth";

export interface FoundationUnit {
  slug: FoundationSlug;
  /** Key into the algorithm REGISTRY — always `lesson-<slug>`. */
  exampleId: string;
  title: string;
  /** The one thing this unit is for. One sentence, learner-facing. */
  about: string;
  /** Honest reading estimate, shown as "≈ N min". */
  minutes: number;
}

/** Array order IS the reading order — the same convention as LEARN_ORDER. */
export const FOUNDATIONS: FoundationUnit[] = [
  {
    slug: "data-and-algorithms",
    exampleId: "lesson-data-and-algorithms",
    title: "Data and instructions",
    about:
      "What a computer actually has to work with: values it can look at one at a time, and steps dumb enough to follow exactly.",
    minutes: 5,
  },
  {
    slug: "memory",
    exampleId: "lesson-memory",
    title: "Where data lives",
    about:
      "Memory is a row of numbered cells. Everything else in this course is a strategy for which cell to look at next.",
    minutes: 6,
  },
  {
    slug: "pointers",
    exampleId: "lesson-pointers",
    title: "Boxes and arrows",
    about:
      "A variable can hold a value — or the address of one. Following that arrow is the move behind every linked structure.",
    minutes: 7,
  },
  {
    slug: "growth",
    exampleId: "lesson-growth",
    title: "How work grows",
    about:
      "Count the looks, not the seconds. What doubling the input costs you is the only complexity idea you need first.",
    minutes: 6,
  },
];

export function getFoundationUnit(slug: string): FoundationUnit | undefined {
  return FOUNDATIONS.find((u) => u.slug === slug);
}

/** The unit after `slug`, or undefined for the last (its page then links to /learn/arrays). */
export function nextFoundationUnit(slug: FoundationSlug): FoundationUnit | undefined {
  const i = FOUNDATIONS.findIndex((u) => u.slug === slug);
  return FOUNDATIONS[i + 1];
}

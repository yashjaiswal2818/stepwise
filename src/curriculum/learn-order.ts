import { PROBLEMS, type Problem } from "./catalog";
import type { StructureSlug } from "./structures";
import type { LastVisited } from "@/engagement/useProgress";

/**
 * The suggested reading order for /learn — the "builds on" DAG flattened into a
 * single line you can read top to bottom. It is a *suggested* path from the
 * ground up, NOT a hard prerequisite chain (the underlying graph branches).
 *
 * This is the single source of truth for order. The lead's "Up next", the spine's
 * frontier marker, and the floating Continue pill all derive "where you are" from
 * the functions below, so they can never disagree.
 */
export const LEARN_ORDER: StructureSlug[] = [
  "arrays",
  "hash-tables",
  "linked-lists",
  "stacks",
  "queues",
  "recursion",
  "trees",
  "graphs",
];

/**
 * Problems in a structure, in catalog order. Derived straight from PROBLEMS, so a
 * new problem appears automatically — no hand-authored coordinate, and none of the
 * constellation's "forgot POS → silently invisible" failure mode.
 */
export function problemsIn(slug: StructureSlug): Problem[] {
  return PROBLEMS.filter((p) => p.structure === slug);
}

export function sectionProgress(slug: StructureSlug, solved: string[]): { done: number; total: number } {
  const ps = problemsIn(slug);
  return { done: ps.filter((p) => solved.includes(p.slug)).length, total: ps.length };
}

/**
 * The first unsolved problem, scanning sections in LEARN_ORDER and problems in
 * catalog order within each. The one canonical "what's next".
 */
export function frontierProblem(solved: string[]): Problem | undefined {
  for (const slug of LEARN_ORDER) {
    for (const p of problemsIn(slug)) {
      if (!solved.includes(p.slug)) return p;
    }
  }
  return undefined;
}

function structureFromHref(href: string): StructureSlug | undefined {
  const problem = href.match(/^\/problem\/([^/?#]+)/);
  if (problem) return PROBLEMS.find((p) => p.slug === problem[1])?.structure;
  const lesson = href.match(/^\/learn\/([^/?#]+)/);
  if (lesson) return LEARN_ORDER.find((s) => s === lesson[1]);
  return undefined;
}

/**
 * The section to auto-expand (the one visual anchor): the one you were last in if
 * it is still incomplete, otherwise the one holding the frontier problem, otherwise
 * none (everything solved). Chapters are never stations — the frontier is always a
 * problem or null.
 */
export function frontierSection(solved: string[], lastVisited: LastVisited | null): StructureSlug | null {
  if (lastVisited) {
    const structure = structureFromHref(lastVisited.href);
    if (structure) {
      const { done, total } = sectionProgress(structure, solved);
      if (total === 0 || done < total) return structure;
    }
  }
  return frontierProblem(solved)?.structure ?? null;
}

import type { StructureSlug } from "./structures";

/**
 * Chapters — a concept lesson per structure, sitting *before* the problems.
 *
 * A lesson is a Trace like any other (its steps come from a tracer in
 * `src/algorithms/lessons/`), so the only thing that lives here is the curriculum
 * metadata: which structure a lesson teaches, its registry `exampleId`, and the
 * one-line promise of what a beginner walks away knowing. Facts about the run
 * (its title, its steps) live in the trace, never restated here.
 *
 * A structure with no entry simply has no lesson yet — the route 404s, exactly
 * like an unimplemented problem. Add lessons here as their tracers land.
 */
export interface LessonMeta {
  structure: StructureSlug;
  /** Key into the algorithm REGISTRY — always `lesson-<structure>`. */
  exampleId: string;
  /** Shown in the workspace header before the trace loads. */
  title: string;
  /** The one thing this chapter is for. One sentence, learner-facing. */
  about: string;
}

export const LESSONS: Partial<Record<StructureSlug, LessonMeta>> = {
  arrays: {
    structure: "arrays",
    exampleId: "lesson-arrays",
    title: "What an array is",
    about:
      "Before any algorithm: what a run of boxes actually is, why reading by index is instant, and why finding a value is not.",
  },
};

export function getLessonMeta(structure: string): LessonMeta | undefined {
  return LESSONS[structure as StructureSlug];
}

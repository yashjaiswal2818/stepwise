import type { Scene, Step, StepOp, Trace } from "@/engine/types";

/**
 * Shared authoring backbone. Owns the growing `steps` array and the single
 * `commit` entry point; per-family tracers (ArrayTracer, ListTracer, …) add
 * semantic mutators on top. One meaningful action = one committed step = one
 * tick of the UI step counter.
 */
export abstract class BaseTracer {
  protected steps: Step[] = [];

  protected commit(
    scene: Scene,
    narration: string,
    codeLines: number[],
    op?: StepOp,
    vars?: Record<string, string | number>,
  ): void {
    this.steps.push({ i: this.steps.length, scene, narration, codeLines, op, vars });
  }

  build(meta: Omit<Trace, "steps">): Trace {
    return { ...meta, steps: this.steps };
  }
}

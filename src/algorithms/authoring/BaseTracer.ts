import type { Scene, Step, StepOp, Trace } from "@/engine/types";

/**
 * Shared authoring backbone. Owns the growing `steps` array and the single
 * `commit` entry point; per-family tracers (ArrayTracer, ListTracer, …) add
 * semantic mutators on top. One meaningful action = one committed step = one
 * tick of the UI step counter.
 */
export abstract class BaseTracer {
  protected steps: Step[] = [];

  /** Lessons only: how many lines of the source exist at the current step. */
  private pen?: number;

  /**
   * Lessons only: mark that the program is now `n` lines long. Every subsequent
   * committed step carries this as `linesWritten` until it changes, which is what
   * lets a lesson's code panel grow line by line. Problem tracers never call it,
   * so `pen` stays undefined and the key is omitted — their steps are unchanged.
   */
  written(n: number): this {
    this.pen = n;
    return this;
  }

  protected commit(
    scene: Scene,
    narration: string,
    codeLines: number[],
    op?: StepOp,
    vars?: Record<string, string | number>,
  ): void {
    this.steps.push({
      i: this.steps.length,
      scene,
      narration,
      codeLines,
      op,
      vars,
      ...(this.pen != null ? { linesWritten: this.pen } : {}),
    });
  }

  build(meta: Omit<Trace, "steps">): Trace {
    return { ...meta, steps: this.steps };
  }
}

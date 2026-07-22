import type { Ask, Scene, Step, StepOp, Trace } from "@/engine/types";

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

  /** One-shot: a predict-gate staged to ride on the NEXT committed step. */
  private staged?: Ask;

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

  /**
   * Stage a predict-gate for the next committed step (the `written()` pattern,
   * except one-shot: an ask is a point event, not a mode). Throws on obvious
   * author errors at BUILD time — `validate:traces` executes every build, so a
   * malformed or orphaned ask fails CI loudly instead of silently vanishing.
   *
   * Gate semantics for consumers: `steps[i].ask` means "pose before revealing
   * step i, while step i-1's scene is on screen" — so the prompt must be
   * answerable from the PRIOR scene alone. Stage conditionally when a
   * distractor's wrongness depends on live state (e.g. only when stack depth
   * ≥ 2), and latch so a loop stages the id at most once per trace.
   */
  ask(a: Ask): this {
    if (this.staged) {
      throw new Error(`ask "${this.staged.id}" staged but never committed before ask "${a.id}"`);
    }
    if (!Number.isInteger(a.answerIndex) || a.answerIndex < 0 || a.answerIndex >= a.options.length) {
      throw new Error(`ask "${a.id}": answerIndex ${a.answerIndex} not in 0..${a.options.length - 1}`);
    }
    this.staged = a;
    return this;
  }

  protected commit(
    scene: Scene,
    narration: string,
    codeLines: number[],
    op?: StepOp,
    vars?: Record<string, string | number>,
    why?: string,
  ): void {
    const i = this.steps.length;
    if (this.staged && i === 0) {
      throw new Error(`ask "${this.staged.id}" on step 0 — there is no prior scene to predict from`);
    }
    this.steps.push({
      i,
      scene,
      narration,
      codeLines,
      op,
      vars,
      ...(why?.trim() ? { why } : {}),
      ...(this.staged ? { ask: this.staged } : {}),
      ...(this.pen != null ? { linesWritten: this.pen } : {}),
    });
    this.staged = undefined;
  }

  build(meta: Omit<Trace, "steps">): Trace {
    if (this.staged) {
      throw new Error(`ask "${this.staged.id}" staged but never committed`);
    }
    return { ...meta, steps: this.steps };
  }
}

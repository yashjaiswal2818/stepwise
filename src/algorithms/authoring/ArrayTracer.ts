import type { ArrayScene, Cell, ElementState, Region, StepOp } from "@/engine/types";
import { BaseTracer } from "./BaseTracer";

type Line = number | number[];

/**
 * Records an array algorithm as a sequence of full snapshots. The tracer holds
 * the real values itself (no shadow array), so the picture can never drift from
 * the algorithm. Element `id`s are assigned once and travel with the value
 * through swaps — only `index` changes — which is what makes a swap *slide*.
 */
export class ArrayTracer extends BaseTracer {
  private cells: Cell[];
  private pointers = new Map<string, number>(); // label -> index
  private regions: Region[] = [];
  private vars: Record<string, string | number> = {};
  private aux: Cell[] = [];
  private auxLabel?: string;
  private auxCounter = 0;
  /** Lessons only: cell ids whose state survives the per-step reset (see `mark`). */
  private held = new Set<string>();

  constructor(values: (number | string)[]) {
    super();
    this.cells = values.map((v, i) => ({ id: `e${i}`, value: v, index: i, state: "default" }));
  }

  // ---- reads ----
  value(i: number): number {
    return this.cells[i].value as number;
  }
  get length(): number {
    return this.cells.length;
  }
  greater(i: number, j: number): boolean {
    return this.value(i) > this.value(j);
  }
  less(i: number, j: number): boolean {
    return this.value(i) < this.value(j);
  }

  // ---- pointers / vars / regions (mutate current state, no snapshot) ----
  setPointer(label: string, index: number): this {
    this.pointers.set(label, index);
    return this;
  }
  clearPointer(label: string): this {
    this.pointers.delete(label);
    return this;
  }
  setVar(key: string, v: number | string): this {
    this.vars[key] = v;
    return this;
  }
  setVars(v: Record<string, number | string>): this {
    Object.assign(this.vars, v);
    return this;
  }
  clearVar(key: string): this {
    delete this.vars[key];
    return this;
  }
  setRegion(id: string, coversIdx: number[], state: ElementState, label?: string): this {
    this.regions = this.regions.filter((r) => r.id !== id);
    this.regions.push({ id, covers: coversIdx.map((i) => this.cells[i].id), state, label });
    return this;
  }
  clearRegion(id: string): this {
    this.regions = this.regions.filter((r) => r.id !== id);
    return this;
  }

  // ---- lesson authoring: paint / fill without committing (no snapshot) ----
  /**
   * Set cell states WITHOUT committing a step, so one snapshot can carry several
   * different states (an `active` pointer with a `visited` trail behind it).
   * `hold: true` opts those cells out of the post-commit reset in `snap`, which
   * lets a lesson hold a highlight while the narration talks around it for
   * several beats. `final` is already permanent and is unaffected.
   */
  mark(indices: number[], state: ElementState, opts?: { hold?: boolean }): this {
    for (const i of indices) {
      const c = this.cells[i];
      if (!c) continue;
      c.state = state;
      if (opts?.hold) this.held.add(c.id);
      else this.held.delete(c.id);
    }
    return this;
  }

  /** Release held cells (all of them if no indices given) back to baseline. */
  release(indices?: number[]): this {
    const ids = indices
      ? indices.map((i) => this.cells[i]?.id).filter((x): x is string => !!x)
      : [...this.held];
    for (const id of ids) {
      this.held.delete(id);
      const c = this.cells.find((x) => x.id === id);
      if (c && c.state !== "final") c.state = "default";
    }
    return this;
  }

  /** Write a value into a slot without committing — for lessons that fill an
   *  array that starts out as empty boxes. */
  setValue(i: number, v: number | string): this {
    const c = this.cells[i];
    if (c) c.value = v;
    return this;
  }

  // ---- semantic ops (each commits exactly one step) ----
  note(narration: string, line: Line, op: StepOp = "init"): this {
    this.snap(narration, line, op);
    return this;
  }

  setState(indices: number[], state: ElementState, narration: string, line: Line, op?: StepOp): this {
    for (const i of indices) this.cells[i].state = state;
    this.snap(narration, line, op);
    return this;
  }

  compare(i: number, j: number, line: Line, narration?: string): this {
    this.cells[i].state = "active";
    this.cells[j].state = "compare";
    this.snap(narration ?? `Compare ${this.value(i)} and ${this.value(j)}`, line, "compare");
    return this;
  }

  swap(i: number, j: number, line: Line, narration?: string): this {
    const a = this.value(i);
    const b = this.value(j);
    [this.cells[i], this.cells[j]] = [this.cells[j], this.cells[i]]; // id travels with the value
    this.cells[i].index = i;
    this.cells[j].index = j;
    this.cells[i].state = "swap";
    this.cells[j].state = "swap";
    this.snap(narration ?? `Swap ${a} and ${b} — ${a} > ${b}`, line, "swap");
    return this;
  }

  markFinal(i: number, line: Line, narration?: string): this {
    this.cells[i].state = "final";
    this.snap(narration ?? `${this.value(i)} is now in its final position`, line, "mark");
    return this;
  }

  finishAll(line: Line, narration: string): this {
    for (const c of this.cells) c.state = "final";
    this.snap(narration, line, "done");
    return this;
  }

  // ---- merge buffer (aux row), used by merge sort ----
  setAuxLabel(label: string): this {
    this.auxLabel = label;
    return this;
  }
  auxTake(value: number, targetIndex: number, sourceIndex: number, line: Line, narration: string): this {
    this.aux.push({ id: `x${this.auxCounter++}`, value, index: targetIndex, state: "swap" });
    this.cells[sourceIndex].state = "visited";
    this.snap(narration, line, "insert");
    return this;
  }
  auxCopyBack(line: Line, narration: string): this {
    for (const c of this.aux) {
      this.cells[c.index].value = c.value;
      this.cells[c.index].state = "swap";
    }
    this.aux = [];
    this.snap(narration, line, "set");
    return this;
  }

  // ---- snapshot ----
  private snap(narration: string, line: Line, op?: StepOp): void {
    const codeLines = Array.isArray(line) ? line : [line];
    const scene: ArrayScene = {
      kind: "array",
      cells: this.cells.map((c) => ({ ...c })), // frozen copy of this step
      pointers: [...this.pointers].map(([label, idx]) => ({
        id: `p_${label}`,
        label,
        target: this.cells[idx]?.id ?? "",
      })),
      regions: this.regions.map((r) => ({ ...r })),
      aux: this.aux.length ? { cells: this.aux.map((c) => ({ ...c })), label: this.auxLabel } : undefined,
    };
    this.commit(scene, narration, codeLines, op, { ...this.vars });
    // Reset transient highlights back to baseline; 'final' persists, and cells a
    // lesson explicitly `mark(..., { hold: true })` persist until `release`d.
    for (const c of this.cells) if (c.state !== "final" && !this.held.has(c.id)) c.state = "default";
  }
}

import type { GridCell, GridScene, Frame, StepOp, ElementState } from "@/engine/types";
import { BaseTracer } from "./BaseTracer";

type Line = number | number[];

/** Records a grid algorithm (flood fill, BFS/DFS on a grid, pathfinding). */
export class GridTracer extends BaseTracer {
  readonly rows: number;
  readonly cols: number;
  private grid: GridCell[][];
  private frontier: Frame[] = [];
  private label?: string;
  private vars: Record<string, string | number> = {};

  constructor(rows: number, cols: number) {
    super();
    this.rows = rows;
    this.cols = cols;
    this.grid = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c): GridCell => ({ id: `g${r}_${c}`, r, c, state: "default", passable: true })),
    );
  }

  cell(r: number, c: number): GridCell {
    return this.grid[r][c];
  }
  inBounds(r: number, c: number): boolean {
    return r >= 0 && r < this.rows && c >= 0 && c < this.cols;
  }
  setState(r: number, c: number, s: ElementState): this {
    this.grid[r][c].state = s;
    return this;
  }
  setValue(r: number, c: number, v: number | string): this {
    this.grid[r][c].value = v;
    return this;
  }
  setPassable(r: number, c: number, p: boolean): this {
    this.grid[r][c].passable = p;
    return this;
  }
  setFrontier(items: { value: string | number; state: ElementState }[]): this {
    this.frontier = items.map((it, i) => ({ id: `fr${i}`, value: String(it.value), depth: i, state: it.state }));
    return this;
  }
  setLabel(l: string): this {
    this.label = l;
    return this;
  }
  setVar(k: string, v: number | string): this {
    this.vars[k] = v;
    return this;
  }

  step(narration: string, line: Line, op?: StepOp): this {
    this.snap(narration, line, op);
    return this;
  }

  private snap(narration: string, line: Line, op?: StepOp): void {
    const codeLines = Array.isArray(line) ? line : [line];
    const cells: GridCell[] = [];
    for (const row of this.grid) for (const c of row) cells.push({ ...c });
    const scene: GridScene = {
      kind: "grid",
      rows: this.rows,
      cols: this.cols,
      cells,
      frontier: this.frontier.length ? this.frontier.map((f) => ({ ...f })) : undefined,
      label: this.label,
    };
    this.commit(scene, narration, codeLines, op, { ...this.vars });
  }
}

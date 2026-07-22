import type { GNode, GEdge, GraphScene, Frame, StepOp, ElementState } from "@/engine/types";
import { BaseTracer } from "./BaseTracer";

type Line = number | number[];
export interface NodeSpec {
  id: string;
  value: number | string;
  x: number;
  y: number;
}

/** Records a node-link graph algorithm (BFS / DFS) with preset node positions. */
export class GraphTracer extends BaseTracer {
  private nodes: GNode[];
  private edges: GEdge[];
  private adj = new Map<string, string[]>();
  private frontier: Frame[] = [];
  private label?: string;
  private vars: Record<string, string | number> = {};

  constructor(nodes: NodeSpec[], edges: [string, string][]) {
    super();
    this.nodes = nodes.map((n) => ({ id: n.id, value: n.value, x: n.x, y: n.y, state: "default" }));
    this.edges = edges.map(([a, b]) => ({ id: `${a}-${b}`, source: a, target: b, state: "default" }));
    for (const n of nodes) this.adj.set(n.id, []);
    for (const [a, b] of edges) {
      this.adj.get(a)!.push(b);
      this.adj.get(b)!.push(a);
    }
  }

  neighbors(id: string): string[] {
    return this.adj.get(id) ?? [];
  }
  valueOf(id: string): number | string {
    return this.nodes.find((n) => n.id === id)?.value ?? "";
  }
  nodeState(id: string, s: ElementState): this {
    const n = this.nodes.find((x) => x.id === id);
    if (n) n.state = s;
    return this;
  }
  edgeState(a: string, b: string, s: ElementState): this {
    const e = this.edges.find((e) => (e.source === a && e.target === b) || (e.source === b && e.target === a));
    if (e) e.state = s;
    return this;
  }
  setFrontier(ids: string[], state: ElementState): this {
    this.frontier = ids.map((id, i) => ({ id: `fr_${id}`, value: String(this.valueOf(id)), depth: i, state }));
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
  step(narration: string, line: Line, op?: StepOp, why?: string): this {
    this.snap(narration, line, op, why);
    return this;
  }

  private snap(narration: string, line: Line, op?: StepOp, why?: string): void {
    const codeLines = Array.isArray(line) ? line : [line];
    const scene: GraphScene = {
      kind: "graph",
      layout: "preset",
      nodes: this.nodes.map((n) => ({ ...n })),
      edges: this.edges.map((e) => ({ ...e })),
      frontier: this.frontier.length ? this.frontier.map((f) => ({ ...f })) : undefined,
      label: this.label,
    };
    this.commit(scene, narration, codeLines, op, { ...this.vars }, why);
  }
}

import type { GEdge, GNode, ListScene, StepOp, ElementState } from "@/engine/types";
import { BaseTracer } from "./BaseTracer";

type Line = number | number[];

/**
 * Records a singly-linked-list algorithm. Nodes keep fixed positions (original
 * order); `next` pointers are what change, so re-wiring an edge animates while
 * the node stays put — exactly the reverse-a-list "arrows flip" effect.
 */
export class ListTracer extends BaseTracer {
  private nodes: GNode[];
  private next = new Map<string, string | null>();
  private pointers: { label: string; id: string | null; color?: string }[] = [];
  private edgeState = new Map<string, ElementState>();
  private vars: Record<string, string | number> = {};

  constructor(values: number[], opts?: { cycleTo?: number }) {
    super();
    this.nodes = values.map((v, i) => ({ id: `n${i}`, value: v, state: "default" }));
    const n = this.nodes.length;
    for (let i = 0; i < n; i++) {
      const tail =
        i < n - 1 ? this.nodes[i + 1].id : opts?.cycleTo != null ? this.nodes[opts.cycleTo].id : null;
      this.next.set(this.nodes[i].id, tail);
    }
  }

  id(i: number): string {
    return this.nodes[i].id;
  }
  headId(): string | null {
    return this.nodes[0]?.id ?? null;
  }
  valueOf(id: string | null): string {
    if (!id) return "null";
    const nd = this.nodes.find((x) => x.id === id);
    return nd ? String(nd.value) : "null";
  }
  nextOf(id: string | null): string | null {
    return id ? this.next.get(id) ?? null : null;
  }

  setPointer(label: string, id: string | null, color?: string): this {
    this.pointers = this.pointers.filter((p) => p.label !== label);
    this.pointers.push({ label, id, color });
    return this;
  }
  clearPointer(label: string): this {
    this.pointers = this.pointers.filter((p) => p.label !== label);
    return this;
  }
  rewire(fromId: string, toId: string | null): this {
    this.next.set(fromId, toId);
    return this;
  }
  /** Mutate a node's value WITHOUT committing — mirrors ArrayTracer.setValue.
   *  Exists so aliasing can be SHOWN, not asserted: the pointers lesson writes
   *  through one road and reads through another, and the shared box itself must
   *  visibly change. */
  setValue(id: string, v: number | string): this {
    const nd = this.nodes.find((x) => x.id === id);
    if (nd) nd.value = v;
    return this;
  }
  nodeState(id: string, s: ElementState): this {
    const nd = this.nodes.find((x) => x.id === id);
    if (nd) nd.state = s;
    return this;
  }
  edge(fromId: string, s: ElementState): this {
    this.edgeState.set(fromId, s);
    return this;
  }
  setVars(v: Record<string, string | number>): this {
    Object.assign(this.vars, v);
    return this;
  }

  step(narration: string, line: Line, op?: StepOp, why?: string): this {
    this.snap(narration, line, op, why);
    return this;
  }

  private snap(narration: string, line: Line, op?: StepOp, why?: string): void {
    const codeLines = Array.isArray(line) ? line : [line];
    const edges: GEdge[] = [];
    for (const [src, tgt] of this.next) {
      if (tgt) {
        edges.push({
          id: `${src}->${tgt}`,
          source: src,
          target: tgt,
          directed: true,
          state: this.edgeState.get(src) ?? "default",
        });
      }
    }
    const scene: ListScene = {
      kind: "list",
      nodes: this.nodes.map((n) => ({ ...n })),
      edges,
      pointers: this.pointers
        .filter((p) => p.id)
        .map((p) => ({ id: `p_${p.label}`, label: p.label, target: p.id as string, color: p.color })),
    };
    this.commit(scene, narration, codeLines, op, { ...this.vars }, why);
    for (const n of this.nodes) if (n.state !== "final") n.state = "default";
    this.edgeState.clear();
  }
}

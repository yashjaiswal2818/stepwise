import type { Frame, GEdge, GNode, TreeScene, StepOp, ElementState } from "@/engine/types";
import { BaseTracer } from "./BaseTracer";

type Line = number | number[];

/** Records a binary-tree algorithm. Tree structure is fixed (built from a
 *  level-order array); a call-stack of Frames tracks the active recursion. */
export class TreeTracer extends BaseTracer {
  private nodes: GNode[] = [];
  private kids = new Map<string, { left?: string; right?: string }>();
  private stack: { id: string; label: string }[] = [];
  private output: (number | string)[] = [];
  private extraVars: Record<string, string | number> = {};

  constructor(level: (number | null)[]) {
    super();
    const id = (i: number) => `t${i}`;
    const exists = (i: number) => i < level.length && level[i] !== null;
    level.forEach((v, i) => {
      if (v !== null) this.nodes.push({ id: id(i), value: v, state: "default" });
    });
    level.forEach((v, i) => {
      if (v === null) return;
      const k: { left?: string; right?: string } = {};
      if (exists(2 * i + 1)) k.left = id(2 * i + 1);
      if (exists(2 * i + 2)) k.right = id(2 * i + 2);
      this.kids.set(id(i), k);
    });
  }

  root(): string | null {
    return this.nodes[0]?.id ?? null;
  }
  leftId(id: string | null): string | null {
    return id ? this.kids.get(id)?.left ?? null : null;
  }
  rightId(id: string | null): string | null {
    return id ? this.kids.get(id)?.right ?? null : null;
  }
  valueOf(id: string): number | string {
    return this.nodes.find((n) => n.id === id)?.value ?? "";
  }
  setVar(k: string, v: number | string): this {
    this.extraVars[k] = v;
    return this;
  }

  enter(id: string, label: string, line: Line, narration?: string, why?: string): this {
    this.setNodeState(id, "active");
    this.stack.push({ id, label });
    this.snap(narration ?? `Recurse into ${this.valueOf(id)}`, line, "recurse", why);
    return this;
  }
  visit(id: string, line: Line, narration?: string, why?: string): this {
    this.setNodeState(id, "visited");
    this.output.push(this.valueOf(id));
    const n = this.nodes.find((x) => x.id === id);
    if (n) n.label = String(this.output.length); // 1-based visit order
    this.snap(narration ?? `Visit ${this.valueOf(id)} → output`, line, "visit", why);
    return this;
  }
  exit(id: string, line: Line, narration?: string, why?: string): this {
    this.stack.pop();
    this.snap(narration ?? `Return from ${this.valueOf(id)}`, line, "return", why);
    return this;
  }
  markDepth(id: string, depth: number, line: Line, narration: string, why?: string): this {
    const n = this.nodes.find((x) => x.id === id);
    if (n) {
      n.state = "visited";
      n.label = String(depth);
    }
    this.snap(narration, line, "mark", why);
    return this;
  }
  note(narration: string, line: Line, op: StepOp = "init", why?: string): this {
    this.snap(narration, line, op, why);
    return this;
  }

  private setNodeState(id: string, s: ElementState): void {
    const n = this.nodes.find((x) => x.id === id);
    if (n) n.state = s;
  }
  private edges(): GEdge[] {
    const es: GEdge[] = [];
    for (const [pid, k] of this.kids) {
      // Carry the side so the layout can offset an only-child: a left-only and a
      // right-only child must not draw as the same straight stick.
      if (k.left) es.push({ id: `${pid}-${k.left}`, source: pid, target: k.left, state: "default", side: "left" });
      if (k.right) es.push({ id: `${pid}-${k.right}`, source: pid, target: k.right, state: "default", side: "right" });
    }
    return es;
  }

  private snap(narration: string, line: Line, op?: StepOp, why?: string): void {
    const codeLines = Array.isArray(line) ? line : [line];
    const callStack: Frame[] = this.stack.map((f, i) => ({
      id: `f${i}`,
      value: String(this.valueOf(f.id)),
      depth: i,
      state: i === this.stack.length - 1 ? "active" : "default",
      label: f.label,
    }));
    const scene: TreeScene = {
      kind: "tree",
      nodes: this.nodes.map((n) => ({ ...n })),
      edges: this.edges(),
      callStack,
    };
    this.commit(
      scene,
      narration,
      codeLines,
      op,
      {
        output: this.output.join(" ") || "—",
        ...this.extraVars,
      },
      why,
    );
  }
}

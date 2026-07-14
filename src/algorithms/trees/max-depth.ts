import type { Trace, AltSource } from "@/engine/types";
import { TreeTracer } from "../authoring/TreeTracer";

export const SOURCE = `function maxDepth(node) {
  if (!node) return 0;
  const left = maxDepth(node.left);
  const right = maxDepth(node.right);
  return 1 + Math.max(left, right);
}`;

const PY: AltSource = {
  code: `def max_depth(node):
    if not node:
        return 0
    left = max_depth(node.left)
    right = max_depth(node.right)
    return 1 + max(left, right)`,
  map: { 1: 1, 5: 6 },
};

const C: AltSource = {
  code: `int maxDepth(Node* node) {
    if (!node) return 0;
    int left = maxDepth(node->left);
    int right = maxDepth(node->right);
    return 1 + (left > right ? left : right);
}`,
  map: { 1: 1, 5: 5 },
};

const TREES: Record<string, (number | null)[]> = {
  default: [3, 9, 20, null, null, 15, 7],
  full: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  skewed: [1, 2, null, 3, null, null, null, 4],
};

export function maxDepthTrace(_values: number[], datasetId = "default"): Trace {
  const t = new TreeTracer(TREES[datasetId] ?? TREES.default);
  let best = 0;
  t.note("Maximum Depth — a node's depth is 1 plus the deeper of its two subtrees. Watch the call stack unwind.", 1, "init");

  const depth = (id: string | null): number => {
    if (!id) return 0;
    t.enter(id, "maxDepth", 1);
    const l = depth(t.leftId(id));
    const r = depth(t.rightId(id));
    const d = 1 + Math.max(l, r);
    best = Math.max(best, d);
    t.setVar("maxDepth", best);
    t.markDepth(id, d, 5, `depth(${t.valueOf(id)}) = 1 + max(${l}, ${r}) = ${d}`);
    t.exit(id, 5);
    return d;
  };
  depth(t.root());

  return t.build({
    exampleId: "max-depth",
    title: "Maximum Depth",
    code: SOURCE,
    language: "ts",
    sources: { py: PY, c: C },
    datasetId,
    legend: ["active", "visited"],
  });
}

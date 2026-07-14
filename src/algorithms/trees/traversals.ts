import type { Trace, AltSource } from "@/engine/types";
import { TreeTracer } from "../authoring/TreeTracer";

/** A balanced tree:            4
 *                            /   \
 *                           2     6
 *                          / \   / \
 *                         1   3 5   7   */
const TREE: (number | null)[] = [4, 2, 6, 1, 3, 5, 7];

interface OrderDef {
  label: string;
  js: string;
  py: AltSource;
  c: AltSource;
  visit: number; // js visit line
  place: "pre" | "in" | "post";
}

const rec = (name: string, order: "pre" | "in" | "post"): OrderDef => {
  const body = {
    pre: ["output.push(node.val);", "traverse(node.left);", "traverse(node.right);"],
    in: ["traverse(node.left);", "output.push(node.val);", "traverse(node.right);"],
    post: ["traverse(node.left);", "traverse(node.right);", "output.push(node.val);"],
  }[order];
  const pyBody = {
    pre: ["output.append(node.val)", "traverse(node.left)", "traverse(node.right)"],
    in: ["traverse(node.left)", "output.append(node.val)", "traverse(node.right)"],
    post: ["traverse(node.left)", "traverse(node.right)", "output.append(node.val)"],
  }[order];
  const cBody = {
    pre: ['printf("%d ", node->val);', "traverse(node->left);", "traverse(node->right);"],
    in: ["traverse(node->left);", 'printf("%d ", node->val);', "traverse(node->right);"],
    post: ["traverse(node->left);", "traverse(node->right);", 'printf("%d ", node->val);'],
  }[order];
  const visitOffset = order === "pre" ? 0 : order === "in" ? 1 : 2;
  const jsVisit = 3 + visitOffset;
  const pyVisit = 4 + visitOffset;
  const cVisit = 3 + visitOffset;
  return {
    label: name,
    js: `function traverse(node) {\n  if (!node) return;\n  ${body[0]}\n  ${body[1]}\n  ${body[2]}\n}`,
    py: {
      code: `def traverse(node):\n    if not node:\n        return\n    ${pyBody[0]}\n    ${pyBody[1]}\n    ${pyBody[2]}`,
      map: { 1: 1, [jsVisit]: pyVisit },
    },
    c: {
      code: `void traverse(Node* node) {\n    if (!node) return;\n    ${cBody[0]}\n    ${cBody[1]}\n    ${cBody[2]}\n}`,
      map: { 1: 1, [jsVisit]: cVisit },
    },
    visit: jsVisit,
    place: order,
  };
};

const LEVEL: { js: string; py: AltSource; c: AltSource } = {
  js: `function levelOrder(root) {
  const queue = [root];
  while (queue.length) {
    const node = queue.shift();
    output.push(node.val);
    if (node.left) queue.push(node.left);
    if (node.right) queue.push(node.right);
  }
}`,
  py: {
    code: `def level_order(root):
    queue = [root]
    while queue:
        node = queue.pop(0)
        output.append(node.val)
        if node.left: queue.append(node.left)
        if node.right: queue.append(node.right)`,
    map: { 2: 2, 5: 5 },
  },
  c: {
    code: `void levelOrder(Node* root) {
    Node* q[64]; int f = 0, b = 0;
    q[b++] = root;
    while (f < b) {
        Node* node = q[f++];
        printf("%d ", node->val);
        if (node->left) q[b++] = node->left;
        if (node->right) q[b++] = node->right;
    }
}`,
    map: { 2: 3, 5: 6 },
  },
};

const ORDERS: Record<string, OrderDef> = {
  inorder: rec("Inorder", "in"),
  preorder: rec("Preorder", "pre"),
  postorder: rec("Postorder", "post"),
};

export function traversalTrace(_values: number[], order = "inorder"): Trace {
  const t = new TreeTracer(TREE);

  if (order === "level") {
    t.note("Level-order (BFS) — visit the tree level by level using a queue.", 2, "init");
    const queue: (string | null)[] = [t.root()];
    while (queue.length) {
      const id = queue.shift();
      if (!id) continue;
      t.visit(id, 5);
      const l = t.leftId(id);
      const r = t.rightId(id);
      if (l) queue.push(l);
      if (r) queue.push(r);
    }
    return t.build({
      exampleId: "binary-tree-traversal",
      title: "Binary Tree Traversal",
      code: LEVEL.js,
      language: "ts",
      sources: { py: LEVEL.py, c: LEVEL.c },
      datasetId: order,
      legend: ["active", "visited"],
    });
  }

  const def = ORDERS[order] ?? ORDERS.inorder;
  const where = def.place === "pre" ? "before" : def.place === "post" ? "after" : "between";
  t.note(`${def.label} traversal — visit each node ${where} its children (recursion tracked on the call stack).`, 1, "init");

  const go = (id: string | null) => {
    if (!id) return;
    t.enter(id, def.place, 1);
    if (def.place === "pre") t.visit(id, def.visit);
    go(t.leftId(id));
    if (def.place === "in") t.visit(id, def.visit);
    go(t.rightId(id));
    if (def.place === "post") t.visit(id, def.visit);
    t.exit(id, 1);
  };
  go(t.root());

  return t.build({
    exampleId: "binary-tree-traversal",
    title: "Binary Tree Traversal",
    code: def.js,
    language: "ts",
    sources: { py: def.py, c: def.c },
    datasetId: order,
    legend: ["active", "visited"],
  });
}

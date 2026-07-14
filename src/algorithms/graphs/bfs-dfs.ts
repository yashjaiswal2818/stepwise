import type { Trace, AltSource } from "@/engine/types";
import { GraphTracer, type NodeSpec } from "../authoring/GraphTracer";

const NODES: NodeSpec[] = [
  { id: "n0", value: 0, x: 140, y: 30 },
  { id: "n1", value: 1, x: 66, y: 110 },
  { id: "n2", value: 2, x: 214, y: 110 },
  { id: "n3", value: 3, x: 28, y: 194 },
  { id: "n4", value: 4, x: 110, y: 194 },
  { id: "n5", value: 5, x: 190, y: 194 },
  { id: "n6", value: 6, x: 262, y: 194 },
  { id: "n7", value: 7, x: 150, y: 270 },
];
const EDGES: [string, string][] = [
  ["n0", "n1"],
  ["n0", "n2"],
  ["n1", "n3"],
  ["n1", "n4"],
  ["n2", "n5"],
  ["n2", "n6"],
  ["n4", "n5"],
  ["n4", "n7"],
  ["n5", "n7"],
];

const BFS = {
  js: `function bfs(start) {
  const queue = [start];
  const seen = new Set([start]);
  while (queue.length) {
    const node = queue.shift();
    visit(node);
    for (const nb of neighbors(node)) {
      if (!seen.has(nb)) {
        seen.add(nb);
        queue.push(nb);
      }
    }
  }
}`,
  py: {
    code: `def bfs(start):
    queue = deque([start])
    seen = {start}
    while queue:
        node = queue.popleft()
        visit(node)
        for nb in neighbors(node):
            if nb not in seen:
                seen.add(nb)
                queue.append(nb)`,
    map: { 3: 3, 6: 6, 10: 10 },
  } as AltSource,
  c: {
    code: `void bfs(int start) {
    int queue[64], head = 0, tail = 0;
    queue[tail++] = start;
    bool seen[64] = {0}; seen[start] = 1;
    while (head < tail) {
        int node = queue[head++];
        visit(node);
        for (int nb : neighbors(node))
            if (!seen[nb]) {
                seen[nb] = 1;
                queue[tail++] = nb;
            }
    }
}`,
    map: { 3: 4, 6: 7, 10: 11 },
  } as AltSource,
  init: 3,
  visit: 6,
  enqueue: 10,
};

const DFS = {
  js: `function dfs(node, seen) {
  seen.add(node);
  visit(node);
  for (const nb of neighbors(node)) {
    if (!seen.has(nb)) {
      dfs(nb, seen);
    }
  }
}`,
  py: {
    code: `def dfs(node, seen):
    seen.add(node)
    visit(node)
    for nb in neighbors(node):
        if nb not in seen:
            dfs(nb, seen)`,
    map: { 3: 3, 6: 6 },
  } as AltSource,
  c: {
    code: `void dfs(int node, bool* seen) {
    seen[node] = 1;
    visit(node);
    for (int nb : neighbors(node))
        if (!seen[nb])
            dfs(nb, seen);
}`,
    map: { 3: 3, 6: 6 },
  } as AltSource,
  visit: 3,
  recurse: 6,
};

export function bfsDfsTrace(_values: number[], mode = "bfs"): Trace {
  const t = new GraphTracer(NODES, EDGES);
  const start = "n0";
  const output: (number | string)[] = [];

  if (mode === "dfs") {
    t.setLabel("stack");
    t.step("DFS from 0 — recursion (a stack) plunges deep, then backtracks.", DFS.visit, "init");
    const seen = new Set<string>();
    const stack: string[] = [];
    const go = (id: string) => {
      seen.add(id);
      stack.push(id);
      t.nodeState(id, "visited");
      output.push(t.valueOf(id));
      t.setFrontier(stack, "active").setVar("visited", output.join(" "));
      t.step(`Visit ${t.valueOf(id)}`, DFS.visit, "visit");
      for (const nb of t.neighbors(id)) {
        if (!seen.has(nb)) {
          t.edgeState(id, nb, "path");
          go(nb);
        }
      }
      stack.pop();
      t.setFrontier(stack, "active");
      t.step(`Backtrack from ${t.valueOf(id)}`, DFS.recurse, "return");
    };
    go(start);
    return t.build({
      exampleId: "bfs-dfs",
      title: "Graph Traversal",
      code: DFS.js,
      language: "ts",
      sources: { py: DFS.py, c: DFS.c },
      datasetId: mode,
      legend: ["active", "visited", "path"],
    });
  }

  // BFS
  t.setLabel("queue");
  t.step("BFS from 0 — a queue sweeps the graph outward, level by level.", BFS.init, "init");
  const queue: string[] = [start];
  const seen = new Set<string>([start]);
  t.nodeState(start, "frontier").setFrontier(queue, "frontier");
  while (queue.length) {
    const id = queue.shift()!;
    t.nodeState(id, "visited");
    output.push(t.valueOf(id));
    const added: string[] = [];
    for (const nb of t.neighbors(id)) {
      if (!seen.has(nb)) {
        seen.add(nb);
        queue.push(nb);
        t.nodeState(nb, "frontier");
        t.edgeState(id, nb, "path");
        added.push(nb);
      }
    }
    t.setFrontier(queue, "frontier").setVar("visited", output.join(" "));
    t.step(
      `Visit ${t.valueOf(id)}${added.length ? `, enqueue ${added.map((a) => t.valueOf(a)).join(", ")}` : ""}`,
      BFS.visit,
      "visit",
    );
  }

  return t.build({
    exampleId: "bfs-dfs",
    title: "Graph Traversal",
    code: BFS.js,
    language: "ts",
    sources: { py: BFS.py, c: BFS.c },
    datasetId: mode,
    legend: ["frontier", "visited", "path"],
  });
}

import type { Trace, AltSource } from "@/engine/types";
import { GridTracer } from "../authoring/GridTracer";

export const SOURCE = `function dijkstra(grid, start, target) {
  const dist = filled(Infinity);
  dist[start] = 0;
  const pq = [[0, start]];
  while (pq.length) {
    pq.sort((a, b) => a[0] - b[0]);
    const [d, u] = pq.shift();
    if (seen[u]) continue;
    seen[u] = true;
    if (u === target) break;
    for (const v of neighbors(u)) {
      const nd = d + weight(v);
      if (nd < dist[v]) {
        dist[v] = nd;
        pq.push([nd, v]);
      }
    }
  }
  return dist[target];
}`;

const PY: AltSource = {
  code: `import heapq

def dijkstra(grid, start, target):
    dist = {start: 0}
    pq = [(0, start)]
    while pq:
        d, u = heapq.heappop(pq)
        if u in seen: continue
        seen.add(u)
        if u == target: break
        for v in neighbors(u):
            nd = d + weight(v)
            if nd < dist.get(v, INF):
                dist[v] = nd
                heapq.heappush(pq, (nd, v))
    return dist[target]`,
  map: { 2: 4, 9: 8, 19: 15 },
};

const C: AltSource = {
  code: `int dijkstra(int grid[R][C], int start, int target) {
    int dist[R * C]; fill(dist, INF);
    dist[start] = 0;
    PQ pq; push(pq, 0, start);
    while (!empty(pq)) {
        Node u = popMin(pq);
        if (seen[u.id]) continue;
        seen[u.id] = 1;
        if (u.id == target) break;
        for (Node v : neighbors(u)) {
            int nd = u.d + weight(v);
            if (nd < dist[v]) {
                dist[v] = nd;
                push(pq, nd, v);
            }
        }
    }
    return dist[target];
}`,
  map: { 2: 2, 9: 8, 19: 18 },
};

const L = { init: 2, visit: 9, relax: 14, ret: 19 } as const;

interface MapDef {
  weights: number[][]; // 0 = wall, else cost to enter
  start: [number, number];
  target: [number, number];
}

// 3 = costly terrain (mud), 1 = normal, 0 = wall
const MAPS: Record<string, MapDef> = {
  default: {
    weights: [
      [1, 1, 1, 0, 1, 1],
      [1, 3, 1, 0, 1, 3],
      [1, 3, 1, 1, 1, 1],
      [1, 1, 1, 3, 3, 1],
      [1, 1, 3, 1, 1, 1],
    ],
    start: [0, 0],
    target: [4, 5],
  },
  terrain: {
    weights: [
      [1, 1, 3, 3, 3, 1],
      [1, 1, 3, 1, 1, 1],
      [1, 1, 1, 1, 3, 3],
      [3, 3, 3, 1, 3, 1],
      [1, 1, 1, 1, 1, 1],
    ],
    start: [0, 0],
    target: [4, 5],
  },
};

export function dijkstraTrace(_values: number[], datasetId = "default"): Trace {
  const map = MAPS[datasetId] ?? MAPS.default;
  const W = map.weights;
  const rows = W.length;
  const cols = W[0].length;
  const t = new GridTracer(rows, cols);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (W[r][c] === 0) t.setPassable(r, c, false);
      else if (W[r][c] > 1) t.cell(r, c).weight = W[r][c];
    }
  }

  const dist: number[][] = Array.from({ length: rows }, () => Array(cols).fill(Infinity));
  const prev: ([number, number] | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null));
  const seen: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));

  const [sr, sc] = map.start;
  const [tr, tc] = map.target;
  dist[sr][sc] = 0;
  t.setValue(sr, sc, 0).setState(sr, sc, "frontier").setValue(tr, tc, "◎");
  t.step("Dijkstra — grow a frontier by cheapest total cost. Amber terrain costs more to cross.", L.init, "init");

  const pq: [number, number, number][] = [[0, sr, sc]];
  const DIRS = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

  while (pq.length) {
    pq.sort((a, b) => a[0] - b[0]);
    const [d, ur, uc] = pq.shift()!;
    if (seen[ur][uc]) continue;
    seen[ur][uc] = true;
    t.setState(ur, uc, "visited");
    t.setVar("visiting", `(${ur},${uc}) cost=${d}`);

    if (ur === tr && uc === tc) {
      t.step(`Reached the target at total cost ${d}!`, L.visit, "visit");
      break;
    }

    for (const [dr, dc] of DIRS) {
      const nr = ur + dr;
      const nc = uc + dc;
      if (!t.inBounds(nr, nc) || t.cell(nr, nc).passable === false || seen[nr][nc]) continue;
      const nd = d + (W[nr][nc] || 1);
      if (nd < dist[nr][nc]) {
        dist[nr][nc] = nd;
        prev[nr][nc] = [ur, uc];
        pq.push([nd, nr, nc]);
        t.setValue(nr, nc, nd).setState(nr, nc, "frontier");
      }
    }
    t.step(`Finalize (${ur},${uc}) at cost ${d}; relax its neighbors by entry cost.`, L.visit, "visit");
  }

  let cur: [number, number] | null = [tr, tc];
  const path: [number, number][] = [];
  while (cur) {
    path.push(cur);
    cur = prev[cur[0]][cur[1]];
  }
  path.reverse();
  for (const [pr, pc] of path) {
    t.setState(pr, pc, "path");
    t.step(`Trace the cheapest path back through (${pr},${pc}).`, L.ret, "mark");
  }
  t.setVar("total cost", dist[tr][tc]);
  t.step(`Cheapest path found — total cost ${dist[tr][tc]}.`, L.ret, "done");

  return t.build({
    exampleId: "dijkstra",
    title: "Dijkstra's Shortest Path",
    code: SOURCE,
    language: "ts",
    sources: { py: PY, c: C },
    datasetId,
    legend: ["frontier", "visited", "path"],
  });
}

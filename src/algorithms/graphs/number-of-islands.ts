import type { Trace, AltSource, ElementState } from "@/engine/types";
import { GridTracer } from "../authoring/GridTracer";

export const SOURCE = `function numIslands(grid) {
  let count = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 1) {
        count++;
        flood(grid, r, c);
      }
    }
  }
  return count;
}

function flood(grid, r, c) {
  if (!inBounds(r, c) || grid[r][c] === 0) return;
  grid[r][c] = 0;
  flood(r + 1, c); flood(r - 1, c);
  flood(r, c + 1); flood(r, c - 1);
}`;

const PY: AltSource = {
  code: `def num_islands(grid):
    count = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 1:
                count += 1
                flood(grid, r, c)
    return count

def flood(grid, r, c):
    if not in_bounds(r, c) or grid[r][c] == 0:
        return
    grid[r][c] = 0
    flood(r + 1, c); flood(r - 1, c)
    flood(r, c + 1); flood(r, c - 1)`,
  map: { 2: 2, 6: 6, 11: 8, 16: 13 },
};

const C: AltSource = {
  code: `int numIslands(int grid[R][C]) {
    int count = 0;
    for (int r = 0; r < R; r++)
        for (int c = 0; c < C; c++)
            if (grid[r][c] == 1) {
                count++;
                flood(grid, r, c);
            }
    return count;
}

void flood(int grid[R][C], int r, int c) {
    if (!inBounds(r, c) || grid[r][c] == 0) return;
    grid[r][c] = 0;
    flood(r + 1, c); flood(r - 1, c);
    flood(r, c + 1); flood(r, c - 1);
}`,
  map: { 2: 2, 6: 6, 11: 8, 16: 13 },
};

const L = { init: 2, newIsland: 6, flood: 16, ret: 11 } as const;

const GRIDS: Record<string, number[][]> = {
  default: [
    [1, 1, 0, 0, 0],
    [1, 1, 0, 1, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 0, 1, 1],
  ],
  scattered: [
    [1, 0, 1, 1, 0],
    [0, 0, 0, 1, 1],
    [1, 1, 0, 0, 0],
    [0, 1, 0, 1, 0],
    [1, 0, 0, 1, 1],
  ],
};

const ISLAND_STATES: ElementState[] = ["visited", "path", "frontier", "final", "compare", "swap"];

export function numberOfIslandsTrace(_values: number[], datasetId = "default"): Trace {
  const GRID = GRIDS[datasetId] ?? GRIDS.default;
  const rows = GRID.length;
  const cols = GRID[0].length;
  const t = new GridTracer(rows, cols);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (GRID[r][c] === 0) t.setPassable(r, c, false);
  t.step("Number of Islands — scan the grid; each new patch of land is flood-filled and counted.", L.init, "init");

  let count = 0;
  const flood = (r: number, c: number, color: ElementState) => {
    if (!t.inBounds(r, c)) return;
    const cell = t.cell(r, c);
    if (cell.passable === false || cell.state !== "default") return; // water, or already sunk
    t.setState(r, c, color);
    t.step(`Flood land at (${r}, ${c})`, L.flood, "visit");
    flood(r + 1, c, color);
    flood(r - 1, c, color);
    flood(r, c + 1, color);
    flood(r, c - 1, color);
  };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (t.cell(r, c).passable !== false && t.cell(r, c).state === "default") {
        count++;
        const color = ISLAND_STATES[(count - 1) % ISLAND_STATES.length];
        t.setVar("islands", count);
        t.step(`New land at (${r}, ${c}) — island #${count}!`, L.newIsland, "mark");
        flood(r, c, color);
      }
    }
  }

  t.setVar("islands", count);
  t.step(`All land explored — there are ${count} islands.`, L.ret, "done");

  return t.build({
    exampleId: "number-of-islands",
    title: "Number of Islands",
    code: SOURCE,
    language: "ts",
    sources: { py: PY, c: C },
    datasetId,
    legend: ["visited", "path", "frontier", "final"],
  });
}

import type { Cell } from "@/engine/types";

export const ARRAY_GEOM = {
  padX: 26,
  cellW: 54,
  cellH: 54,
  gap: 12,
  topSpace: 40, // room for pointer chips above
  bottomSpace: 24, // room for index ticks below
};

export interface ArrayLayout {
  /** id -> top-left corner of the cell. */
  pos: Record<string, { x: number; y: number }>;
  /** center x for each slot index (stable regardless of which element is there). */
  slotCenterX: number[];
  cellW: number;
  cellH: number;
  cellY: number;
  viewW: number;
  viewH: number;
}

/**
 * Pure layout: x is a function of an element's `index` (its slot), never of its
 * state. A swap changes the element's index → its x target changes → it slides.
 */
export function arrayLayout(cells: Cell[]): ArrayLayout {
  const g = ARRAY_GEOM;
  const n = cells.length;
  const stride = g.cellW + g.gap;
  const cellY = g.topSpace;
  const viewW = g.padX * 2 + n * g.cellW + (n - 1) * g.gap;
  const viewH = g.topSpace + g.cellH + g.bottomSpace;

  const slotX = (i: number) => g.padX + i * stride;
  const slotCenterX = Array.from({ length: n }, (_, i) => slotX(i) + g.cellW / 2);

  const pos: Record<string, { x: number; y: number }> = {};
  for (const c of cells) pos[c.id] = { x: slotX(c.index), y: cellY };

  return { pos, slotCenterX, cellW: g.cellW, cellH: g.cellH, cellY, viewW, viewH };
}

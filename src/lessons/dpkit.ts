import type { MemoryView, ParseResult } from "../engine/types";
import { toneOf } from "../engine/types";
import type { BlockState } from "../iso/IsoBlock";
import type { Cell, RowPointer } from "../iso/CellRow";
import type { GridPointer } from "../iso/GridTable";
import type { Tile, TilePointer } from "../iso/TreeNodes";

export type Grid = Cell[][];

/** A labelled strip under the table: a call stack, the coins used, the items chosen. */
export interface DPStrip { name: string; cells: Tile[]; labels?: string[]; slots?: number; ptrs?: TilePointer[] }

/** What every DP scene draws: a 1D row or a 2D grid, flags on its cells, and an optional strip under it. */
export type DPState =
  | { kind: "row"; cells: Cell[]; /** Index tags; defaults to [0], [1], ... */ labels?: (i: number) => string; name?: string; ptrs?: RowPointer[]; strip?: DPStrip }
  | { kind: "grid"; grid: Grid; rowHead: string[]; colHead: string[]; ptrs?: GridPointer[]; strip?: DPStrip };

/** A table of `rows` by `cols` cells, none computed yet (drawn stale). */
export const blankGrid = (rows: number, cols: number): Grid =>
  Array.from({ length: rows }, () => Array.from({ length: cols }, (): Cell => ({ v: null })));

/** A copy of `grid` with the listed [row, col] cells set to `state`. The input is not changed. */
export function paint(grid: Grid, cells: [number, number][], state: BlockState): Grid {
  const out = grid.map((row) => row.map((c) => ({ ...c })));
  for (const [r, c] of cells) if (out[r]?.[c]) out[r][c].state = state;
  return out;
}

/** Each row of the table as one memory cell: `row i: 0 1 1 2`. Uncomputed cells print `_`. */
export function tableMemory(title: string, grid: Grid, rowHead: string[], _colHead: string[], note: string): MemoryView {
  return {
    title, note,
    cells: grid.map((row, i) => {
      const hot = row.filter((c) => c.state === "active" || toneOf(c.state));
      const tone = toneOf(hot.find((c) => toneOf(c.state))?.state);
      return {
        v: row.map((c) => (c.v === null ? "_" : c.v)).join(" "),
        tag: `row ${rowHead[i] ?? i}`,
        live: row.some((c) => c.v !== null),
        act: hot.length > 0, tone, marks: []
      };
    })
  };
}

/** Parse "3, 1 4": whole numbers in [min, max], at most maxCount of them. */
export function parseInts(text: string, o: { min: number; max: number; maxCount: number }): ParseResult<number[]> {
  const items = text.split(/[\s,;]+/).filter(Boolean);
  if (!items.length) return { ok: false, error: `Type at least one whole number from ${o.min} to ${o.max}, like "${o.min}, ${o.max}".` };
  const out: number[] = [];
  for (const it of items) {
    if (!/^-?\d+$/.test(it)) return { ok: false, error: `Could not read "${it}". Use whole numbers separated by commas.` };
    const n = Number(it);
    if (n < o.min || n > o.max) return { ok: false, error: `${n} is out of range. Use whole numbers from ${o.min} to ${o.max}.` };
    out.push(n);
  }
  if (out.length > o.maxCount) return { ok: false, error: `Keep it to ${o.maxCount} numbers or fewer so the steps stay readable.` };
  return { ok: true, input: out };
}

/** Parse "ABCD, BDC": exactly `count` words of letters, each at most maxLen long. Letters are upper-cased. */
export function parseWords(text: string, o: { maxLen: number; count: number }): ParseResult<string[]> {
  const items = text.split(/[\s,;]+/).filter(Boolean);
  if (items.length !== o.count) return { ok: false, error: `Type exactly ${o.count} word${o.count === 1 ? "" : "s"} separated by a comma, like "ABCD, BDC".` };
  for (const w of items) {
    if (!/^[A-Za-z]+$/.test(w)) return { ok: false, error: `"${w}" has characters other than letters. Use letters only.` };
    if (w.length > o.maxLen) return { ok: false, error: `"${w}" is ${w.length} letters long. Keep each word to ${o.maxLen} letters or fewer so the table fits.` };
  }
  return { ok: true, input: items.map((w) => w.toUpperCase()) };
}

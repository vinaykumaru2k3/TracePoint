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

/** What a memory table prints for a cell that holds an empty string (a covered plate). */
export const BLANK = "#";
/** What it prints for a cell not computed yet. */
export const UNSET = "_";

/**
 * The table as a memory strip: one row per table row, one line of text per row, each column padded
 * to a fixed width so the columns line up (the strip draws it in a monospaced, no-wrap box).
 * `head` names the columns from `colHead`. An empty string prints BLANK and a null cell prints UNSET,
 * so neither can vanish into a run of spaces.
 */
export function tableMemory(title: string, grid: Grid, rowHead: string[], colHead: string[], note: string): MemoryView {
  const text = (c: Cell) => (c.v === null ? UNSET : c.v === "" ? BLANK : String(c.v));
  const cols = Math.max(colHead.length, ...grid.map((r) => r.length));
  const widths = Array.from({ length: cols }, (_, j) =>
    Math.max((colHead[j] ?? "").length, ...grid.map((r) => (r[j] ? text(r[j]).length : 0))));
  const line = (parts: string[]) => parts.map((t, j) => t.padEnd(widths[j])).join(" ").trimEnd();
  return {
    title, note, layout: "table",
    head: line(Array.from({ length: cols }, (_, j) => colHead[j] ?? "")),
    cells: grid.map((row, i) => {
      const hot = row.filter((c) => c.state === "active" || toneOf(c.state));
      const tone = toneOf(hot.find((c) => toneOf(c.state))?.state);
      return {
        v: line(row.map(text)),
        tag: `row ${rowHead[i] ?? i}`,
        live: row.some((c) => c.v !== null),
        act: hot.length > 0, tone, marks: []
      };
    })
  };
}

/** The example the empty-input error offers: always something the same field accepts. */
const intsExample = (o: IntsOpts) => o.example ?? (o.maxCount === 1 ? `${o.min}` : `${o.min}, ${o.max}`);

export interface IntsOpts { min: number; max: number; maxCount: number; /** Text to suggest when the field is empty; must itself parse. Defaults to min (one number) or "min, max". */ example?: string }

/** Parse "3, 1 4": whole numbers in [min, max], at most maxCount of them. */
export function parseInts(text: string, o: IntsOpts): ParseResult<number[]> {
  const items = text.split(/[\s,;]+/).filter(Boolean);
  const one = o.maxCount === 1;
  if (!items.length) return { ok: false, error: one ? `Type a whole number from ${o.min} to ${o.max}, like "${intsExample(o)}".` : `Type at least one whole number from ${o.min} to ${o.max}, like "${intsExample(o)}".` };
  const out: number[] = [];
  for (const it of items) {
    if (!/^-?\d+$/.test(it)) return { ok: false, error: one ? `Could not read "${it}". Use a whole number.` : `Could not read "${it}". Use whole numbers separated by commas.` };
    const n = Number(it);
    if (n < o.min || n > o.max) return { ok: false, error: one ? `${n} is out of range. Use a whole number from ${o.min} to ${o.max}.` : `${n} is out of range. Use whole numbers from ${o.min} to ${o.max}.` };
    out.push(n);
  }
  if (out.length > o.maxCount) return { ok: false, error: one ? "Type just one number." : `Keep it to ${o.maxCount} numbers or fewer so the steps stay readable.` };
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

import { IsoPlate } from "./IsoBlock";
import IsoPointer from "./IsoPointer";
import { CELL_STEP, type Cell } from "./CellRow";
import { poly, project } from "./project";

export interface GridPointer { r: number; c: number; label: string; dim?: boolean }

interface Props {
  grid: Cell[][];
  /** One label per row, printed left of column 0. */
  rowHead: string[];
  /** One label per column, printed above row 0. */
  colHead: string[];
  pointers?: GridPointer[];
  step?: number;
}

/** A 2D DP table on the floor: one plate per cell, row r at grid y r*step and column c at grid x c*step, with a header per row and per column. */
export default function GridTable({ grid, rowHead, colHead, pointers = [], step = CELL_STEP }: Props) {
  const rows = grid.length, cols = Math.max(0, ...grid.map((r) => r.length));
  const right = (cols - 1) * step + 2, bottom = (rows - 1) * step + 2;
  const pad = 0.4;
  const foot = poly([project(-pad, -pad, 0), project(right + pad, -pad, 0), project(right + pad, bottom + pad, 0), project(-pad, bottom + pad, 0)]);
  const merged = new Map<string, GridPointer>();
  for (const p of pointers) {
    const k = `${p.r},${p.c}`, had = merged.get(k);
    merged.set(k, had ? { ...p, label: `${had.label} · ${p.label}`, dim: had.dim && p.dim } : p);
  }
  return (
    <g>
      <polygon className="foot" points={foot} />
      {grid.map((row, r) => row.map((cell, c) => (
        <IsoPlate key={`${r},${c}`} x={c * step} y={r * step} w={2} d={2} state={cell.v === null ? "stale" : cell.state ?? "default"} label={cell.v ?? ""} />
      )))}
      {colHead.slice(0, cols).map((t, c) => {
        const p = project(c * step + 1, -0.7, 0);
        return <text key={`c${c}`} className="plate-index" x={p.x} y={p.y} textAnchor="middle">{t}</text>;
      })}
      {rowHead.slice(0, rows).map((t, r) => {
        const p = project(-0.7, r * step + 1, 0);
        return <text key={`r${r}`} className="plate-index" x={p.x} y={p.y} textAnchor="end" dominantBaseline="central">{t}</text>;
      })}
      {[...merged.values()].map((p) => (
        <IsoPointer key={`${p.r},${p.c}`} x={p.c * step + 1} y={p.r * step + 1} z={grid[p.r]?.[p.c]?.v != null ? 8 : 0} label={p.label} dim={p.dim} />
      ))}
    </g>
  );
}

/** Grid points that frame a `rows` by `cols` table with room for headers and flags, for fitBox(). */
export function gridFrame(rows: number, cols: number, step = CELL_STEP): [number, number, number][] {
  const right = (cols - 1) * step + 2, bottom = (rows - 1) * step + 2;
  return [[-2.4, -1.2, 0], [right, -1.6, 60], [right + 0.4, bottom + 0.4, -24], [-2.4, bottom + 0.4, -24]];
}

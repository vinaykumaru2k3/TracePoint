import IsoScene from "../iso/IsoScene";
import CellRow, { CELL_H, CELL_STEP, rowFrame } from "../iso/CellRow";
import GridTable, { gridFrame } from "../iso/GridTable";
import { U, fitBox, project } from "../iso/project";
import { Strip, TILE_STEP, stripFrame } from "../iso/TreeNodes";
import type { Step } from "../engine/types";
import type { DPState } from "./dpkit";

/** Where the strip sits: centred under the table, below its front corner. */
export function dpStripAt(s: DPState): { X: number; Y: number } {
  const n = Math.max(s.strip?.slots ?? 0, s.strip?.cells.length ?? 0, 1);
  const [w, d] = s.kind === "row"
    ? [(Math.max(s.cells.length, 1) - 1) * CELL_STEP + 2, 2]
    : [(Math.max(1, ...s.grid.map((r) => r.length)) - 1) * CELL_STEP + 2, (Math.max(s.grid.length, 1) - 1) * CELL_STEP + 2];
  const front = project(w, d, 0);
  return { X: ((w - d) / 2) * U - ((n - 1) * TILE_STEP) / 2, Y: front.y + 90 };
}

/** A DP table on the floor, 1D as a row of cells or 2D as a grid, with an optional strip of tiles under it. */
export default function DPScene({ step }: { step: Step<DPState> }) {
  const s = step.state;
  const { X, Y } = dpStripAt(s);
  const n = Math.max(s.strip?.slots ?? 0, s.strip?.cells.length ?? 0, 1);
  const table = s.kind === "row" ? rowFrame(s.cells.length) : gridFrame(s.grid.length, s.grid[0]?.length ?? 0);
  const points = [...table, ...(s.strip ? stripFrame(n, X, Y, s.strip.name.length) : [])];
  const label = s.kind === "row"
    ? `Table of ${s.cells.length} cells: ${s.cells.map((c) => c.v ?? "empty").join(", ")}`
    : `Table of ${s.grid.length} rows by ${s.grid[0]?.length ?? 0} columns`;
  const strip = s.strip ? `. ${s.strip.name}: ${s.strip.cells.map((t) => t.v ?? "empty").join(", ") || "empty"}` : "";
  return (
    <IsoScene viewBox={fitBox(points, 16)} label={label + strip}>
      {s.kind === "row"
        ? <CellRow cells={s.cells} h={CELL_H} index={s.labels ?? true} name={s.name} pointers={s.ptrs} />
        : <GridTable grid={s.grid} rowHead={s.rowHead} colHead={s.colHead} pointers={s.ptrs} />}
      {s.strip && <Strip tiles={s.strip.cells} X={X} Y={Y} slots={s.strip.slots} name={s.strip.name} labels={s.strip.labels} pointers={s.strip.ptrs} index={!!s.strip.labels} />}
    </IsoScene>
  );
}

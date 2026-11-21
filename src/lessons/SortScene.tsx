import CellRow, { CELL_STEP, rowFrame, type Cell } from "../iso/CellRow";
import IsoScene from "../iso/IsoScene";
import { fitBox } from "../iso/project";
import type { Step } from "../engine/types";
import type { SortState } from "./sortkit";

/** How far below the array the aux row sits, in grid units. */
export const AUX_Y = 6.4;

/** The array as a row; done cells are green and marks override. An optional aux row sits underneath. */
export default function SortScene({ step }: { step: Step<SortState> }) {
  const { a, marks, done, ptrs, aux, auxName, auxIndexFrom, auxAt = 0, auxPtrs = [] } = step.state;
  const cells: Cell[] = a.map((v, k) => ({ v, state: marks[k] ?? (done.includes(k) ? "found" : "default") }));
  const auxCells: Cell[] = (aux ?? []).map((v) => ({ v: v ?? "", state: "default" }));
  const x0 = auxAt * CELL_STEP;
  const points = [...rowFrame(a.length), ...(aux ? rowFrame(aux.length, AUX_Y, CELL_STEP, x0) : [])];
  return (
    <IsoScene viewBox={fitBox(points, 16)} label={`Array ${a.map((v) => v ?? "empty").join(", ")}${aux ? `, ${auxName ?? "aux"} ${aux.map((v) => v ?? "empty").join(", ")}` : ""}`}>
      <CellRow cells={cells} pointers={ptrs} name="a" />
      {aux && (
        <CellRow
          cells={auxCells} y={AUX_Y} x0={x0} pointers={auxPtrs} name={auxName}
          index={auxIndexFrom === undefined ? false : (i) => `[${i + auxIndexFrom}]`}
        />
      )}
    </IsoScene>
  );
}

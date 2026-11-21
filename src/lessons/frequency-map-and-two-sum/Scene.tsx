import CellRow, { CELL_STEP, rowFrame, type Cell, type RowPointer } from "../../iso/CellRow";
import type { BlockState } from "../../iso/IsoBlock";
import IsoScene from "../../iso/IsoScene";
import { fitBox } from "../../iso/project";
import type { Step } from "../../engine/types";
import { FM_MAX, type FmState } from "./generate";

const MAP_Y = 4;
const VIEW = fitBox([...rowFrame(FM_MAX), ...rowFrame(FM_MAX, MAP_Y)], 20);

/** The array on the back row, and the phase's hash map in front: values on the slabs, keys underneath. */
export default function Scene({ step }: { step: Step<FmState> }) {
  const s = step.state;
  const cells: Cell[] = s.nums.map((v, i) => {
    let state: BlockState = "default";
    if (s.pair && (i === s.pair[0] || i === s.pair[1])) state = "found";
    else if (i === s.i) state = "active";
    else if (s.i !== null && i < s.i) state = "visited";
    return { v, state };
  });
  const pointers: RowPointer[] = s.i !== null ? [{ at: s.i, label: s.need !== null ? `need ${s.need}` : "x" }] : [];
  const map = s.phase === "two" ? s.seen : s.count;
  const mapCells: Cell[] = map.map(([key, val]) => ({
    v: val, state: key === s.key ? (s.pair ? "found" : "active") : "default"
  }));
  return (
    <IsoScene viewBox={VIEW} label={`Array of ${s.nums.length} values with a ${s.phase === "two" ? "seen" : "count"} map of ${map.length} keys`}>
      <CellRow cells={cells} pointers={pointers} name="nums" />
      <CellRow cells={mapCells} y={MAP_Y} slots={FM_MAX} index={(i) => `key ${map[i][0]}`} name={s.phase === "two" ? "seen" : "count"} step={CELL_STEP} />
    </IsoScene>
  );
}

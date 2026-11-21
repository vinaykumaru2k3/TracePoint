import CellRow, { rowFrame, type Cell, type RowPointer } from "../../iso/CellRow";
import type { BlockState } from "../../iso/IsoBlock";
import IsoScene from "../../iso/IsoScene";
import { fitBox } from "../../iso/project";
import type { Step } from "../../engine/types";
import { SLOTS, TOMB, type OaState } from "./generate";

const VIEW = fitBox(rowFrame(SLOTS), 18);

/** Seven slots in a row. The probe flag walks right and wraps; tombstones stay grey. */
export default function Scene({ step }: { step: Step<OaState> }) {
  const s = step.state;
  const cells: Cell[] = s.slots.map((v, i) => {
    let state: BlockState = v === TOMB ? "stale" : "default";
    if (i === s.tomb) state = "visited";
    if (i === s.probe && !s.mark) state = "compare";
    if (s.mark && i === s.mark.at) state = s.mark.state;
    return { v: v === TOMB ? "×" : v === null ? "" : v, state };
  });
  const pointers: RowPointer[] = [];
  if (s.home !== null) pointers.push({ at: s.home, label: "home", dim: s.probe !== s.home });
  if (s.probe !== null && s.probe !== s.home) pointers.push({ at: s.probe, label: "i" });
  return (
    <IsoScene viewBox={VIEW} label={`Open addressing table, ${s.size} of ${SLOTS} slots used`}>
      <CellRow cells={cells} pointers={pointers} />
    </IsoScene>
  );
}

import CellRow, { rowFrame, type Cell, type RowPointer } from "../../iso/CellRow";
import IsoScene from "../../iso/IsoScene";
import { fitBox } from "../../iso/project";
import type { Step } from "../../engine/types";
import { ARRAY_CAP, type ArrayState } from "./generate";

const VIEW = fitBox(rowFrame(ARRAY_CAP + 1), 16);

export default function Scene({ step }: { step: Step<ArrayState> }) {
  const { data, size, at, from, mode } = step.state;
  const cells: Cell[] = data.map((v, k) => ({
    v,
    state: k === at && mode === "read" ? "found" : k === at && (mode === "write" || mode === "shift") ? "active" : k === from ? "compare" : k >= size ? "stale" : "default"
  }));
  const ptrs: RowPointer[] = [{ at: size, label: "size", dim: true }];
  if (at >= 0 && mode !== "gone") ptrs.push({ at, label: mode === "shift" ? "k" : "i" });
  return (
    <IsoScene viewBox={VIEW} label={`Array of ${ARRAY_CAP} slots holding ${size} items`}>
      <CellRow cells={cells} pointers={ptrs} slots={ARRAY_CAP} name="data" />
    </IsoScene>
  );
}

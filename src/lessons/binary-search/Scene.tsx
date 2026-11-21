import CellRow, { rowFrame, type Cell } from "../../iso/CellRow";
import IsoScene from "../../iso/IsoScene";
import { fitBox } from "../../iso/project";
import type { Step } from "../../engine/types";
import type { BinaryState } from "./generate";

export default function Scene({ step }: { step: Step<BinaryState> }) {
  const { nums, lo, hi, mid, hit } = step.state;
  const view = fitBox(rowFrame(nums.length), 16);
  const empty = lo > hi;
  const cells: Cell[] = nums.map((v, k) => ({
    v, state: k === mid ? (hit ? "found" : "compare") : k < lo || k > hi ? "stale" : "default"
  }));
  const ptrs = empty ? [] : [{ at: lo, label: "lo" }, ...(mid !== null ? [{ at: mid, label: "mid" }] : []), { at: hi, label: "hi" }];
  return (
    <IsoScene viewBox={view} label={`Sorted array, range ${lo} to ${hi}${mid !== null ? `, mid ${mid}` : ""}`}>
      <CellRow cells={cells} pointers={ptrs} window={empty ? null : [lo, hi]} name="a" />
    </IsoScene>
  );
}

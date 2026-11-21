import CellRow, { rowFrame, type Cell } from "../../iso/CellRow";
import IsoScene from "../../iso/IsoScene";
import { fitBox } from "../../iso/project";
import type { Step } from "../../engine/types";
import type { TwoPtrState } from "./generate";

export default function Scene({ step }: { step: Step<TwoPtrState> }) {
  const { nums, lo, hi, hit } = step.state;
  const view = fitBox(rowFrame(nums.length), 16);
  const done = lo >= hi && !hit;
  const cells: Cell[] = nums.map((v, k) => ({
    v, state: k < lo || k > hi || done ? "stale" : (k === lo || k === hi) ? (hit ? "found" : "compare") : "default"
  }));
  const ptrs = done ? [] : [{ at: lo, label: "lo" }, { at: hi, label: "hi" }];
  return (
    <IsoScene viewBox={view} label={`Sorted array with lo at ${lo} and hi at ${hi}`}>
      <CellRow cells={cells} pointers={ptrs} window={done ? null : [lo, hi]} name="a" />
    </IsoScene>
  );
}

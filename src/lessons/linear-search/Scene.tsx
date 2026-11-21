import CellRow, { rowFrame, type Cell } from "../../iso/CellRow";
import IsoScene from "../../iso/IsoScene";
import { fitBox } from "../../iso/project";
import type { Step } from "../../engine/types";
import type { LinearState } from "./generate";

export default function Scene({ step }: { step: Step<LinearState> }) {
  const { nums, i, hit } = step.state;
  const view = fitBox(rowFrame(nums.length), 16);
  const looking = step.kind !== "problem";
  const cells: Cell[] = nums.map((v, k) => ({
    v, state: !looking ? "default" : k < i ? "stale" : k === i ? (hit ? "found" : "compare") : "default"
  }));
  const ptrs = i < nums.length ? [{ at: i, label: "i" }] : [];
  return (
    <IsoScene viewBox={view} label={`Array, checking index ${i}`}>
      <CellRow cells={cells} pointers={ptrs} name="a" />
    </IsoScene>
  );
}

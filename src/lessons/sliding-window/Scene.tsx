import CellRow, { rowFrame, type Cell } from "../../iso/CellRow";
import IsoScene from "../../iso/IsoScene";
import { fitBox } from "../../iso/project";
import type { Step } from "../../engine/types";
import type { WindowState } from "./generate";

export default function Scene({ step }: { step: Step<WindowState> }) {
  const { nums, lo, hi, out, improved } = step.state;
  const view = fitBox(rowFrame(nums.length), 16);
  const final = step.kind === "found" || step.kind === "recap";
  const cells: Cell[] = nums.map((v, k) => ({
    v,
    state: k === out ? "swap" : k >= lo && k <= hi ? (final ? "found" : k === hi && step.kind !== "problem" ? "active" : improved ? "found" : "default") : "default"
  }));
  const ptrs = hi >= 0 ? [{ at: lo, label: "lo" }, { at: hi, label: "hi" }] : [];
  return (
    <IsoScene viewBox={view} label={`Array with a window from ${lo} to ${hi}`}>
      <CellRow cells={cells} pointers={ptrs} window={hi >= 0 ? [lo, hi] : null} name="a" />
    </IsoScene>
  );
}

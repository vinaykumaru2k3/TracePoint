import CellRow, { CELL_STEP, rowFrame, type Cell } from "../../iso/CellRow";
import IsoScene from "../../iso/IsoScene";
import { fitBox } from "../../iso/project";
import type { Step } from "../../engine/types";
import type { PrefixState } from "./generate";

const Y2 = 3.8;

/** a on the back row; p on the front row, shifted so p[i + 1] sits under a[i]. */
export default function Scene({ step }: { step: Step<PrefixState> }) {
  const { nums, p, i, q } = step.state;
  const n = nums.length;
  const view = fitBox([...rowFrame(n), ...rowFrame(n + 1, Y2, CELL_STEP, -CELL_STEP)], 16);
  const top: Cell[] = nums.map((v, k) => ({ v, state: k === i ? "active" : q && k >= q[0] && k <= q[1] ? "found" : "default" }));
  const bottom: Cell[] = p.map((v, k) => ({
    v, state: i >= 0 && k === i + 1 ? "active" : i >= 0 && k === i ? "compare" : q && k === q[1] + 1 ? "found" : q && k === q[0] ? "compare" : "default"
  }));
  const ptrs = q ? [{ at: q[0], label: "l" }, { at: q[1], label: "r" }] : i >= 0 ? [{ at: i, label: "i" }] : [];
  return (
    <IsoScene viewBox={view} label="Array and its prefix sums">
      <CellRow cells={top} pointers={ptrs} window={q} name="a" />
      <CellRow cells={bottom} y={Y2} x0={-CELL_STEP} name="p" />
    </IsoScene>
  );
}

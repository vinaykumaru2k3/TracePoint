import CellRow, { rowFrame, type Cell, type RowPointer } from "../../iso/CellRow";
import { IsoBlock } from "../../iso/IsoBlock";
import IsoScene from "../../iso/IsoScene";
import { fitBox, project } from "../../iso/project";
import type { Step } from "../../engine/types";
import type { BigOState } from "./generate";

const TALLY = 0.95, TY = [3.9, 5.5];

/** One small cube per step of work, so the two counts can be compared by eye. */
function Tally({ count, row, name, live }: { count: number; row: number; name: string; live: boolean }) {
  const y = TY[row];
  const at = project(-0.5, y + 0.4, 0);
  return (
    <g>
      <text className="row-name" x={at.x - 8} y={at.y} textAnchor="end" dominantBaseline="central">{name}</text>
      {Array.from({ length: count }, (_, k) => (
        <g key={k} className="enter"><IsoBlock x={k * TALLY} y={y} w={0.8} d={0.8} h={10} state={live && k === count - 1 ? "active" : "visited"} /></g>
      ))}
    </g>
  );
}

export default function Scene({ step }: { step: Step<BigOState> }) {
  const { nums, i, j, part, sumOps, dupOps, hit } = step.state;
  const n = nums.length;
  const view = fitBox([...rowFrame(n), [-2.2, TY[1] + 1, 0], [(n * (n - 1)) / 2 * TALLY, TY[1] + 1, -20]], 16);
  const cells: Cell[] = nums.map((v, k) => ({
    v, state: k === i && part === "sum" ? "active" : (k === i || k === j) && part === "dup" ? (hit ? "found" : "compare") : "default"
  }));
  const ptrs: RowPointer[] = [];
  if (i >= 0) ptrs.push({ at: i, label: "i" });
  if (j >= 0) ptrs.push({ at: j, label: "j" });
  return (
    <IsoScene viewBox={view} label={`Array of ${n} numbers with a tally of the work each function did`}>
      <CellRow cells={cells} pointers={ptrs} name="a" />
      <Tally count={sumOps} row={0} name="sum" live={part === "sum"} />
      <Tally count={dupOps} row={1} name="pairs" live={part === "dup"} />
    </IsoScene>
  );
}

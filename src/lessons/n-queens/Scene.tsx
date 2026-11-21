import CellRow, { CELL_STEP, rowFrame, type Cell } from "../../iso/CellRow";
import IsoScene from "../../iso/IsoScene";
import { fitBox } from "../../iso/project";
import type { Step } from "../../engine/types";
import type { QueensState } from "./generate";

/** The board as n rows of cells. Row r sits further toward the viewer. */
export default function Scene({ step }: { step: Step<QueensState> }) {
  const { n, cols, row, col, attacker, lifted, solved } = step.state;
  const view = fitBox(Array.from({ length: n }, (_, r) => rowFrame(n, r * CELL_STEP)).flat(), 18);
  const tried = step.kind === "check" || step.kind === "add";

  return (
    <IsoScene viewBox={view} label={`${n} by ${n} board with ${cols.length} queens`}>
      {Array.from({ length: n }, (_, r) => {
        const cells: Cell[] = Array.from({ length: n }, (_, c) => {
          const queen = cols[r] === c;
          if (queen) return { v: "Q", state: solved ? "found" : attacker && attacker[0] === r ? "swap" : "active" };
          if (tried && r === row && c === col) return { v: "", state: "compare" };
          if (lifted && lifted[0] === r && lifted[1] === c) return { v: "", state: "stale" };
          return { v: "", state: "default" };
        });
        const ptrs = r === row && col !== null && step.kind !== "remove" ? [{ at: col, label: step.kind === "add" ? "place" : "try" }] : [];
        return <CellRow key={r} cells={cells} y={r * CELL_STEP} pointers={ptrs} index={r === n - 1} name={`r${r}`} />;
      })}
    </IsoScene>
  );
}

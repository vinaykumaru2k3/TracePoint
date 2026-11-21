import CellRow, { rowFrame, type Cell } from "../../iso/CellRow";
import IsoScene from "../../iso/IsoScene";
import { fitBox } from "../../iso/project";
import type { Step } from "../../engine/types";
import type { StringState } from "./generate";

const Y2 = 3.6;

export default function Scene({ step }: { step: Step<StringState> }) {
  const { s, out, i, phase, same } = step.state;
  const n = s.length;
  const view = fitBox([...rowFrame(n), ...rowFrame(n, Y2)], 16);
  const cmp = (k: number) => (phase === "compare" ? (same || k < i ? "found" : k === i ? "swap" : "default") : undefined);
  const top: Cell[] = s.map((c, k) => ({ v: c, state: cmp(k) ?? (k === i ? "active" : "default") }));
  const bottom: Cell[] = out.map((c, k) => ({ v: c, state: cmp(k) ?? (phase === "build" && k === out.length - 1 && i >= 0 ? "active" : "default") }));
  return (
    <IsoScene viewBox={view} label={`The word ${s.join("")} and the reversed copy being built`}>
      <CellRow cells={top} pointers={i >= 0 ? [{ at: i, label: "i" }] : []} name="s" />
      <CellRow cells={bottom} y={Y2} slots={n} name="sb" />
    </IsoScene>
  );
}

import CellRow, { CELL_STEP, rowFrame, type Cell } from "../../iso/CellRow";
import FrameStack, { frameStackBox, type Frame } from "../../iso/FrameStack";
import IsoScene from "../../iso/IsoScene";
import { fitBox } from "../../iso/project";
import type { Step } from "../../engine/types";
import type { SubsetsState } from "./generate";

const PATH_Y = 3.6;

export default function Scene({ step }: { step: Step<SubsetsState> }) {
  const { items, path, depth, choice } = step.state;
  const n = items.length;
  const sx = n * CELL_STEP + 1.6;
  const view = fitBox([...rowFrame(n), ...rowFrame(n, PATH_Y), ...frameStackBox(n + 1, sx, 0)], 18);

  const items$: Cell[] = items.map((v, i) => ({
    v,
    state: i !== depth ? (i < depth ? "visited" : "default")
      : choice === "take" ? "active" : choice === "skip" ? "compare" : choice === "undo" ? "stale" : "default"
  }));
  const path$: Cell[] = path.map((v, i) => ({
    v, state: choice === "record" ? "found" : choice === "take" && i === path.length - 1 ? "active" : "default"
  }));
  const frames: Frame[] = Array.from({ length: Math.min(depth, n) + 1 }, (_, k) => ({
    label: `dfs(${k})`, state: k === Math.min(depth, n) ? (choice === "record" ? "found" : "active") : "default"
  }));
  const ptrs = depth < n && step.kind !== "recap" ? [{ at: depth, label: "i" }] : [];

  return (
    <IsoScene viewBox={view} label={`Subsets: deciding item ${depth}, path ${path.join(", ") || "empty"}`}>
      <CellRow cells={items$} pointers={ptrs} name="items" />
      <CellRow cells={path$} y={PATH_Y} slots={n} index={false} name="path" />
      <FrameStack frames={step.kind === "problem" || step.kind === "recap" ? [] : frames} x={sx} name="calls" />
    </IsoScene>
  );
}

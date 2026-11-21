import FrameStack, { frameStackBox, type Frame } from "../../iso/FrameStack";
import IsoScene from "../../iso/IsoScene";
import { fitBox } from "../../iso/project";
import type { Step } from "../../engine/types";
import type { CallStackState } from "./generate";

export default function Scene({ step }: { step: Step<CallStackState> }) {
  const { n, frames, active, result } = step.state;
  const view = fitBox(frameStackBox(n + 1), 20);
  const fs: Frame[] = frames.map((f, i) => ({
    label: f.ret === null ? `fact(${f.k})` : `fact(${f.k}) = ${f.ret}`,
    state: i === active ? (f.ret === null ? "active" : "found") : "default"
  }));
  const flag = frames.length ? "running" : result !== null ? `main got ${result}` : "main";
  return (
    <IsoScene viewBox={view} label={`Call stack with ${frames.length} frames`}>
      <FrameStack frames={fs} top={flag} name="call stack" />
    </IsoScene>
  );
}

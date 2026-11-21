import Blocks, { type BlockSpec } from "../../iso/Blocks";
import { IsoPlate } from "../../iso/IsoBlock";
import IsoPointer from "../../iso/IsoPointer";
import IsoScene from "../../iso/IsoScene";
import { fitBox } from "../../iso/project";
import type { Step } from "../../engine/types";
import { QUEUE_CAP, type QueueState } from "./generate";

const BH = 26, FLOOR = 8, STEP = 2.5;
const slotX = (k: number) => k * STEP;
const VIEW = fitBox([[0, 0, 100], [slotX(QUEUE_CAP - 1) + 2, 0, 0], [0, 2, 0], [slotX(QUEUE_CAP - 1) + 2, 2, -20]], 24);

/** The queue as a row of slots on the floor. Blocks slide in at the rear and out at the head. */
export default function Scene({ step }: { step: Step<QueueState> }) {
  const { items, head, size, cap, hl, mode } = step.state;
  const slotOf = (j: number) => (head + j) % cap;
  const blocks: BlockSpec[] = items.map((it, j) => ({
    id: it.id, v: it.v, x: slotX(slotOf(j)), y: 0, z: FLOOR, w: 2, d: 2, h: BH,
    state: hl === it.id ? (mode === "peek" ? "found" : "active") : "default"
  }));

  const next = size < cap ? (head + size) % cap : -1;
  const flags: Record<number, string[]> = {};
  if (size > 0) (flags[head] ||= []).push("head");
  if (next >= 0) (flags[next] ||= []).push("next");
  const occupied = new Set(items.map((_, j) => slotOf(j)));

  return (
    <IsoScene viewBox={VIEW} label="Isometric circular queue: four slots in a row">
      {Array.from({ length: cap }, (_, k) => <IsoPlate key={k} x={slotX(k)} y={0} w={2} d={2} index={k} state={k === step.state.cell && mode ? "visited" : "default"} />)}
      <Blocks blocks={blocks} enter={[70, 35]} leave={[-70, -35]} />
      {Object.entries(flags).map(([k, names]) => (
        <IsoPointer key={k} x={slotX(Number(k)) + 1} y={1} z={occupied.has(Number(k)) ? FLOOR + BH : FLOOR} label={names.join(" · ")} />
      ))}
    </IsoScene>
  );
}

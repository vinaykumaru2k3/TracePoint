import Blocks, { type BlockSpec } from "../../iso/Blocks";
import { IsoPlate } from "../../iso/IsoBlock";
import IsoPointer from "../../iso/IsoPointer";
import IsoScene from "../../iso/IsoScene";
import { fitBox, poly, project } from "../../iso/project";
import type { Step } from "../../engine/types";
import { DEQUE_CAP, type DequeState } from "./generate";

const BH = 26, FLOOR = 8, STEP = 2.5;
const slotX = (k: number) => k * STEP;
const VIEW = fitBox([[0, 0, 100], [slotX(DEQUE_CAP - 1) + 2, 0, 100], [0, 2, -20], [slotX(DEQUE_CAP - 1) + 2, 2, -20]], 20);

/** The deque's ring of slots. Blocks drop in at whichever end the step works on. */
export default function Scene({ step }: { step: Step<DequeState> }) {
  const { items, head, size, cap, hl, mode, cell } = step.state;
  const slotOf = (j: number) => (head + j) % cap;
  const blocks: BlockSpec[] = items.map((it, j) => ({
    id: it.id, v: it.v, x: slotX(slotOf(j)), y: 0, z: FLOOR, w: 2, d: 2, h: BH,
    state: hl === it.id ? "active" : "default"
  }));
  const flags: Record<number, string[]> = {};
  if (size > 0) {
    (flags[head] ||= []).push("front");
    (flags[slotOf(size - 1)] ||= []).push("back");
  }
  return (
    <IsoScene viewBox={VIEW} label={`Circular deque of ${cap} slots holding ${size} items`}>
      <polygon className="foot" points={poly([project(-0.4, -0.4), project(slotX(cap - 1) + 2.4, -0.4), project(slotX(cap - 1) + 2.4, 2.4), project(-0.4, 2.4)])} />
      {Array.from({ length: cap }, (_, k) => <IsoPlate key={k} x={slotX(k)} y={0} w={2} d={2} index={k} state={k === cell && mode ? "visited" : "default"} />)}
      <Blocks blocks={blocks} enter={[0, -60]} leave={[0, -60]} />
      {Object.entries(flags).map(([k, names]) => (
        <IsoPointer key={names[0]} x={slotX(Number(k)) + 1} y={1} z={FLOOR + BH} label={names.join(" · ")} />
      ))}
    </IsoScene>
  );
}

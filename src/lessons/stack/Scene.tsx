import Blocks, { type BlockSpec } from "../../iso/Blocks";
import { IsoPlate } from "../../iso/IsoBlock";
import IsoPointer from "../../iso/IsoPointer";
import IsoScene from "../../iso/IsoScene";
import { fitBox, poly, project } from "../../iso/project";
import type { Step } from "../../engine/types";
import { STACK_CAP, type StackState } from "./generate";

const BH = 26, GAP = 4, FLOOR = 8, PAD = 0.3;
const WELL_H = FLOOR + STACK_CAP * (BH + GAP) + 6;
const VIEW = fitBox([[-PAD, -PAD, 0], [2 + PAD, 2 + PAD, 0], [-PAD, -PAD, WELL_H + 16], [4.4, 0, 0]], 20);

/** The stack as a tall well. Blocks drop in at the top and lift out of it. */
export default function Scene({ step }: { step: Step<StackState> }) {
  const { items, top, hl, mode } = step.state;
  const level = (i: number) => FLOOR + i * (BH + GAP);
  const blocks: BlockSpec[] = items.map((it, i) => ({
    id: it.id, v: it.v, x: 0, y: 0, z: level(i), w: 2, d: 2, h: BH, labelOn: "front",
    state: hl === it.id ? (mode === "peek" ? "found" : "active") : "default"
  }));
  const a = -PAD, b = 2 + PAD;
  const wallBack = [project(a, a, 0), project(b, a, 0), project(b, a, WELL_H), project(a, a, WELL_H)];
  const wallSide = [project(a, a, 0), project(a, b, 0), project(a, b, WELL_H), project(a, a, WELL_H)];
  const note = project(1, 1, WELL_H);
  const topZ = items.length ? level(items.length - 1) + BH / 2 : FLOOR;

  return (
    <IsoScene viewBox={VIEW} label="Isometric stack: blocks pile up inside a well">
      <polygon className="wall" points={poly(wallBack)} />
      <polygon className="wall" points={poly(wallSide)} />
      <IsoPlate x={a} y={a} w={b - a} d={b - a} h={FLOOR} />
      <text className="scene-note" x={note.x} y={note.y - 22} textAnchor="middle">push / pop here</text>
      <Blocks blocks={blocks} enter={[0, -70]} leave={[0, -60]} />
      <IsoPointer x={2} y={0} z={topZ} dir="right" label={items.length ? `top = ${top}` : "top = -1"} dim={!items.length} />
    </IsoScene>
  );
}

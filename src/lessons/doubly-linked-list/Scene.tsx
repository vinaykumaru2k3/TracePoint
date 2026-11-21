import IsoScene from "../../iso/IsoScene";
import LinkedNodes, { NODE_SPAN, listFrame, type LinkSpec, type NodePointer, type NodeSpec } from "../../iso/LinkedNodes";
import { fitBox } from "../../iso/project";
import type { Step } from "../../engine/types";
import { DLL_MAX, type DllState } from "./generate";

const LIFT = 44;
const VIEW = fitBox(listFrame(DLL_MAX, true), 20);

/** Wide nodes with a prev lane and a next lane. New and removed nodes float above the row. */
export default function Scene({ step }: { step: Step<DllState> }) {
  const s = step.state;
  const nodes: NodeSpec[] = s.nodes.map((n) => ({ id: n.id, v: n.v, x: n.slot * NODE_SPAN, y: 0, z: n.lift ? LIFT : 0, state: n.state }));
  const st = (id: number, kind: "next" | "prev"): LinkSpec["state"] =>
    id === s.gone ? "dim" : s.active.includes(`${id}:${kind}`) ? "active" : "default";
  const links: LinkSpec[] = s.nodes.flatMap((n) => [
    { from: n.id, to: n.next, kind: "next" as const, state: st(n.id, "next") },
    { from: n.id, to: n.prev, kind: "prev" as const, state: st(n.id, "prev") }
  ]);
  const pointers: NodePointer[] = [{ node: s.head, label: "head" }, { node: s.tail, label: "tail" }];
  return (
    <IsoScene viewBox={VIEW} label={`Doubly linked list with ${s.nodes.filter((n) => !n.lift).length} nodes`}>
      <LinkedNodes nodes={nodes} links={links} pointers={pointers} double />
    </IsoScene>
  );
}

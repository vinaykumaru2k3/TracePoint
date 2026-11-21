import IsoScene from "../../iso/IsoScene";
import LinkedNodes, { listView, type LinkSpec, type NodePointer, type NodeSpec } from "../../iso/LinkedNodes";
import type { Step } from "../../engine/types";
import { SLL_MAX, type SllState } from "./generate";

const LIFT = 44;
const VIEW = listView(SLL_MAX, { lift: LIFT });

/** Nodes in a row with next arrows. New and unlinked nodes float above the row. */
export default function Scene({ step }: { step: Step<SllState> }) {
  const s = step.state;
  const nodes: NodeSpec[] = s.nodes.map((n) => ({ id: n.id, v: n.v, slot: n.slot, z: n.lift ? LIFT : 0, state: n.state }));
  const links: LinkSpec[] = s.nodes.map((n) => ({
    from: n.id, to: n.next, state: n.id === s.gone ? "dim" : n.id === s.active ? "active" : "default"
  }));
  const pointers: NodePointer[] = [
    { node: s.head, label: "head" },
    { node: s.tail, label: "tail" },
    ...(s.prev !== null ? [{ node: s.prev, label: "prev" }] : []),
    ...(s.cur !== null ? [{ node: s.cur, label: "cur" }] : [])
  ];
  return (
    <IsoScene viewBox={VIEW} label={`Singly linked list with ${s.nodes.length} nodes`}>
      <LinkedNodes nodes={nodes} links={links} pointers={pointers} />
    </IsoScene>
  );
}

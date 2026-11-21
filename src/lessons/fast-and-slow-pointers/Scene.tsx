import IsoScene from "../../iso/IsoScene";
import type { BlockState } from "../../iso/IsoBlock";
import LinkedNodes, { NODE_SPAN, listFrame, type LinkSpec, type NodePointer, type NodeSpec } from "../../iso/LinkedNodes";
import { fitBox } from "../../iso/project";
import type { Step } from "../../engine/types";
import { FS_MAX, type FsState } from "./generate";

const VIEW = fitBox(listFrame(FS_MAX), 20);

/** A row of nodes whose last link may curve back. slow and fast ride on top. */
export default function Scene({ step }: { step: Step<FsState> }) {
  const s = step.state;
  const state = (i: number): BlockState =>
    s.met && i === s.slow ? "found" : s.moved === "fast" && i === s.fast ? "compare" : s.moved === "slow" && i === s.slow ? "visited" : "default";
  const nodes: NodeSpec[] = s.vals.map((v, i) => ({ id: i, v, x: i * NODE_SPAN, y: 0, state: state(i) }));
  const links: LinkSpec[] = s.next.map((to, i) => ({ from: i, to, state: i === s.vals.length - 1 && to !== null ? "active" : "default" }));
  const pointers: NodePointer[] = [
    ...(s.slow !== null ? [{ node: s.slow, label: "slow" }] : []),
    ...(s.fast !== null ? [{ node: s.fast, label: "fast" }] : [])
  ];
  return (
    <IsoScene viewBox={VIEW} label={`Linked list of ${s.vals.length} nodes${s.cycleAt !== null ? " with a cycle" : ""}`}>
      <LinkedNodes nodes={nodes} links={links} pointers={pointers} />
    </IsoScene>
  );
}

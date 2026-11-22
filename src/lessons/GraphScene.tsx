import IsoScene from "../iso/IsoScene";
import GraphNodes from "../iso/GraphNodes";
import { fitBox } from "../iso/project";
import { COL, ROW, Strip, TILE_STEP, stripFrame, treeFrame } from "../iso/TreeNodes";
import type { Step } from "../engine/types";
import type { GraphState } from "./graphkit";

/** Where the strip sits: centred under the framed graph, below its lowest row. */
export function graphStripAt(s: GraphState): { X: number; Y: number } {
  const n = Math.max(s.strip?.slots ?? 0, s.strip?.tiles.length ?? 0, 1);
  const mid = ((s.frame.c0 + s.frame.c1) / 2) * COL;
  return { X: mid - ((n - 1) * TILE_STEP) / 2, Y: s.frame.rows * ROW + 126 };
}

/** A graph on the floor, with an optional strip of tiles under it: a queue, a stack, an order or an array. */
export default function GraphScene({ step }: { step: Step<GraphState> }) {
  const s = step.state;
  const { X, Y } = graphStripAt(s);
  const n = Math.max(s.strip?.slots ?? 0, s.strip?.tiles.length ?? 0, 1);
  const points = [...treeFrame(s.frame.c0, s.frame.c1, s.frame.rows), ...(s.strip ? stripFrame(n, X, Y, s.strip.name.length) : [])];
  const byId = new Map(s.nodes.map((x) => [x.id, x.v]));
  const label = `Graph with ${s.nodes.length} nodes and ${s.edges.length} edges: ${s.edges.map((e) => `${byId.get(e.from)}${e.dir ? " to " : "-"}${byId.get(e.to)}`).join(", ") || "none"}`;
  const strip = s.strip ? `. ${s.strip.name}: ${s.strip.tiles.map((t) => t.v ?? "empty").join(", ") || "empty"}` : "";
  return (
    <IsoScene viewBox={fitBox(points, 16)} label={label + strip}>
      <GraphNodes nodes={s.nodes} edges={s.edges} pointers={s.ptrs} />
      {s.strip && <Strip tiles={s.strip.tiles} X={X} Y={Y} slots={s.strip.slots} name={s.strip.name} index={s.strip.index} labels={s.strip.labels} pointers={s.strip.ptrs} />}
    </IsoScene>
  );
}

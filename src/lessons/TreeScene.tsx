import IsoScene from "../iso/IsoScene";
import { fitBox } from "../iso/project";
import TreeNodes, { COL, ROW, Strip, TILE_STEP, stripFrame, treeFrame } from "../iso/TreeNodes";
import type { Step } from "../engine/types";
import type { TreeState } from "./treekit";

/** Where the strip sits: centred under the framed tree, below its deepest level. */
export function stripAt(s: TreeState): { X: number; Y: number } {
  const n = Math.max(s.strip?.slots ?? 0, s.strip?.tiles.length ?? 0, 1);
  const mid = ((s.frame.c0 + s.frame.c1) / 2) * COL;
  return { X: mid - ((n - 1) * TILE_STEP) / 2, Y: s.frame.depth * ROW + 126 };
}

/** A tree on the floor, with an optional strip of tiles under it: a traversal's output or the array behind a heap. */
export default function TreeScene({ step }: { step: Step<TreeState> }) {
  const s = step.state;
  const { X, Y } = stripAt(s);
  const n = Math.max(s.strip?.slots ?? 0, s.strip?.tiles.length ?? 0, 1);
  const points = [...treeFrame(s.frame.c0, s.frame.c1, s.frame.depth), ...(s.strip ? stripFrame(n, X, Y, s.strip.name.length) : [])];
  const vals = [...s.nodes].sort((a, b) => a.depth - b.depth || a.col - b.col).map((x) => x.v);
  const label = s.nodes.length ? `Tree with ${s.nodes.length} nodes, level by level: ${vals.join(", ")}` : "Empty tree";
  const strip = s.strip ? `. ${s.strip.name}: ${s.strip.tiles.map((t) => t.v ?? "empty").join(", ") || "empty"}` : "";
  return (
    <IsoScene viewBox={fitBox(points, 16)} label={label + strip}>
      <TreeNodes nodes={s.nodes} edges={s.edges} pointers={s.ptrs} />
      {s.strip && <Strip tiles={s.strip.tiles} X={X} Y={Y} slots={s.strip.slots} name={s.strip.name} index={s.strip.index} pointers={s.strip.ptrs} />}
    </IsoScene>
  );
}

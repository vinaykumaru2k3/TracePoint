import type { Step } from "../../engine/types";
import type { GEdge } from "../../iso/GraphNodes";
import type { BlockState } from "../../iso/IsoBlock";
import type { Tile, TPointer } from "../../iso/TreeNodes";
import { adjacency, ekey, graphView, idOf, ringLayout, type GraphInput, type GraphState } from "../graphkit";

export interface MstState extends GraphState {
  op: string | null;
  /** Edges kept so far by the algorithm on screen, as "AC". */
  kept: string[];
  total: number;
  /** Kruskal: each node's set root. Prim: empty. */
  root: Record<string, string>;
}

const name = (e: { u: string; v: string }) => ekey(e.u, e.v, false);
const label = (e: { u: string; v: string; w: number }) => `${name(e)}:${e.w}`;

/** Kruskal (sorted edges, union-find) and then Prim from the start (a lazy heap of edges leaving the tree). */
export function generateMst(g: GraphInput): Step<MstState>[] {
  const { pos, frame } = ringLayout(g.nodes);
  const n = g.nodes.length;
  const steps: Step<MstState>[] = [];
  let op: string | null = null;
  let kept: string[] = [];
  let total = 0;
  let root: Record<string, string> = {};
  let strip: GraphState["strip"];

  const snap = (st: Omit<Step<MstState>, "state" | "op">, v: { states?: Partial<Record<string, BlockState>>; edges?: Partial<Record<string, GEdge["state"]>>; tags?: Partial<Record<string, string>>; ptrs?: TPointer[] } = {}) => {
    const edges: Partial<Record<string, GEdge["state"]>> = { ...Object.fromEntries(kept.map((k) => [k, "tree" as const])), ...v.edges };
    const view = graphView(g, pos, { states: v.states, edges, tags: v.tags, weighted: true });
    const live = st.kind === "problem" || st.kind === "recap" ? null : op;
    steps.push({ ...st, op: live, state: { ...view, frame, ptrs: v.ptrs ?? [], strip, op: live, kept: kept.slice(), total, root: { ...root } } });
  };

  snap({
    kind: "problem", anchors: [], notes: {},
    title: "Connect every node for the least total cost",
    idea: "A spanning tree joins all nodes with no loops, using n - 1 edges. The minimum one has the smallest total weight.",
    text: `Picture ${n} towns and the cost of a cable between some pairs. A minimum spanning tree links every town with the cheapest set of cables and no loops. Kruskal's algorithm and Prim's algorithm both find one. We run Kruskal first, then Prim from ${g.start}.`
  });

  /* ---------- Kruskal ---------- */
  op = "kruskal()";
  const sorted = g.edges.map((e, i) => ({ ...e, i })).sort((a, b) => a.w - b.w || a.i - b.i);
  const fate: Record<string, "found" | "stale" | undefined> = {};
  const kTiles = (cur?: string): Tile[] => sorted.map((e) => ({ v: label(e), state: name(e) === cur ? "active" : fate[name(e)] }));
  const parent: Record<string, string> = Object.fromEntries(g.nodes.map((x) => [x, x]));
  const size: Record<string, number> = Object.fromEntries(g.nodes.map((x) => [x, 1]));
  const find = (x: string): string => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
  const roots = () => Object.fromEntries(g.nodes.map((x) => [x, find(x)]));
  root = roots();
  const setTags = () => Object.fromEntries(g.nodes.map((x) => [x, `set ${root[x]}`]));
  strip = { name: "sorted", tiles: kTiles() };
  snap({
    kind: "check", anchors: ["kr.sig", "kr.sort"], notes: { "kr.sort": sorted.map(label).join(" ") },
    title: "Kruskal: sort the edges by weight",
    idea: "Kruskal looks at edges from cheapest to dearest. Each node starts in a set of its own.",
    text: `The ${sorted.length} edges are sorted from cheapest to dearest, shown in the strip. Each node starts as its own set, named on its tag. A union-find structure tracks the sets.`
  }, { tags: setTags() });

  for (const e of sorted) {
    if (kept.length === n - 1) break;
    const ru = find(e.u), rv = find(e.v);
    const k = name(e);
    const ptrs: TPointer[] = [{ node: idOf(e.u), label: "u" }, { node: idOf(e.v), label: "v" }];
    if (ru === rv) {
      fate[k] = "stale";
      strip = { name: "sorted", tiles: kTiles(k) };
      snap({
        kind: "check", anchors: ["kr.find", "kr.skip"], notes: { "kr.find": `find(${e.u}) = find(${e.v}) = ${ru}`, "kr.skip": `skip ${k}` },
        title: `Skip ${e.u}-${e.v}: it would close a loop`,
        idea: "Two ends in the same set are already joined by kept edges. Adding this one would make a loop, so it is never needed.",
        text: `${e.u} and ${e.v} are both in set ${ru}, so a path of kept edges already joins them. ${e.u}-${e.v} with weight ${e.w} is skipped.`
      }, { states: { [e.u]: "swap", [e.v]: "swap" }, edges: { [k]: "dim" }, tags: setTags(), ptrs });
      continue;
    }
    if (size[ru] < size[rv]) { parent[ru] = rv; size[rv] += size[ru]; } else { parent[rv] = ru; size[ru] += size[rv]; }
    kept.push(k);
    total += e.w;
    fate[k] = "found";
    root = roots();
    strip = { name: "sorted", tiles: kTiles(k) };
    snap({
      kind: "add", anchors: ["kr.find", "kr.take"], notes: { "kr.find": `find(${e.u}) = ${ru}, find(${e.v}) = ${rv}`, "kr.take": `take ${k}, total ${total}` },
      title: `Take ${e.u}-${e.v} for ${e.w}`,
      idea: "The cheapest edge between two different sets is always safe to keep. It joins them for the least cost.",
      text: `${e.u} is in set ${ru} and ${e.v} is in set ${rv}, so this edge joins two separate pieces. It is kept and the two sets merge. The total is now ${total}.`
    }, { states: { [e.u]: "active", [e.v]: "active" }, edges: { [k]: "active" }, tags: setTags(), ptrs });
  }

  const pieces = new Set(Object.values(root)).size;
  const kRet = `${total} [${kept.join(", ")}]${pieces > 1 ? `, forest of ${pieces}` : ""}`;
  strip = { name: "sorted", tiles: kTiles() };
  snap({
    kind: "found", anchors: ["kr.done"], notes: { "kr.done": `return ${kRet}` }, ret: kRet,
    title: pieces > 1 ? `Kruskal ends with ${pieces} separate trees` : `Kruskal's tree costs ${total}`,
    idea: pieces > 1 ? "When the graph is in pieces, no spanning tree exists. Kruskal returns the cheapest tree for each piece, a spanning forest." : "Kruskal stops once it has n - 1 edges. Every later edge would close a loop.",
    text: pieces > 1
      ? `Every edge was tried and ${kept.length} kept, for a total of ${total}. The graph has ${pieces} pieces with no edge between them, so the result is a forest.`
      : `${kept.length} edges join all ${n} nodes: ${kept.join(", ")}, for a total of ${total}. ${sorted.length - Object.keys(fate).length > 0 ? "The edges never looked at would all have closed a loop." : ""}`.trim()
  }, { tags: setTags() });
  const kKept = kept.slice(), kTotal = total;

  /* ---------- Prim ---------- */
  op = `prim(${g.start})`;
  kept = [];
  total = 0;
  root = {};
  const adj = adjacency(g);
  const inTree = new Set<string>();
  /** Heap entries: an edge from a tree node to a node outside, smallest weight first, ties in push order. */
  const heap: { u: string; v: string; w: number; i: number }[] = [];
  let seq = 0;
  const pTiles = (stale?: string): Tile[] => [
    ...(stale ? [{ v: stale, state: "stale" as const }] : []),
    ...heap.map((e, k) => ({ v: label(e), state: inTree.has(e.v) ? ("stale" as const) : k === 0 && !stale ? ("active" as const) : ("compare" as const) }))
  ];
  const states = (extra: Partial<Record<string, BlockState>> = {}) => ({ ...Object.fromEntries([...inTree].map((x) => [x, "visited" as const])), ...extra });
  const add = (x: string) => {
    inTree.add(x);
    for (const { to, w } of adj[x]) if (!inTree.has(to)) heap.push({ u: x, v: to, w, i: seq++ });
    heap.sort((a, b) => a.w - b.w || a.i - b.i);
  };

  add(g.start);
  strip = { name: "heap", tiles: pTiles(), ptrs: heap.length ? [{ at: 0, label: "min" }] : [] };
  snap({
    kind: "add", anchors: ["pr.sig", "pr.init"], notes: { "pr.init": `tree = {${g.start}}, heap = [${heap.map(label).join(", ")}]` },
    title: `Prim: grow a tree from ${g.start}`,
    idea: "Prim keeps one tree and grows it. The heap holds every edge that leaves the tree, cheapest first.",
    text: `The tree starts as ${g.start} alone. Each edge from ${g.start} goes into the heap. Prim will add the cheapest edge leaving the tree, again and again.`
  }, { states: states({ [g.start]: "active" }), ptrs: [{ node: idOf(g.start), label: "s" }] });

  while (heap.length && inTree.size < n) {
    const e = heap.shift()!;
    const k = name(e);
    if (inTree.has(e.v)) {
      strip = { name: "heap", tiles: pTiles(label(e)) };
      snap({
        kind: "remove", anchors: ["pr.pop", "pr.skip"], notes: { "pr.pop": label(e), "pr.skip": `${e.v} already in the tree` },
        title: `Skip ${e.u}-${e.v}: both ends are in the tree`,
        idea: "An edge can enter the heap and later stop leaving the tree. A lazy heap throws such an edge away when it comes out.",
        text: `${e.u}-${e.v} was pushed when only ${e.u} was in the tree. ${e.v} joined since, so this edge would close a loop. It is skipped.`
      }, { states: states({ [e.u]: "swap", [e.v]: "swap" }), edges: { [k]: "dim" }, ptrs: [{ node: idOf(e.v), label: "v" }] });
      continue;
    }
    kept.push(k);
    total += e.w;
    add(e.v);
    strip = { name: "heap", tiles: pTiles(), ptrs: heap.length ? [{ at: 0, label: "min" }] : [] };
    snap({
      kind: "add", anchors: ["pr.pop", "pr.take"], notes: { "pr.pop": label(e), "pr.take": `add ${e.v}, total ${total}` },
      title: `Add ${e.v} by ${e.u}-${e.v} for ${e.w}`,
      idea: "The cheapest edge leaving the tree is always safe. It reaches a new node for the least cost.",
      text: `${e.u}-${e.v} is the cheapest edge in the heap and ${e.v} is not in the tree yet. ${e.v} joins the tree and the total is ${total}. Edges from ${e.v} to nodes outside go into the heap.`
    }, { states: states({ [e.v]: "active" }), edges: { [k]: "active" }, ptrs: [{ node: idOf(e.u), label: "u" }, { node: idOf(e.v), label: "v" }] });
  }

  const missed = g.nodes.filter((x) => !inTree.has(x));
  const pRet = `${total} [${kept.join(", ")}]${missed.length ? `, spans ${inTree.size} of ${n}` : ""}`;
  strip = { name: "heap", tiles: pTiles() };
  snap({
    kind: missed.length ? "empty" : "found", anchors: ["pr.done"], notes: { "pr.done": `return ${pRet}` }, ret: pRet,
    title: missed.length ? `Prim reaches only ${inTree.size} of ${n} nodes` : `Prim's tree also costs ${total}`,
    idea: missed.length ? "Prim grows one tree, so it covers only the start's piece. Kruskal's forest covered every piece." : "Both algorithms found a tree of the same cost. When weights tie, the trees can differ but the total cannot.",
    text: missed.length
      ? `The heap ran dry. ${missed.join(", ")} ${missed.length === 1 ? "has" : "have"} no edge into ${g.start}'s piece, so ${missed.length === 1 ? "it was" : "they were"} never reached. Kruskal's total was ${kTotal}.`
      : `Prim kept ${kept.join(", ")} for ${total}. Kruskal kept ${kKept.join(", ")} for ${kTotal}.`
  }, { states: states() });

  op = null;
  snap({
    kind: "recap", anchors: [], notes: {},
    title: "Two greedy routes to one tree",
    idea: "Both take the cheapest edge that cannot close a loop. Kruskal sorts every edge in O(e log e); Prim grows from one node with a heap in O(e log n).",
    text: "Kruskal works on edges and suits a sparse list of edges. Prim works outward from a node and suits a graph stored as adjacency lists. Both are greedy, and each greedy choice can be proven safe."
  }, { states: states() });
  return steps;
}


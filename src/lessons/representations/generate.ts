import type { Step } from "../../engine/types";
import type { BlockState } from "../../iso/IsoBlock";
import type { TPointer, Tile } from "../../iso/TreeNodes";
import { ekey, graphView, idOf, ringLayout, type GraphInput, type GraphState } from "../graphkit";

export interface RepState extends GraphState {
  op: string | null;
  /** Adjacency lists so far, as letters. */
  lists: Record<string, string[]>;
}

/** Build an adjacency list and a matrix edge by edge, then answer hasEdge and neighbours from each. */
export function generateRepresentations(g: GraphInput): Step<RepState>[] {
  const { pos, frame } = ringLayout(g.nodes);
  const idx = Object.fromEntries(g.nodes.map((x, i) => [x, i]));
  const lists: Record<string, string[]> = Object.fromEntries(g.nodes.map((x) => [x, []]));
  const m = g.nodes.map(() => g.nodes.map(() => 0));
  let built = 0;
  let op: string | null = null;
  const steps: Step<RepState>[] = [];

  const row = (u: string, mark: Partial<Record<string, BlockState>> = {}): NonNullable<GraphState["strip"]> => ({
    name: `m[${u}]`, labels: g.nodes,
    tiles: m[idx[u]].map((v, j): Tile => ({ v, state: mark[g.nodes[j]] ?? (v ? "visited" : undefined) }))
  });

  const snap = (s: Omit<Step<RepState>, "state">, v: {
    states?: Partial<Record<string, BlockState>>; edges?: Partial<Record<string, "active" | "tree" | "dim">>;
    strip?: GraphState["strip"]; ptrs?: TPointer[];
  } = {}) => {
    const sub: GraphInput = { ...g, edges: g.edges.slice(0, built) };
    const view = graphView(sub, pos, { states: v.states, edges: v.edges });
    steps.push({
      ...s,
      state: { ...view, ptrs: v.ptrs ?? [], frame, strip: v.strip, op, lists: Object.fromEntries(g.nodes.map((x) => [x, lists[x].slice()])) }
    });
  };

  snap({
    kind: "problem", op: null, anchors: [], notes: {},
    title: "Two ways to write a graph down",
    idea: "A list stores only the edges that exist. A matrix stores a yes or no for every pair, so it answers one pair in one look.",
    text: `A graph is a set of nodes and the edges between them. The code needs to store it somehow. An adjacency list keeps, for each node, the nodes it touches. An adjacency matrix keeps an n by n grid of 0s and 1s. We will add ${g.edges.length} edge${g.edges.length === 1 ? "" : "s"} to both, then ask each one questions.`
  });

  for (const e of g.edges) {
    op = `addEdge(${e.u},${e.v})`;
    lists[e.u].push(e.v);
    lists[e.v].push(e.u);
    m[idx[e.u]][idx[e.v]] = m[idx[e.v]][idx[e.u]] = 1;
    built++;
    snap({
      kind: "add", op, anchors: ["add.sig", "add.uv", "add.vu", "add.mat"],
      notes: { "add.uv": `adj[${e.u}] = [${lists[e.u].join(", ")}]`, "add.vu": `adj[${e.v}] = [${lists[e.v].join(", ")}]`, "add.mat": `m[${e.u}][${e.v}] = m[${e.v}][${e.u}] = 1` },
      title: `Add the edge ${e.u}-${e.v}`,
      idea: "An undirected edge goes both ways, so it is written twice: in both lists and in both cells of the matrix.",
      text: `${e.v} is appended to ${e.u}'s list and ${e.u} to ${e.v}'s. In the matrix, row ${e.u} column ${e.v} and row ${e.v} column ${e.u} both become 1.`
    }, { states: { [e.u]: "active", [e.v]: "active" }, edges: { [ekey(e.u, e.v, false)]: "active" }, strip: row(e.u, { [e.v]: "found" }) });
  }

  /* hasEdge on the first pair with no edge, starting from the first node */
  const u = g.start;
  const v = g.nodes.find((x) => x !== u && !lists[u].includes(x));
  if (v !== undefined) {
    op = `hasEdge(${u},${v})`;
    snap({
      kind: "check", op, ret: "false", anchors: ["has.mat"], notes: { "has.mat": `m[${u}][${v}] = 0` },
      retNote: "one cell read",
      title: `Matrix: is there an edge ${u}-${v}?`,
      idea: "The matrix answers any pair in one look. That speed costs n × n cells, even when most of them are 0.",
      text: `The matrix reads one cell, row ${u} column ${v}. It holds 0, so there is no edge. hasEdge returns false in a single step.`
    }, { states: { [u]: "active", [v]: "compare" }, strip: row(u, { [v]: "compare" }) });

    op = `hasEdge(${u},${v})`;
    lists[u].forEach((x, k) => {
      snap({
        kind: "check", op, anchors: [...(k === 0 ? ["has.sig"] : []), "has.step"], notes: { "has.step": `x = ${x}, not ${v}` },
        title: `List: ${x} is not ${v}`,
        idea: "A list has no cell for the pair. It walks the node's neighbours until it finds the one it wants or runs out.",
        text: `The walk reads entry ${k} of ${u}'s list. It is ${x}, not ${v}, so the walk goes on.`
      }, { states: { [u]: "active", [v]: "compare", [x]: "visited" }, edges: { [ekey(u, x, false)]: "active" }, ptrs: [{ node: idOf(x), label: "x" }] });
    });
    snap({
      kind: "empty", op, ret: "false", anchors: [...(lists[u].length === 0 ? ["has.sig"] : []), "has.miss"], notes: { "has.miss": "list ended, return false" },
      retNote: `${lists[u].length} entr${lists[u].length === 1 ? "y" : "ies"} read`,
      title: `${u}'s list has no ${v}`,
      idea: "The list needed one step per neighbour of the node. That is its degree, not the size of the whole graph.",
      text: `All ${lists[u].length} of ${u}'s neighbours were read and none is ${v}. hasEdge returns false. The matrix answered this in one step.`
    }, { states: { [u]: "active", [v]: "compare" } });
  }

  /* neighbours of the busiest node */
  const hub = [...g.nodes].sort((a, b) => lists[b].length - lists[a].length || a.localeCompare(b))[0];
  op = `neighbours(${hub})`;
  const got: string[] = [];
  lists[hub].forEach((x, k) => {
    got.push(x);
    const states: Partial<Record<string, BlockState>> = { [hub]: "active" };
    for (const y of got) states[y] = "found";
    snap({
      kind: "check", op, anchors: [...(k === 0 ? ["nbr.sig"] : []), "nbr.step"], notes: { "nbr.step": `out = [${got.join(", ")}]` },
      title: `${hub} touches ${x}`,
      idea: "Listing neighbours is what a list does best. Every entry it reads is a real neighbour.",
      text: `Entry ${k} of ${hub}'s list is ${x}, so ${x} goes into the answer.`
    }, { states, edges: Object.fromEntries(got.map((y) => [ekey(hub, y, false), "tree" as const])), ptrs: [{ node: idOf(x), label: "x" }] });
  });
  const hubStates: Partial<Record<string, BlockState>> = { [hub]: "active" };
  for (const y of got) hubStates[y] = "found";
  snap({
    kind: "found", op, ret: `[${got.join(", ")}]`, anchors: [...(got.length === 0 ? ["nbr.sig"] : []), "nbr.done", "nbr.mat"],
    notes: { "nbr.done": `return [${got.join(", ")}]`, "nbr.mat": `${g.nodes.length} cells to scan` },
    title: `${hub} has ${got.length} neighbour${got.length === 1 ? "" : "s"}`,
    idea: "The list read only the real neighbours. The matrix has to read the whole row, one cell for every node, to find the same ones.",
    text: `${hub}'s list gave [${got.join(", ")}] in ${got.length} step${got.length === 1 ? "" : "s"}. The matrix row for ${hub} below has ${g.nodes.length} cells, and all of them must be read to find the 1s.`
  }, { states: hubStates, edges: Object.fromEntries(got.map((y) => [ekey(hub, y, false), "tree" as const])), strip: row(hub, Object.fromEntries(got.map((y) => [y, "found" as BlockState]))) });

  op = null;
  const cells = g.nodes.length ** 2, entries = 2 * g.edges.length;
  snap({
    kind: "recap", op: null, anchors: [], notes: {},
    title: "Pick the one that fits the questions",
    idea: "Use a list when the graph is sparse or you walk neighbours. Use a matrix when the graph is dense or you test pairs.",
    text: `This graph has ${g.nodes.length} nodes and ${g.edges.length} edges. The list holds ${entries} entries, two per edge. The matrix holds ${cells} cells whatever the edges. Most graphs in practice are sparse, so most code uses lists.`
  });
  return steps;
}

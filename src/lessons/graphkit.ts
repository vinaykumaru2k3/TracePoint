import type { MemoryView, ParseResult } from "../engine/types";
import { toneOf } from "../engine/types";
import type { GEdge } from "../iso/GraphNodes";
import type { BlockState } from "../iso/IsoBlock";
import type { TNode, TPointer, Tile, TilePointer } from "../iso/TreeNodes";

/** What every graph scene draws: the graph, flags on its nodes, and an optional strip of tiles under it. */
export interface GraphState {
  nodes: TNode[];
  edges: GEdge[];
  ptrs: TPointer[];
  /** Columns and rows the stage frames, fixed for the run. */
  frame: { c0: number; c1: number; rows: number };
  strip?: { name: string; tiles: Tile[]; slots?: number; index?: boolean; labels?: string[]; ptrs?: TilePointer[] };
}

export const G_NODES = 8;
export const G_EDGES = 12;
export const W_MAX = 99;
export const LETTERS = "ABCDEFGH";

export interface WEdge { u: string; v: string; w: number }
export interface GraphInput {
  /** Node letters in letter order. */
  nodes: string[];
  /** Edges in the order typed. For a directed graph, u → v. */
  edges: WEdge[];
  start: string;
  directed: boolean;
}

/** A node's id on the stage: A is 1, B is 2. */
export const idOf = (x: string) => x.charCodeAt(0) - 64;
export const ekey = (u: string, v: string, directed: boolean) => (directed || u < v ? `${u}${v}` : `${v}${u}`);

/**
 * Parse "A-B 4, B-C 1, start A". Nodes are the letters A to H; a lone letter adds a node with no edges.
 * In a directed lesson `A-B`, `A>B` and `A->B` all mean A → B. Weights are read only when `weighted`.
 */
export function parseGraph(text: string, o: { directed?: boolean; weighted?: boolean } = {}): ParseResult<GraphInput> {
  const directed = !!o.directed, weighted = !!o.weighted;
  const items = text.toUpperCase().split(/[,;\n]+/).map((x) => x.trim()).filter(Boolean);
  const nodes = new Set<string>();
  const edges: WEdge[] = [];
  const seen = new Set<string>();
  let start: string | undefined;
  for (const it of items) {
    const st = /^(?:START|FROM)\s+([A-Z])$/.exec(it);
    if (st) { start = st[1]; continue; }
    const lone = /^([A-Z])$/.exec(it);
    const m = /^([A-Z])\s*(?:->|-|>|→)\s*([A-Z])(?:\s+(\S+))?$/.exec(it);
    if (!lone && !m) return { ok: false, error: `Could not read "${it}". Write an edge as ${weighted ? '"A-B 4"' : '"A-B"'}${directed ? ", meaning A points to B" : ""}.` };
    const ends = lone ? [lone[1]] : [m![1], m![2]];
    for (const x of ends) if (!LETTERS.includes(x)) return { ok: false, error: `Nodes are single letters A to ${LETTERS[LETTERS.length - 1]}, so "${x}" is out of range.` };
    for (const x of ends) nodes.add(x);
    if (!m) continue;
    const [, u, v, raw] = m;
    if (u === v) return { ok: false, error: `${u}-${v} is a loop from a node to itself. Graphs here have none.` };
    const k = ekey(u, v, directed);
    if (seen.has(k)) return { ok: false, error: `${directed ? `${u}->${v}` : `${u}-${v}`} appears twice. Give each edge once.` };
    seen.add(k);
    let w = 1;
    if (weighted) {
      if (raw === undefined) return { ok: false, error: `${u}-${v} needs a weight, like "${u}-${v} 4".` };
      if (!/^\d{1,2}$/.test(raw)) return { ok: false, error: `Weights are whole numbers from 0 to ${W_MAX}. Negative weights break the shortest-path rule this lesson relies on.` };
      w = Number(raw);
    }
    edges.push({ u, v, w });
  }
  if (!nodes.size) return { ok: false, error: `Type at least one edge, like ${weighted ? '"A-B 4"' : '"A-B"'}.` };
  if (nodes.size > G_NODES) return { ok: false, error: `Keep it to ${G_NODES} nodes or fewer so the graph fits on the stage.` };
  if (edges.length > G_EDGES) return { ok: false, error: `Keep it to ${G_EDGES} edges or fewer so the steps stay readable.` };
  const list = [...nodes].sort();
  if (start !== undefined && !nodes.has(start)) return { ok: false, error: `The start ${start} is not in the graph.` };
  return { ok: true, input: { nodes: list, edges, start: start ?? list[0], directed } };
}

/** Each node's adjacency list, built the way the code builds it: edges in the order typed, appended to both ends when undirected. */
export function adjacency(g: GraphInput): Record<string, { to: string; w: number }[]> {
  const adj: Record<string, { to: string; w: number }[]> = Object.fromEntries(g.nodes.map((x) => [x, []]));
  for (const e of g.edges) {
    adj[e.u].push({ to: e.v, w: e.w });
    if (!g.directed) adj[e.v].push({ to: e.u, w: e.w });
  }
  return adj;
}

/**
 * Nodes on an ellipse, in letter order clockwise from the top left. No three points of an ellipse are in
 * a line, so an edge never runs through a node it does not touch.
 */
export function ringLayout(ids: string[]): { pos: Record<string, { col: number; row: number }>; frame: GraphState["frame"] } {
  const n = ids.length, rx = 4, ry = 1.6;
  const raw = ids.map((_, k) => {
    if (n === 1) return { col: 0, row: 0 };
    const t = -Math.PI / 2 - Math.PI / n + (2 * Math.PI * k) / n;
    return { col: rx * Math.cos(t), row: ry * Math.sin(t) };
  });
  const c0 = Math.min(...raw.map((p) => p.col)), r0 = Math.min(...raw.map((p) => p.row));
  const pos: Record<string, { col: number; row: number }> = {};
  ids.forEach((x, k) => { pos[x] = { col: raw[k].col - c0, row: raw[k].row - r0 }; });
  const c1 = Math.max(...Object.values(pos).map((p) => p.col)), rows = Math.max(...Object.values(pos).map((p) => p.row));
  return { pos, frame: { c0: 0, c1: Math.max(c1, 0), rows } };
}

export interface ViewOpts {
  states?: Partial<Record<string, BlockState>>;
  tags?: Partial<Record<string, string>>;
  /** Edge states keyed by `ekey`. */
  edges?: Partial<Record<string, GEdge["state"]>>;
  weighted?: boolean;
}

/** The drawn graph for one step: every node at its fixed place, every edge with its state. */
export function graphView(g: GraphInput, pos: Record<string, { col: number; row: number }>, o: ViewOpts = {}): { nodes: TNode[]; edges: GEdge[] } {
  const nodes: TNode[] = g.nodes.map((x) => ({ id: idOf(x), v: x, col: pos[x].col, depth: pos[x].row, state: o.states?.[x], tag: o.tags?.[x] }));
  const edges: GEdge[] = g.edges.map((e) => ({
    from: idOf(e.u), to: idOf(e.v), dir: g.directed, w: o.weighted ? e.w : undefined,
    state: o.edges?.[ekey(e.u, e.v, g.directed)] ?? "default"
  }));
  return { nodes, edges };
}

/** Each node's adjacency list as one memory cell, read back from the drawn edges. */
export function adjMemory(title: string, s: GraphState, note: string): MemoryView {
  const byId = new Map(s.nodes.map((n) => [n.id, n]));
  const out = new Map<number, string[]>(s.nodes.map((n) => [n.id, []]));
  const entry = (to: number, w: GEdge["w"]) => `${byId.get(to)!.v}${w !== undefined ? `:${w}` : ""}`;
  for (const e of s.edges) {
    out.get(e.from)!.push(entry(e.to, e.w));
    if (!e.dir) out.get(e.to)!.push(entry(e.from, e.w));
  }
  return {
    title, note,
    cells: [...s.nodes].sort((a, b) => a.id - b.id).map((n) => {
      const tone = toneOf(n.state);
      return {
        v: `[${out.get(n.id)!.join(", ")}]`, tag: `adj[${n.v}]`,
        live: n.state !== "stale", act: n.state === "active" || tone !== undefined, tone,
        marks: s.ptrs.filter((p) => p.node === n.id).map((p) => p.label)
      };
    })
  };
}

/** Distance shown on a tag or a tile: a number, or ∞ before any path is known. */
export const distText = (d: number) => (Number.isFinite(d) ? String(d) : "∞");

/**
 * Union-find trees, roots on the top row in letter order and each child one row below its parent.
 * Leaves sit 2 columns apart; a parent is centred over its children.
 */
export function forestLayout(ids: string[], parent: Record<string, string>): Record<string, { col: number; row: number }> {
  const kids: Record<string, string[]> = Object.fromEntries(ids.map((x) => [x, []]));
  for (const x of ids) if (parent[x] !== x) kids[parent[x]].push(x);
  const pos: Record<string, { col: number; row: number }> = {};
  let next = 0;
  const place = (x: string, row: number): number => {
    if (!kids[x].length) { pos[x] = { col: next, row }; next += 2; return pos[x].col; }
    const cs = kids[x].map((c) => place(c, row + 1));
    pos[x] = { col: (cs[0] + cs[cs.length - 1]) / 2, row };
    return pos[x].col;
  };
  for (const r of ids.filter((x) => parent[x] === x)) place(r, 0);
  return pos;
}

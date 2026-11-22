import type { MemoryView, ParseResult } from "../engine/types";
import { toneOf } from "../engine/types";
import type { BlockState } from "../iso/IsoBlock";
import type { TEdge, TNode, TPointer, Tile, TilePointer } from "../iso/TreeNodes";
import { parseNums, type NumsInput } from "./parseOps";

/** What every tree scene draws: the tree, flags on its nodes, and an optional strip of tiles under it. */
export interface TreeState {
  nodes: TNode[];
  edges: TEdge[];
  ptrs: TPointer[];
  /** Columns and depth the stage frames, fixed for the run so the camera never has to chase the tree. */
  frame: { c0: number; c1: number; depth: number };
  strip?: { name: string; tiles: Tile[]; slots?: number; index?: boolean; ptrs?: TilePointer[] };
}

/* ---------- binary search trees ---------- */

export interface BNode { id: number; v: number; left: BNode | null; right: BNode | null; h: number }

export const height = (n: BNode | null): number => (n ? n.h : 0);
export const fix = (n: BNode) => { n.h = 1 + Math.max(height(n.left), height(n.right)); };
/** Balance factor: left height minus right height. */
export const bf = (n: BNode) => height(n.left) - height(n.right);

export function inorder(n: BNode | null, out: BNode[] = []): BNode[] {
  if (n) { inorder(n.left, out); out.push(n); inorder(n.right, out); }
  return out;
}

/** A deep copy, so a step's tree never changes when the live one does. */
export const clone = (n: BNode | null): BNode | null => (n ? { ...n, left: clone(n.left), right: clone(n.right) } : null);

/** Plain BST insert with no steps, for building a fixed shape. Duplicates are skipped. */
export function insertPlain(root: BNode | null, n: BNode): BNode {
  if (!root) return n;
  let cur = root;
  for (;;) {
    if (n.v === cur.v) return root;
    const side = n.v < cur.v ? "left" : "right";
    const next = cur[side];
    if (!next) { cur[side] = n; break; }
    cur = next;
  }
  fixAll(root);
  return root;
}
export function fixAll(n: BNode | null): number {
  if (!n) return 0;
  n.h = 1 + Math.max(fixAll(n.left), fixAll(n.right));
  return n.h;
}

/** Tree layout: a node's column is its place in sorted order, its depth is its level. */
export function bstLayout(
  root: BNode | null,
  o: { states?: Partial<Record<number, BlockState>>; tag?: (n: BNode) => string | undefined; active?: Set<string>; dim?: Set<number> } = {}
): { nodes: TNode[]; edges: TEdge[] } {
  const col = new Map(inorder(root).map((n, i) => [n.id, i]));
  const nodes: TNode[] = [], edges: TEdge[] = [];
  const walk = (n: BNode | null, depth: number) => {
    if (!n) return;
    nodes.push({ id: n.id, v: n.v, col: col.get(n.id)!, depth, state: o.states?.[n.id], tag: o.tag?.(n) });
    for (const c of [n.left, n.right]) {
      if (!c) continue;
      const key = `${n.id}-${c.id}`;
      edges.push({ from: n.id, to: c.id, state: o.dim?.has(c.id) ? "dim" : o.active?.has(key) ? "active" : "default" });
      walk(c, depth + 1);
    }
  };
  walk(root, 0);
  return { nodes, edges };
}

export const depthOf = (root: BNode | null): number => Math.max(height(root) - 1, 0);

/** Distinct whole numbers for a tree's keys. */
export function parseKeys(text: string, maxLen: number, minLen = 1): ParseResult<NumsInput> {
  const r = parseNums(text, { minLen, maxLen });
  if (!r.ok) return r;
  const seen = new Set<number>();
  for (const v of r.input.nums) {
    if (seen.has(v)) return { ok: false, error: `${v} appears twice. A search tree keeps each key once, so use distinct numbers.` };
    seen.add(v);
  }
  return r;
}

/** Node objects in memory, one cell per node in creation order. Links come from the drawn edges, so it works from a step's state alone. */
export function nodeMemory(title: string, s: TreeState, note: string, extra?: (n: TNode) => string): MemoryView {
  const byId = new Map(s.nodes.map((n) => [n.id, n]));
  const kids = (n: TNode, side: "left" | "right") => {
    const e = s.edges.find((x) => x.from === n.id && (side === "left" ? byId.get(x.to)!.col < n.col : byId.get(x.to)!.col > n.col));
    return e ? `@${e.to}` : "null";
  };
  return {
    title, note,
    cells: [...s.nodes].sort((a, b) => a.id - b.id).map((n) => {
      const tone = toneOf(n.state);
      return {
        v: `${n.v} L${kids(n, "left")} R${kids(n, "right")}${extra ? ` ${extra(n)}` : ""}`, tag: `@${n.id}`,
        live: n.state !== "stale", act: n.state === "active" || tone !== undefined, tone,
        marks: s.ptrs.filter((p) => p.node === n.id).map((p) => p.label)
      };
    })
  };
}

/* ---------- complete trees (heaps) ---------- */

/** Level of array index i in a complete binary tree. */
export const levelOf = (i: number) => Math.floor(Math.log2(i + 1));
/** Column of array index i in a complete tree `levels` deep: the leaves sit two columns apart, parents centred above. */
export function levelCols(i: number, levels: number): number {
  const d = levelOf(i), p = i - (2 ** d - 1);
  return (2 * p + 1) * 2 ** (levels - 1 - d) - 1;
}
export const levelsFor = (size: number) => Math.max(1, levelOf(Math.max(size, 1) - 1) + 1);

/** An item in a heap array. The id stays with the value, so a swap slides the two nodes past each other. */
export interface HItem { id: number; v: number }

/**
 * The tree drawn by a heap array `a[0..size)`: index i sits at level levelOf(i), its parent is (i - 1) / 2.
 * `states` and `activeEdges` are keyed by array index (an edge by its child's index).
 */
export function heapView(
  a: HItem[], size: number, levels: number,
  states: Partial<Record<number, BlockState>> = {}, activeEdges: Set<number> = new Set()
): { nodes: TNode[]; edges: TEdge[] } {
  const nodes: TNode[] = [], edges: TEdge[] = [];
  for (let i = 0; i < size; i++) {
    nodes.push({ id: a[i].id, v: a[i].v, col: levelCols(i, levels), depth: levelOf(i), state: states[i] });
    if (i > 0) edges.push({ from: a[(i - 1) >> 1].id, to: a[i].id, state: activeEdges.has(i) ? "active" : "default" });
  }
  return { nodes, edges };
}

/** Frame for a complete tree `levels` deep. */
export const heapFrame = (levels: number) => ({ c0: 0, c1: 2 ** levels - 2, depth: levels - 1 });

/* ---------- n-ary trees (tries) ---------- */

export interface KNode { id: number; ch: string; kids: KNode[]; end: boolean; word?: string }

/** Tidy layout for an n-ary tree: leaves two columns apart in child order, each parent centred over its children. */
export function leafCols(root: KNode): Map<number, { col: number; depth: number }> {
  const out = new Map<number, { col: number; depth: number }>();
  let next = 0;
  const walk = (n: KNode, depth: number): number => {
    if (!n.kids.length) { const c = next; next += 2; out.set(n.id, { col: c, depth }); return c; }
    const cs = n.kids.map((k) => walk(k, depth + 1));
    const c = (cs[0] + cs[cs.length - 1]) / 2;
    out.set(n.id, { col: c, depth });
    return c;
  };
  walk(root, 0);
  return out;
}

/** Find a child by letter, or add one in alphabetical order (the order a 26-slot array keeps them in). */
export function trieChild(n: KNode, ch: string): KNode | undefined {
  return n.kids.find((k) => k.ch === ch);
}
export function trieAdd(n: KNode, ch: string, id: number): KNode {
  const k: KNode = { id, ch, kids: [], end: false };
  n.kids.push(k);
  n.kids.sort((a, b) => a.ch.localeCompare(b.ch));
  return k;
}
/** Nodes a trie needs for these words, root included. */
export function trieSize(words: string[]): number {
  const seen = new Set<string>([""]);
  for (const w of words) for (let k = 1; k <= w.length; k++) seen.add(w.slice(0, k));
  return seen.size;
}

/** Draw a trie: each node shows its letter, and a node that ends a word carries the word as its tag. */
export function trieLayout(
  root: KNode, o: { states?: Partial<Record<number, BlockState>>; active?: Set<string> } = {}
): { nodes: TNode[]; edges: TEdge[]; c1: number; depth: number } {
  const pos = leafCols(root);
  const nodes: TNode[] = [], edges: TEdge[] = [];
  let c1 = 0, depth = 0;
  const walk = (n: KNode) => {
    const p = pos.get(n.id)!;
    c1 = Math.max(c1, p.col);
    depth = Math.max(depth, p.depth);
    nodes.push({ id: n.id, v: n.ch, col: p.col, depth: p.depth, state: o.states?.[n.id], tag: n.end ? n.word : undefined });
    for (const k of n.kids) {
      edges.push({ from: n.id, to: k.id, state: o.active?.has(`${n.id}-${k.id}`) ? "active" : "default" });
      walk(k);
    }
  };
  walk(root);
  return { nodes, edges, c1, depth };
}

/** Trie nodes in memory: each one's letter, the letters of its children, and its end-of-word flag. */
export function trieMemory(title: string, s: TreeState, note: string): MemoryView {
  const byId = new Map(s.nodes.map((n) => [n.id, n]));
  return {
    title, note,
    cells: [...s.nodes].sort((a, b) => a.id - b.id).map((n) => {
      const kids = s.edges.filter((e) => e.from === n.id).map((e) => byId.get(e.to)!.v).join("");
      const tone = toneOf(n.state);
      return {
        v: `${n.v === "" ? "root" : n.v} kids[${kids}]${n.tag ? " end" : ""}`, tag: `@${n.id}`,
        live: true, act: n.state === "active" || tone !== undefined, tone,
        marks: s.ptrs.filter((p) => p.node === n.id).map((p) => p.label)
      };
    })
  };
}

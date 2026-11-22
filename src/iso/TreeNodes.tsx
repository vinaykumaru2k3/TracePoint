import type { CSSProperties } from "react";
import { IsoBlock, type BlockState } from "./IsoBlock";
import IsoPointer from "./IsoPointer";
import { U, poly, project } from "./project";

/** Side of a node slab in grid units, its height in px, and the screen spacing of columns and levels. */
export const TN_A = 1.5;
export const TN_H = 18;
export const COL = 64;
export const ROW = 86;

export interface TNode {
  id: number;
  v: number | string;
  /** Screen column; fractions are fine. Nodes at the same depth sit at least 2 columns apart. */
  col: number;
  depth: number;
  state?: BlockState;
  /** Small text under the node, such as a balance factor or the word that ends here. */
  tag?: string;
}
export interface TEdge { from: number; to: number; state?: "default" | "active" | "dim" }
export interface TPointer { node: number | null; label: string; dim?: boolean }

/** Grid point (x, y) whose floor projection lands on screen point (X, Y): the inverse of `project`. */
export const gridOf = (X: number, Y: number): [number, number] => [X / (2 * U) + Y / U, Y / U - X / (2 * U)];
/** Grid centre of a node. */
export const centre = (col: number, depth: number) => gridOf(col * COL, depth * ROW);

const f1 = (v: number) => v.toFixed(1);
const at = (X: number, Y: number): CSSProperties => ({ transform: `translate(${X}px, ${Y}px)` });

/**
 * A rooted tree drawn top-down on the floor. Each node is a square slab placed by screen column and depth,
 * so the tree reads like a diagram while the slabs keep the isometric look. Nodes are keyed by id, so when a
 * rotation or a swap moves them they slide, and their edges follow.
 */
export default function TreeNodes({ nodes, edges, pointers = [] }: { nodes: TNode[]; edges: TEdge[]; pointers?: TPointer[] }) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const lines = edges.flatMap((e) => {
    const a = byId.get(e.from), b = byId.get(e.to);
    if (!a || !b) return [];
    const [ax, ay] = centre(a.col, a.depth), [bx, by] = centre(b.col, b.depth);
    const p = project(ax, ay, 0), q = project(bx, by, TN_H);
    return [{ key: `${e.from}-${e.to}`, d: `M ${f1(p.x)} ${f1(p.y)} L ${f1(q.x)} ${f1(q.y)}`, state: e.state ?? "default" }];
  });

  const merged = new Map<number, TPointer>();
  for (const p of pointers) {
    if (p.node === null || !byId.has(p.node)) continue;
    const had = merged.get(p.node);
    merged.set(p.node, had ? { ...had, label: `${had.label} · ${p.label}`, dim: had.dim && p.dim } : p);
  }

  /* Parents first: they sit higher on screen, so a child may overlap its parent, never the other way round. */
  const order = [...nodes].sort((a, b) => a.depth - b.depth || a.col - b.col);
  return (
    <g>
      {lines.map((l) => <path key={l.key} className={`edge e-${l.state}`} d={l.d} style={{ d: `path("${l.d}")` } as CSSProperties} />)}
      {order.map((n) => {
        const [cx, cy] = centre(n.col, n.depth);
        return <IsoBlock key={n.id} x={cx - TN_A / 2} y={cy - TN_A / 2} w={TN_A} d={TN_A} h={TN_H} state={n.state ?? "default"} label={n.v} />;
      })}
      {/* A tag is a small badge under the slab. Diagonal edges leave the slab clear of it; a straight-down edge
          runs behind it like a label on a wire. */}
      {order.map((n) => {
        if (!n.tag) return null;
        const w = Math.max(28, n.tag.length * 7 + 12);
        return (
          <g key={`t${n.id}`} className="tree-tag" style={at(n.col * COL, n.depth * ROW + TN_A * U * 0.5 + 13)}>
            <rect x={-w / 2} y={-9} width={w} height={18} rx={4} />
            <text textAnchor="middle" dominantBaseline="central">{n.tag}</text>
          </g>
        );
      })}
      {[...merged.entries()].map(([id, p]) => {
        const n = byId.get(id)!;
        const [cx, cy] = centre(n.col, n.depth);
        return <IsoPointer key={p.label} x={cx} y={cy} z={TN_H} label={p.label} dim={p.dim} />;
      })}
    </g>
  );
}

/** Screen points that frame a tree spanning columns `c0..c1` and `depth` levels below the root, as grid points for fitBox(). */
export function treeFrame(c0: number, c1: number, depth: number): [number, number, number][] {
  const L = c0 * COL - TN_A * U - 8, R = c1 * COL + TN_A * U + 8, B = Math.max(depth, 0) * ROW + TN_A * U * 0.5 + 26;
  return [gridOf(L, -70), gridOf(R, -70), gridOf(L, B), gridOf(R, B)].map(([x, y]) => [x, y, 0]);
}

/* ---------- a horizontal strip of tiles: the output of a traversal, or the array behind a heap ---------- */

export const TILE_A = 1.05;
export const TILE_H = 12;
/** Screen distance between tile centres. */
export const TILE_STEP = 84;

export interface Tile { v: number | string | null; state?: BlockState }
export interface TilePointer { at: number; label: string; dim?: boolean }

interface StripProps {
  tiles: Tile[];
  /** Screen point of the first tile's centre. */
  X: number;
  Y: number;
  /** Tiles the footprint covers, so a growing strip keeps one floor. */
  slots?: number;
  name?: string;
  index?: boolean;
  pointers?: TilePointer[];
}

/** Tiles in one screen-level row, left to right, each a small square slab. Empty slots are not drawn; the footprint shows them. */
export function Strip({ tiles, X, Y, slots, name, index = false, pointers = [] }: StripProps) {
  const n = Math.max(slots ?? 0, tiles.length, 1);
  const half = TILE_A * U, pad = 10;
  const xL = X - half - pad, xR = X + (n - 1) * TILE_STEP + half + pad, hy = half / 2 + pad / 2;
  const foot = poly([{ x: xL, y: Y }, { x: X, y: Y - hy }, { x: X + (n - 1) * TILE_STEP, y: Y - hy }, { x: xR, y: Y }, { x: X + (n - 1) * TILE_STEP, y: Y + hy }, { x: X, y: Y + hy }]);
  const cell = (i: number) => gridOf(X + i * TILE_STEP, Y);
  const merged = new Map<number, TilePointer>();
  for (const p of pointers) {
    const had = merged.get(p.at);
    merged.set(p.at, had ? { at: p.at, label: `${had.label} · ${p.label}`, dim: had.dim && p.dim } : p);
  }
  return (
    <g>
      <polygon className="foot" points={foot} />
      {name && <text className="row-name" x={xL - 8} y={Y} textAnchor="end" dominantBaseline="central">{name}</text>}
      {tiles.map((t, i) => {
        if (t.v === null) return null;
        const [gx, gy] = cell(i);
        return <IsoBlock key={i} x={gx - TILE_A / 2} y={gy - TILE_A / 2} w={TILE_A} d={TILE_A} h={TILE_H} state={t.state ?? "default"} label={t.v} />;
      })}
      {index && Array.from({ length: n }, (_, i) => (
        <text key={`i${i}`} className="plate-index" x={X + i * TILE_STEP} y={Y + half / 2 + 18} textAnchor="middle">{`[${i}]`}</text>
      ))}
      {[...merged.values()].map((p) => {
        const [gx, gy] = cell(p.at);
        return <IsoPointer key={`p${p.label}`} x={gx} y={gy} z={tiles[p.at]?.v != null ? TILE_H : 0} label={p.label} dim={p.dim} />;
      })}
    </g>
  );
}

/** Grid points that frame a strip of `n` tiles starting at screen point (X, Y), with room for flags and the name. */
export function stripFrame(n: number, X: number, Y: number, name = 0): [number, number, number][] {
  const half = TILE_A * U;
  const L = X - half - 18 - name * 8, R = X + (Math.max(n, 1) - 1) * TILE_STEP + half + 12;
  return [gridOf(L, Y - 70), gridOf(R, Y - 70), gridOf(L, Y + half / 2 + 30), gridOf(R, Y + half / 2 + 30)].map(([x, y]) => [x, y, 0]);
}

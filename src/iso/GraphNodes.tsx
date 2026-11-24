import type { CSSProperties } from "react";
import { IsoBlock } from "./IsoBlock";
import IsoPointer from "./IsoPointer";
import { U, project } from "./project";
import { COL, ROW, TN_A, TN_H, centre, type TNode, type TPointer } from "./TreeNodes";

/**
 * A graph edge. `tree` marks an edge the algorithm keeps: a BFS tree edge, a shortest-path edge, an MST edge.
 * `dir` draws an arrowhead where the edge meets `to`; `w` puts a weight badge at its midpoint.
 */
export interface GEdge {
  from: number;
  to: number;
  state?: "default" | "active" | "dim" | "tree";
  w?: number | string;
  dir?: boolean;
}

const f1 = (v: number) => v.toFixed(1);
const at = (X: number, Y: number): CSSProperties => ({ transform: `translate(${X}px, ${Y}px)` });

/* Silhouette of a slab seen from its mid-height centre: flat sides HW out, points HH up and down. */
const HW = TN_A * U, HH = (TN_A * U) / 2 + TN_H / 2, SIDE = TN_H / 2;
/** Distance from a slab's mid-height centre to the edge of its outline, along unit direction (ux, uy). */
function reach(ux: number, uy: number): number {
  const ax = Math.abs(ux), ay = Math.abs(uy);
  const side = ax > 1e-6 ? HW / ax : Infinity;
  const slope = (1 + SIDE / (HH - SIDE)) / (ax / HW + ay / (HH - SIDE));
  return Math.min(side, slope);
}

/**
 * A graph on the floor. Nodes are the tree slabs, placed by screen column and row (`TNode.depth` is the row).
 * Edges run centre to centre at mid-slab height, so the slabs cover their ends. A directed edge stops at the
 * outline of its target and ends in an arrowhead; a weighted one carries a badge at its midpoint.
 */
export default function GraphNodes({ nodes, edges, pointers = [] }: { nodes: TNode[]; edges: GEdge[]; pointers?: TPointer[] }) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const lines = edges.flatMap((e) => {
    const a = byId.get(e.from), b = byId.get(e.to);
    if (!a || !b) return [];
    const [ax, ay] = centre(a.col, a.depth), [bx, by] = centre(b.col, b.depth);
    const p = project(ax, ay, TN_H / 2), q = project(bx, by, TN_H / 2);
    const dx = q.x - p.x, dy = q.y - p.y, len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    let end = q, head: string | null = null;
    if (e.dir) {
      const r = reach(ux, uy) + 3;
      const tip = { x: q.x - ux * r, y: q.y - uy * r };
      const base = { x: tip.x - ux * 10, y: tip.y - uy * 10 };
      head = `M ${f1(tip.x)} ${f1(tip.y)} L ${f1(base.x - uy * 5)} ${f1(base.y + ux * 5)} L ${f1(base.x + uy * 5)} ${f1(base.y - ux * 5)} Z`;
      end = base;
    }
    const d = `M ${f1(p.x)} ${f1(p.y)} L ${f1(end.x)} ${f1(end.y)}`;
    return [{ key: `${e.from}-${e.to}`, d, head, state: e.state ?? "default", w: e.w, mid: { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 } }];
  });

  const merged = new Map<number, TPointer>();
  for (const p of pointers) {
    if (p.node === null || !byId.has(p.node)) continue;
    const had = merged.get(p.node);
    merged.set(p.node, had ? { ...had, label: `${had.label} · ${p.label}`, dim: had.dim && p.dim } : p);
  }

  /* Higher rows first, so a slab lower on screen overlaps the one above it, never the other way round. */
  const order = [...nodes].sort((a, b) => a.depth - b.depth || a.col - b.col);
  return (
    <g>
      {lines.map((l) => (
        <g key={l.key} className={`e-${l.state}`}>
          <path className={`edge e-${l.state}`} d={l.d} style={{ d: `path("${l.d}")` } as CSSProperties} />
          {l.head && <path className="arrow-head" d={l.head} />}
        </g>
      ))}
      {order.map((n) => {
        const [cx, cy] = centre(n.col, n.depth);
        return <IsoBlock key={n.id} x={cx - TN_A / 2} y={cy - TN_A / 2} w={TN_A} d={TN_A} h={TN_H} state={n.state ?? "default"} label={n.v} />;
      })}
      {/* Weight badges go over the slabs: an edge's midpoint is always clear of its own two ends. */}
      {lines.map((l) => {
        if (l.w === undefined) return null;
        const t = String(l.w), w = Math.max(22, t.length * 7 + 10);
        return (
          <g key={`w${l.key}`} className={`edge-w e-${l.state}`} style={at(l.mid.x, l.mid.y)}>
            <g className="tag-body">
              <rect x={-w / 2} y={-8} width={w} height={16} rx={8} />
              <text textAnchor="middle" dominantBaseline="central">{t}</text>
            </g>
          </g>
        );
      })}
      {order.map((n) => {
        if (!n.tag) return null;
        const w = Math.max(28, n.tag.length * 7 + 12);
        return (
          <g key={`t${n.id}`} className="tree-tag" style={at(n.col * COL, n.depth * ROW + TN_A * U * 0.5 + 13)}>
            <g className="tag-body">
              <rect x={-w / 2} y={-9} width={w} height={18} rx={4} />
              <text textAnchor="middle" dominantBaseline="central">{n.tag}</text>
            </g>
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

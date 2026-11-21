import type { BlockState } from "./IsoBlock";
import IsoPointer from "./IsoPointer";
import { U, poly, project, type Pt } from "./project";

export const NODE_H = 22;

/**
 * Nodes sit in one straight screen row: slot k lives at grid (k*S, -k*S), so neighbours line up
 * left to right instead of running down the diagonal. Each node is a square slab, so its left and
 * right corners are level and the arrows between them are horizontal.
 */
const geo = (double?: boolean) => {
  const a = double ? 2.8 : 2.4;
  return { a, S: a + 0.75, field: 0.8 };
};

export interface NodeSpec {
  id: number;
  v: number | string;
  /** Position in the row. Fractions are fine. */
  slot: number;
  /** Lift in pixels, e.g. a node that is being linked in or cut out. */
  z?: number;
  state?: BlockState;
}
export interface LinkSpec { from: number; to: number | null; kind?: "next" | "prev"; state?: "default" | "active" | "dim" }
export interface NodePointer { node: number | null; label: string; dim?: boolean }

interface Props {
  nodes: NodeSpec[];
  links: LinkSpec[];
  pointers?: NodePointer[];
  /** Doubly linked nodes have a prev field on the left and a second, lower arrow lane. */
  double?: boolean;
}

const NULL_GAP = 0.9 * U;
const PREV_Z = 0.35;

function Node({ n, double }: { n: NodeSpec; double?: boolean }) {
  const { a, S, field } = geo(double);
  const h = NODE_H;
  const o = project(n.slot * S, -n.slot * S, n.z ?? 0);
  const top = [project(0, 0, h), project(a, 0, h), project(a, a, h), project(0, a, h)];
  const left = [project(0, a, h), project(a, a, h), project(a, a, 0), project(0, a, 0)];
  const right = [project(a, 0, h), project(a, a, h), project(a, a, 0), project(a, 0, 0)];
  const divs = double ? [field, a - field] : [a - field];
  const dots = double ? [[0.4, a - 0.4], [a - 0.4, 0.4]] : [[a - 0.4, 0.4]];
  const v0 = double ? field : 0;
  const c = project((v0 + a - field) / 2, a / 2, h);
  return (
    <g className={`box node s-${n.state ?? "default"}`} style={{ transform: `translate(${o.x}px, ${o.y}px)` }}>
      <polygon className="f-left" points={poly(left)} />
      <polygon className="f-right" points={poly(right)} />
      <polygon className="f-top" points={poly(top)} />
      {divs.map((x) => { const p = project(x, 0, h), q = project(x, a, h); return <line key={x} className="node-div" x1={p.x} y1={p.y} x2={q.x} y2={q.y} />; })}
      {dots.map(([x, y]) => { const p = project(x, y, h); return <circle key={x} className="node-dot" cx={p.x} cy={p.y} r={3} />; })}
      <text className="box-label" x={c.x} y={c.y} textAnchor="middle" dominantBaseline="central">{n.v}</text>
    </g>
  );
}

/** Screen point of a spot on a node, in node-local grid units. */
const pt = (n: NodeSpec, S: number, x: number, y: number, z: number) => project(n.slot * S + x, -n.slot * S + y, (n.z ?? 0) + z);
const f1 = (v: number) => v.toFixed(1);

/** Linked nodes in a row with next (and prev) arrows, null ends, and flags such as head, tail, cur, slow and fast. */
export default function LinkedNodes({ nodes, links, pointers = [], double }: Props) {
  const { a, S } = geo(double);
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const nulls: { p: Pt; left: boolean }[] = [];

  const edges = links.flatMap((l) => {
    const f = byId.get(l.from);
    if (!f) return [];
    const kind = l.kind ?? "next";
    const t = l.to === null ? null : byId.get(l.to) ?? null;
    let d: string;
    if (kind === "next") {
      const s = pt(f, S, a - 0.4, 0.4, NODE_H);
      if (!t) {
        const e = { x: pt(f, S, a, 0, NODE_H).x + NULL_GAP, y: s.y };
        nulls.push({ p: e, left: false });
        d = `M ${f1(s.x)} ${f1(s.y)} L ${f1(e.x)} ${f1(e.y)}`;
      } else if (t.slot <= f.slot) {
        // A link back down the row (a cycle): arch over the flags and land on the target's top.
        const e = pt(t, S, a / 2, 0, NODE_H);
        const lift = 150 + Math.abs(s.x - e.x) * 0.04;
        d = `M ${f1(s.x)} ${f1(s.y)} C ${f1(s.x + 50)} ${f1(s.y - lift)} ${f1(e.x)} ${f1(e.y - lift)} ${f1(e.x)} ${f1(e.y - 3)}`;
      } else {
        const e = pt(t, S, 0, a, NODE_H);
        d = `M ${f1(s.x)} ${f1(s.y)} L ${f1(e.x)} ${f1(e.y)}`;
      }
    } else {
      const z = NODE_H * PREV_Z;
      const s = pt(f, S, 0, a, z);
      const e = t ? pt(t, S, a, 0, z) : { x: s.x - NULL_GAP, y: s.y };
      if (!t) nulls.push({ p: e, left: true });
      d = `M ${f1(s.x)} ${f1(s.y)} L ${f1(e.x)} ${f1(e.y)}`;
    }
    return [{ key: `${l.from}-${kind}`, d, state: l.state ?? "default" }];
  });

  const merged = new Map<string, NodePointer & { key: string }>();
  for (const p of pointers) {
    const k = String(p.node);
    const had = merged.get(k);
    merged.set(k, had ? { ...had, label: `${had.label} · ${p.label}`, dim: had.dim && p.dim } : { ...p, key: p.label });
  }

  const row = nodes.filter((n) => !n.z);
  const foot = row.length > 0 && (() => {
    const lo = Math.min(...row.map((n) => n.slot)), hi = Math.max(...row.map((n) => n.slot)), p = 0.35;
    const [x0, y0, xL, yL] = [lo * S, -lo * S, hi * S, -hi * S];
    return poly([
      project(x0 - p, y0 + a + p), project(x0 - p, y0 - p), project(xL - p, yL - p),
      project(xL + a + p, yL - p), project(xL + a + p, yL + a + p), project(x0 + a + p, y0 + a + p)
    ]);
  })();

  return (
    <g>
      <defs>
        <marker id="tp-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 1 L 9 5 L 0 9 z" className="arrow-head" />
        </marker>
      </defs>
      {foot && <polygon className="foot" points={foot} />}
      {nodes.map((n) => <g key={n.id} className="enter"><Node n={n} double={double} /></g>)}
      {edges.map((e) => <path key={e.key} className={`edge e-${e.state}`} d={e.d} markerEnd="url(#tp-arrow)" />)}
      {nulls.map(({ p, left }, i) => (
        <text key={i} className="null-tag" x={p.x + (left ? -5 : 5)} y={p.y} textAnchor={left ? "end" : "start"} dominantBaseline="central">null</text>
      ))}
      {[...merged.values()].map((p) => {
        const n = p.node === null ? null : byId.get(p.node);
        if (!n) return null;
        return <IsoPointer key={p.key} x={n.slot * S + 0.15} y={-n.slot * S + 0.15} z={(n.z ?? 0) + NODE_H} label={p.label} dim={p.dim} />;
      })}
    </g>
  );
}

/**
 * A constant viewBox for a row of up to `count` nodes, with room for null tags, flags,
 * a lifted node (`lift` px) and, for cycles, the arch of a back link.
 */
export function listView(count: number, opts: { double?: boolean; lift?: number; arch?: boolean } = {}): string {
  const { a, S } = geo(opts.double);
  const pad = 16;
  const minX = -a * U - (opts.double ? NULL_GAP + 44 : 8) - pad;
  const maxX = 2 * (count - 1) * S * U + a * U + NULL_GAP + 44 + pad;
  const flagTop = -NODE_H - (opts.lift ?? 0) - 48;
  const minY = Math.min(flagTop, opts.arch ? -NODE_H - 82 : flagTop) - pad;
  const maxY = a * U + 0.5 * U + pad;
  return `${Math.round(minX)} ${Math.round(minY)} ${Math.round(maxX - minX)} ${Math.round(maxY - minY)}`;
}

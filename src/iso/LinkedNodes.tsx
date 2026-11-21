import type { BlockState } from "./IsoBlock";
import IsoPointer from "./IsoPointer";
import { poly, project, type Pt } from "./project";

export const NODE_H = 20;
/** Grid distance between neighbouring nodes. */
export const NODE_SPAN = 4.6;

export interface NodeSpec {
  id: number;
  v: number | string;
  x: number;
  y: number;
  /** Lift in pixels, e.g. a node that is being linked in. */
  z?: number;
  state?: BlockState;
}
export interface LinkSpec { from: number; to: number | null; kind?: "next" | "prev"; state?: "default" | "active" | "dim" }
export interface NodePointer { node: number | null; label: string; dim?: boolean }

interface Props {
  nodes: NodeSpec[];
  links: LinkSpec[];
  pointers?: NodePointer[];
  /** Doubly linked nodes have a prev slot on the left. */
  double?: boolean;
}

const W = (double?: boolean) => (double ? 4 : 3);

/** A node slab: value in the middle, a dot for each pointer field. Moves with a CSS transform. */
function Node({ n, double }: { n: NodeSpec; double?: boolean }) {
  const w = W(double), d = 2, h = NODE_H;
  const o = project(n.x, n.y, n.z ?? 0);
  const top = [project(0, 0, h), project(w, 0, h), project(w, d, h), project(0, d, h)];
  const left = [project(0, d, h), project(w, d, h), project(w, d, 0), project(0, d, 0)];
  const right = [project(w, 0, h), project(w, d, h), project(w, d, 0), project(w, 0, 0)];
  const div = (x: number) => [project(x, 0, h), project(x, d, h)];
  const v0 = double ? 1 : 0;
  const c = project(v0 + 1, d / 2, h);
  const dots = double ? [0.5, w - 0.5] : [w - 0.5];
  const divs = double ? [1, w - 1] : [w - 1];
  return (
    <g className={`box node s-${n.state ?? "default"}`} style={{ transform: `translate(${o.x}px, ${o.y}px)` }}>
      <polygon className="f-left" points={poly(left)} />
      <polygon className="f-right" points={poly(right)} />
      <polygon className="f-top" points={poly(top)} />
      {divs.map((x) => { const [a, b] = div(x); return <line key={x} className="node-div" x1={a.x} y1={a.y} x2={b.x} y2={b.y} />; })}
      {dots.map((x) => { const p = project(x, d / 2, h); return <circle key={x} className="node-dot" cx={p.x} cy={p.y} r={3} />; })}
      <text className="box-label" x={c.x} y={c.y} textAnchor="middle" dominantBaseline="central">{n.v}</text>
    </g>
  );
}

const at = (n: NodeSpec, x: number, y: number) => project(n.x + x, n.y + y, (n.z ?? 0) + NODE_H);

/** Arrow path between two points. A backward link curves up and over the nodes. */
function path(a: Pt, b: Pt, back: boolean) {
  if (!back) return `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} L ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
  const lift = 70 + Math.abs(a.x - b.x) * 0.12;
  return `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} C ${a.x + 30} ${a.y - lift} ${b.x} ${b.y - lift} ${b.x.toFixed(1)} ${(b.y - 2).toFixed(1)}`;
}

/** Linked nodes with pointer arrows, null ends, and flags such as head, tail, prev, cur, slow and fast. */
export default function LinkedNodes({ nodes, links, pointers = [], double }: Props) {
  const w = W(double);
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const nulls: Pt[] = [];

  const edges = links.flatMap((l) => {
    const f = byId.get(l.from);
    if (!f) return [];
    const kind = l.kind ?? "next";
    const ly = double ? (kind === "next" ? 0.7 : 1.3) : 1;
    const out = kind === "next" ? at(f, w - 0.5, ly) : at(f, 0.5, ly);
    const t = l.to === null ? null : byId.get(l.to);
    let end: Pt, back = false;
    if (t) {
      end = kind === "next" ? at(t, 0, ly) : at(t, w, ly);
      back = kind === "next" ? t.x <= f.x : t.x >= f.x;
      if (back && kind === "next") end = at(t, w / 2 - 0.4, 0);
    } else {
      end = kind === "next" ? at(f, w + 1.1, ly) : at(f, -1.1, ly);
      nulls.push(kind === "next" ? at(f, w + 1.5, ly) : at(f, -1.5, ly));
    }
    return [{ key: `${l.from}-${kind}`, d: path(out, end, back), state: l.state ?? "default" }];
  });

  const merged = new Map<string, NodePointer & { key: string }>();
  for (const p of pointers) {
    const k = String(p.node);
    const had = merged.get(k);
    merged.set(k, had ? { ...had, label: `${had.label} · ${p.label}`, dim: had.dim && p.dim } : { ...p, key: p.label });
  }

  return (
    <g>
      <defs>
        <marker id="tp-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 1 L 9 5 L 0 9 z" className="arrow-head" />
        </marker>
      </defs>
      {nodes.length > 0 && (() => {
        const xs = nodes.map((n) => n.x), ys = nodes.map((n) => n.y);
        const x0 = Math.min(...xs) - 0.4, x1 = Math.max(...xs) + w + 0.4, y0 = Math.min(...ys) - 0.4, y1 = Math.max(...ys) + 2.4;
        return <polygon className="foot" points={poly([project(x0, y0), project(x1, y0), project(x1, y1), project(x0, y1)])} />;
      })()}
      {nodes.map((n) => <g key={n.id} className="enter"><Node n={n} double={double} /></g>)}
      {edges.map((e) => <path key={e.key} className={`edge e-${e.state}`} d={e.d} markerEnd="url(#tp-arrow)" />)}
      {nulls.map((p, i) => <text key={i} className="null-tag" x={p.x + 4} y={p.y} dominantBaseline="central">null</text>)}
      {[...merged.values()].map((p) => {
        const n = p.node === null ? null : byId.get(p.node);
        if (!n) return null;
        return <IsoPointer key={p.key} x={n.x + (double ? 2 : 1)} y={n.y + 1} z={(n.z ?? 0) + NODE_H} label={p.label} dim={p.dim} />;
      })}
    </g>
  );
}

/** Frame points for `count` nodes in a row starting at x0, with room for flags and a lifted node. */
export function listFrame(count: number, double = false, x0 = 0): [number, number, number][] {
  const right = x0 + (count - 1) * NODE_SPAN + W(double) + 2;
  return [[x0 - 1.8, 0, 110], [right, 0, 110], [x0 - 1.8, 2.4, -24], [right, 2.4, -24], [right, -2, 60]];
}

import { IsoBlock, type BlockState } from "./IsoBlock";
import IsoPointer from "./IsoPointer";
import { poly, project } from "./project";

export interface Cell { v: string | number | null; state?: BlockState }
export interface RowPointer { at: number; label: string; dim?: boolean }

export const CELL_STEP = 2.4;
export const CELL_H = 16;

interface Props {
  cells: Cell[];
  /** Grid offset of the row. Rows run along x; stack extra rows with a larger y. */
  x0?: number;
  y?: number;
  step?: number;
  h?: number;
  pointers?: RowPointer[];
  /** Inclusive cell range drawn as a bright green window under the cells. */
  window?: [number, number] | null;
  /** Index tags under each cell. A function lets a row print its own labels. */
  index?: boolean | ((i: number) => string);
  /** Short name printed to the left of the row, like "a" or "prefix". */
  name?: string;
  /** Total cells the footprint should cover, so a growing row keeps one floor. */
  slots?: number;
}

/** An array as a row of short slabs on a green footprint, with index tags, pointer flags and an optional window. */
export default function CellRow({ cells, x0 = 0, y = 0, step = CELL_STEP, h = CELL_H, pointers = [], window = null, index = true, name, slots }: Props) {
  const n = Math.max(slots ?? 0, cells.length, 1);
  const cx = (i: number) => x0 + i * step;
  const span = (a: number, b: number, pad: number) =>
    poly([project(cx(a) - pad, y - pad, 0), project(cx(b) + 2 + pad, y - pad, 0), project(cx(b) + 2 + pad, y + 2 + pad, 0), project(cx(a) - pad, y + 2 + pad, 0)]);

  const merged = new Map<number, RowPointer>();
  for (const p of pointers) {
    const had = merged.get(p.at);
    merged.set(p.at, had ? { at: p.at, label: `${had.label} · ${p.label}`, dim: had.dim && p.dim } : p);
  }
  const tag = typeof index === "function" ? index : (i: number) => `[${i}]`;
  const nameAt = project(x0 - 0.5, y + 1, 0);

  return (
    <g>
      <polygon className="foot" points={span(0, n - 1, 0.4)} />
      {window && window[1] >= window[0] && <polygon className="win" points={span(window[0], window[1], 0.2)} />}
      {name && <text className="row-name" x={nameAt.x - 8} y={nameAt.y} textAnchor="end" dominantBaseline="central">{name}</text>}
      {cells.map((c, i) => (
        <IsoBlock key={i} x={cx(i)} y={y} w={2} d={2} h={h} state={c.v === null ? "stale" : c.state ?? "default"} label={c.v ?? ""} />
      ))}
      {index !== false && cells.map((_, i) => {
        const t = project(cx(i) + 1, y + 2, 0);
        return <text key={i} className="plate-index" x={t.x} y={t.y + 16} textAnchor="middle">{tag(i)}</text>;
      })}
      {[...merged.values()].map((p) => (
        <IsoPointer key={p.label} x={cx(p.at) + 1} y={y + 1} z={p.at >= 0 && p.at < cells.length ? h : 0} label={p.label} dim={p.dim} />
      ))}
    </g>
  );
}

/** Grid points that frame a row of `n` cells with room for flags, for fitBox(). */
export function rowFrame(n: number, y = 0, step = CELL_STEP, x0 = 0): [number, number, number][] {
  const right = x0 + (n - 1) * step + 2;
  return [[x0 - 0.6, y, 90], [right, y, 90], [x0, y + 2.4, -24], [right + 0.4, y + 2.4, -24], [x0 - 1.6, y + 1, 0]];
}

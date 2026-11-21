import { IsoBlock, IsoPlate, type BlockState } from "./IsoBlock";
import IsoPointer from "./IsoPointer";
import { poly, project } from "./project";

export const BUCKET_STEP = 2.6;
const CHAIN_STEP = 2.7, EH = 16;

export interface Entry { id: number; v: number | string; state?: BlockState }

interface Props {
  /** One chain per bucket, front of the chain first. */
  chains: Entry[][];
  /** Bucket the step is working in, drawn as visited. */
  active?: number | null;
  /** Flag over one entry, e.g. "cur", by entry id; or over a bucket by index when the chain is empty. */
  flag?: { id?: number; bucket?: number; label: string } | null;
}

const ex = (b: number) => b * BUCKET_STEP;
const ey = (j: number) => 2.7 + j * CHAIN_STEP;

/** A bucket array along the back, each bucket's chain running toward the viewer. */
export default function Buckets({ chains, active = null, flag = null }: Props) {
  const n = chains.length;
  const foot = poly([project(-0.4, -0.4), project(ex(n - 1) + 2.4, -0.4), project(ex(n - 1) + 2.4, 2.4), project(-0.4, 2.4)]);
  let flagAt: { x: number; y: number; z: number } | null = null;
  if (flag) {
    if (flag.id !== undefined) {
      chains.forEach((c, b) => c.forEach((e, j) => { if (e.id === flag.id) flagAt = { x: ex(b) + 1, y: ey(j) + 1, z: EH }; }));
    } else if (flag.bucket !== undefined) flagAt = { x: ex(flag.bucket) + 1, y: 1, z: 8 };
  }
  const f = flagAt as { x: number; y: number; z: number } | null;
  return (
    <g>
      <polygon className="foot" points={foot} />
      {chains.map((_, b) => <IsoPlate key={b} x={ex(b)} y={0} w={2} d={2} state={b === active ? "visited" : "default"} />)}
      {/* Bucket numbers sit behind the plates: in front, the first chain node would cover them. */}
      {chains.map((_, b) => {
        const t = project(ex(b) + 1, -0.9, 8);
        return <text key={`i${b}`} className="plate-index" x={t.x} y={t.y - 4} textAnchor="middle">{`[${b}]`}</text>;
      })}
      {chains.map((chain, b) => (
        <g key={b}>
          {chain.map((e, j) => (
            <g key={e.id} className="enter"><IsoBlock x={ex(b)} y={ey(j)} w={2} d={2} h={EH} state={e.state ?? "default"} label={e.v} /></g>
          ))}
          {chain.map((e, j) => {
            const a = j === 0 ? project(ex(b) + 1, 2, 8) : project(ex(b) + 1, ey(j - 1) + 2, EH / 2);
            const t = project(ex(b) + 1, ey(j), EH);
            return <path key={`a${e.id}`} className="edge e-default" d={`M ${a.x} ${a.y} L ${t.x} ${t.y}`} markerEnd="url(#tp-arrow)" />;
          })}
        </g>
      ))}
      {f && <IsoPointer x={f.x} y={f.y} z={f.z} label={flag!.label} />}
      <defs>
        <marker id="tp-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 1 L 9 5 L 0 9 z" className="arrow-head" />
        </marker>
      </defs>
    </g>
  );
}

/** Frame for `n` buckets and chains up to `depth` long. */
export function bucketFrame(n: number, depth: number): [number, number, number][] {
  const right = ex(n - 1) + 2;
  return [[0, 0, 90], [right, 0, 90], [0, ey(depth - 1) + 2.4, -20], [right, ey(depth - 1) + 2.4, -20], [-0.6, ey(depth - 1) + 2, 0]];
}

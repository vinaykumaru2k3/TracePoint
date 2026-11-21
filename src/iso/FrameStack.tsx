import { IsoBlock, IsoPlate, type BlockState } from "./IsoBlock";
import IsoPointer from "./IsoPointer";
import { poly, project } from "./project";

export interface Frame { label: string; state?: BlockState }

export const FRAME_W = 4.4, FRAME_D = 2, FRAME_H = 22, FRAME_GAP = 4, FRAME_FLOOR = 8;
const level = (i: number) => FRAME_FLOOR + i * (FRAME_H + FRAME_GAP);

interface Props {
  frames: Frame[];
  /** Grid offset, so a scene can put the stack beside other pieces. */
  x?: number;
  y?: number;
  /** Flag text next to the top frame, e.g. "running". Omit for no flag. */
  top?: string;
  /** Name printed under the base, like "call stack". */
  name?: string;
}

/** Recursion frames as slabs stacked bottom-up on a base plate. The newest call is on top. */
export default function FrameStack({ frames, x = 0, y = 0, top, name }: Props) {
  const p = 0.3;
  const foot = [project(x - p, y - p, 0), project(x + FRAME_W + p, y - p, 0), project(x + FRAME_W + p, y + FRAME_D + p, 0), project(x - p, y + FRAME_D + p, 0)];
  const tag = project(x + FRAME_W / 2, y + FRAME_D, 0);
  const n = frames.length;
  return (
    <g>
      <polygon className="foot" points={poly(foot)} />
      <IsoPlate x={x} y={y} w={FRAME_W} d={FRAME_D} h={FRAME_FLOOR} />
      {frames.map((f, i) => (
        <IsoBlock key={i} x={x} y={y} z={level(i)} w={FRAME_W} d={FRAME_D} h={FRAME_H} state={f.state ?? "default"} label={f.label} labelOn="front" />
      ))}
      {name && <text className="plate-index" x={tag.x} y={tag.y + 18} textAnchor="middle">{name}</text>}
      {top !== undefined && (
        <IsoPointer x={x + FRAME_W} y={y} z={n ? level(n - 1) + FRAME_H / 2 : FRAME_FLOOR} dir="right" label={top} dim={!n} />
      )}
    </g>
  );
}

/** Grid points that frame a stack of up to `n` frames plus its flag, for fitBox(). */
export function frameStackBox(n: number, x = 0, y = 0): [number, number, number][] {
  const h = level(Math.max(n, 1)) + 8;
  return [
    [x - 0.6, y - 0.6, 0], [x + FRAME_W + 0.6, y + FRAME_D + 0.6, -24], [x - 0.6, y - 0.6, h],
    [x + FRAME_W + 4.2, y, h - FRAME_H], [x + FRAME_W + 4.2, y, 0]
  ];
}

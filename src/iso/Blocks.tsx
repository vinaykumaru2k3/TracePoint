import type { CSSProperties } from "react";
import { IsoBlock, type BlockState } from "./IsoBlock";
import { useGhosts } from "./useGhosts";

export interface BlockSpec {
  id: number;
  v: number;
  x: number;
  y: number;
  z?: number;
  w: number;
  d: number;
  h: number;
  state?: BlockState;
  labelOn?: "top" | "front";
}

interface Props {
  blocks: BlockSpec[];
  /** Screen-pixel offsets blocks start from when they appear and drift to when they leave. */
  enter: [number, number];
  leave: [number, number];
}

/** Keyed value cubes with enter and leave animations. Draw order follows the array, so list back to front. */
export default function Blocks({ blocks, enter, leave }: Props) {
  const ghosts = useGhosts(blocks);
  const vars = { "--ex": `${enter[0]}px`, "--ey": `${enter[1]}px`, "--lx": `${leave[0]}px`, "--ly": `${leave[1]}px` } as CSSProperties;
  return (
    <g style={vars}>
      {blocks.map((b) => (
        <g key={b.id} className="enter"><IsoBlock {...b} label={b.v} /></g>
      ))}
      {ghosts.map((b) => (
        <g key={`g${b.seq}`} className="leaving"><IsoBlock {...b} state="default" label={b.v} /></g>
      ))}
    </g>
  );
}

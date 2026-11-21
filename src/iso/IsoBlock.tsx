import { poly, project } from "./project";

export type BlockState = "default" | "active" | "found" | "compare" | "swap" | "visited" | "stale";

export interface BoxProps {
  /** Back corner on the grid, in grid units. */
  x: number;
  y: number;
  /** Lift in pixels. */
  z?: number;
  /** Footprint in grid units. */
  w: number;
  d: number;
  /** Height in pixels. */
  h: number;
  state?: BlockState;
  label?: string | number;
  /** Where the label sits. Use "front" when blocks stack and would cover each other's top faces. */
  labelOn?: "top" | "front";
  className?: string;
}

/** Three-faced isometric box. The whole group moves with a CSS transform, so position changes animate. */
function Box({ x, y, z = 0, w, d, h, state = "default", label, labelOn = "top", className = "" }: BoxProps) {
  const o = project(x, y, z);
  const top = [project(0, 0, h), project(w, 0, h), project(w, d, h), project(0, d, h)];
  const left = [project(0, d, h), project(w, d, h), project(w, d, 0), project(0, d, 0)];
  const right = [project(w, 0, h), project(w, d, h), project(w, d, 0), project(w, 0, 0)];
  const c = labelOn === "front" ? project(w / 2, d, h / 2) : project(w / 2, d / 2, h);
  return (
    <g className={`box s-${state} ${className}`} style={{ transform: `translate(${o.x}px, ${o.y}px)` }}>
      <polygon className="f-left" points={poly(left)} />
      <polygon className="f-right" points={poly(right)} />
      <polygon className="f-top" points={poly(top)} />
      {label !== undefined && <text className="box-label" x={c.x} y={c.y} textAnchor="middle" dominantBaseline="central">{label}</text>}
    </g>
  );
}

/** A value cube. States: default, active, found, compare, swap, visited, stale. */
export function IsoBlock(props: BoxProps) {
  return <Box {...props} className={`block ${props.className ?? ""}`} />;
}

/** A thin slab: one array slot, with an optional index tag under its front edge. */
export function IsoPlate({ index, ...props }: Omit<BoxProps, "h"> & { h?: number; index?: number | string }) {
  const tag = index !== undefined ? project(props.x + props.w / 2, props.y + props.d, (props.z ?? 0)) : null;
  return (
    <>
      <Box h={8} {...props} className={`plate ${props.className ?? ""}`} />
      {tag && <text className="plate-index" x={tag.x} y={tag.y + 18} textAnchor="middle">{`[${index}]`}</text>}
    </>
  );
}

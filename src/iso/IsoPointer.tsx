import { project } from "./project";

interface Props {
  /** Grid point the flag points at. */
  x: number;
  y: number;
  z?: number;
  label: string;
  /** "up": flag floats above the point. "right": flag sits to the right with a short leader. */
  dir?: "up" | "right";
  dim?: boolean;
}

/** A labelled flag for i, j, lo, mid, hi, top, head and friends. It slides when its point moves. */
export default function IsoPointer({ x, y, z = 0, label, dir = "up", dim }: Props) {
  const p = project(x, y, z);
  const w = Math.max(34, label.length * 9 + 16);
  const cls = `ptr${dim ? " dim" : ""}`;
  if (dir === "right") {
    return (
      <g className={cls} style={{ transform: `translate(${p.x}px, ${p.y}px)` }}>
        <line x1={0} y1={0} x2={18} y2={0} />
        <rect className="pop" x={19.5} y={-8.5} width={w} height={22} rx={6} />
        <rect x={18} y={-11} width={w} height={22} rx={6} />
        <text x={18 + w / 2} y={0} textAnchor="middle" dominantBaseline="central">{label}</text>
      </g>
    );
  }
  return (
    <g className={cls} style={{ transform: `translate(${p.x}px, ${p.y}px)` }}>
      <line x1={0} y1={-22} x2={0} y2={0} />
      <rect className="pop" x={-w / 2 + 1.5} y={-41.5} width={w} height={22} rx={6} />
      <rect x={-w / 2} y={-44} width={w} height={22} rx={6} />
      <text x={0} y={-33} textAnchor="middle" dominantBaseline="central">{label}</text>
    </g>
  );
}

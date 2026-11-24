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
      <g className={cls} data-at={`${p.x} ${p.y}`} style={{ transform: `translate(${p.x}px, ${p.y}px)` }}>
        <g className="ptr-flag">
          <line x1={0} y1={0} x2={18} y2={0} />
          <rect x={18} y={-11} width={w} height={22} rx={6} />
          <text x={18 + w / 2} y={0} textAnchor="middle" dominantBaseline="central">{label}</text>
        </g>
      </g>
    );
  }
  return (
    <g className={cls} data-at={`${p.x} ${p.y}`} style={{ transform: `translate(${p.x}px, ${p.y}px)` }}>
      {/* The stem stops short of the point, so it never strikes through the value it names. The flag
          (stem, tip, rect, text) grows about the point when the camera zooms out (.ptr-flag). */}
      <g className="ptr-flag">
        <line x1={0} y1={-22} x2={0} y2={-14} />
        <path className="ptr-tip" d="M -3.5 -14 L 3.5 -14 L 0 -9.5 Z" />
        <rect x={-w / 2} y={-44} width={w} height={22} rx={6} />
        <text x={0} y={-33} textAnchor="middle" dominantBaseline="central">{label}</text>
      </g>
    </g>
  );
}

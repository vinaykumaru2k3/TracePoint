import type { ReactNode } from "react";

interface Props {
  /** From fitBox(). Keep it constant for a lesson so the frame never jumps between steps. */
  viewBox: string;
  label: string;
  children: ReactNode;
}

/** The drawing surface: an SVG that scales to fill its box and keeps the isometric proportions. */
export default function IsoScene({ viewBox, label, children }: Props) {
  return (
    <svg className="iso" viewBox={viewBox} preserveAspectRatio="xMidYMid meet" role="img" aria-label={label}>
      {children}
    </svg>
  );
}

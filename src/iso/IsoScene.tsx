import { createContext, useContext, type ReactNode } from "react";

/**
 * A measured frame for the whole run (see SceneFit). When present it replaces the scene's own
 * viewBox, which is sized for the largest input the lesson accepts, not the run on screen.
 */
export const FitContext = createContext<string | null>(null);

interface Props {
  /** From fitBox(). Keep it constant for a lesson so the frame never jumps between steps. */
  viewBox: string;
  label: string;
  children: ReactNode;
}

/** The drawing surface: an SVG that scales to fill its box and keeps the isometric proportions. */
export default function IsoScene({ viewBox, label, children }: Props) {
  const fit = useContext(FitContext);
  return (
    <svg className="iso" viewBox={fit ?? viewBox} preserveAspectRatio="xMidYMid meet" role="img" aria-label={label}>
      {children}
    </svg>
  );
}

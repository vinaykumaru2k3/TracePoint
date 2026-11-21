import { createContext, useContext, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { boxString, follow, lerpBox, parseBox, type Box } from "./camera";
import { U } from "./project";

export type { Box } from "./camera";

/**
 * Where the current step's drawing sits (see SceneFit). The scene's camera glides to it: it pans to
 * follow the drawing and zooms out only when the drawing needs more room than the stage has.
 */
export const CameraContext = createContext<Box | null>(null);
/** True inside SceneFit's off-screen copy, which must measure the drawing alone (no grid). */
export const MeasureContext = createContext(false);

/** Never draw bigger than this many pixels per scene unit, so small steps keep the size of big ones. */
const MAX_SCALE = 1.35;
const MS = 650;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const reduced = () => !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

interface Props {
  /** From fitBox(). Used until the run has been measured. */
  viewBox: string;
  label: string;
  children: ReactNode;
}

/** The drawing surface: an SVG with a camera over an endless isometric floor. */
export default function IsoScene({ viewBox, label, children }: Props) {
  const measuring = useContext(MeasureContext);
  const target = useContext(CameraContext);
  const svgRef = useRef<SVGSVGElement>(null);
  const floorRef = useRef<SVGRectElement>(null);
  const shown = useRef<Box | null>(null);
  const aimed = useRef<Box | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const id = useId().replace(/:/g, "");

  useEffect(() => {
    const svg = svgRef.current;
    if (measuring || !svg || typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(svg);
    return () => ro.disconnect();
  }, [measuring]);

  /* Glide from what is on screen now to the new frame; jump when motion is reduced or on first show. */
  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return undefined;
    const to = measuring ? parseBox(viewBox) : follow(aimed.current, target ?? parseBox(viewBox), size.w, size.h, MAX_SCALE);
    aimed.current = to;
    const apply = (b: Box) => {
      shown.current = b;
      svg.setAttribute("viewBox", boxString(b));
      const f = floorRef.current;
      if (f) { f.setAttribute("x", String(b.x)); f.setAttribute("y", String(b.y)); f.setAttribute("width", String(b.w)); f.setAttribute("height", String(b.h)); }
    };
    const from = shown.current;
    if (!from || measuring || reduced()) { apply(to); return undefined; }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / MS);
      apply(lerpBox(from, to, ease(t)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, viewBox, size.w, size.h, measuring]);

  return (
    <svg className="iso" ref={svgRef} preserveAspectRatio="xMidYMid meet" role="img" aria-label={label}>
      {!measuring && (
        <g className="floor" aria-hidden="true">
          <defs>
            {/* One tile of the 2:1 grid in scene units, so the floor pans and zooms with the camera. */}
            <pattern id={`grid-${id}`} width={2 * U} height={U} patternUnits="userSpaceOnUse">
              <circle cx={0} cy={0} r={1.2} />
            </pattern>
            <radialGradient id={`fade-${id}`} cx="0.5" cy="0.55" r="0.62">
              <stop offset="0.45" stopColor="#fff" />
              <stop offset="1" stopColor="#fff" stopOpacity="0.12" />
            </radialGradient>
            <mask id={`mask-${id}`} maskContentUnits="objectBoundingBox">
              <rect width="1" height="1" fill={`url(#fade-${id})`} />
            </mask>
          </defs>
          <rect ref={floorRef} fill={`url(#grid-${id})`} mask={`url(#mask-${id})`} />
        </g>
      )}
      {children}
    </svg>
  );
}

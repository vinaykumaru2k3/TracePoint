import { createContext, useContext, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { aim, boxString, crops, follow, lerpBox, parseBox, roomFor, type Box, type Lens, type Shot } from "./camera";
import { U } from "./project";

export type { Box, Shot } from "./camera";

/**
 * Where the current step's drawing sits (see SceneFit). The scene's camera glides to it: it pans to
 * follow the drawing and zooms out only when the drawing needs more room than the stage has.
 */
export const CameraContext = createContext<Shot | null>(null);

/**
 * How the camera treats a drawing too big to read whole. `lens` unset fits everything (thumbnails,
 * walkthroughs). With a lens the camera reads the step's focus instead, unless the viewer asked for
 * the `whole` drawing. `onCrop` reports whether the lens would leave part of the drawing out, so the
 * stage offers the choice only when it matters.
 */
export interface Zoom { lens?: Lens; whole?: boolean; onCrop?(cropped: boolean): void }
export const ZoomContext = createContext<Zoom>({});
/** True inside SceneFit's off-screen copy, which must measure the drawing alone (no grid). */
export const MeasureContext = createContext(false);

/** Never draw bigger than this many pixels per scene unit, so small steps keep the size of big ones. */
const MAX_SCALE = 1.35;
const MS = 650;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const reduced = () => !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Which sides of the frame have more drawing beyond them. */
interface Edges { l: boolean; r: boolean; t: boolean; b: boolean }
const edges = (v: Box, s: Box, slack = 4): Edges =>
  ({ l: s.x < v.x - slack, r: s.x + s.w > v.x + v.w + slack, t: s.y < v.y - slack, b: s.y + s.h > v.y + v.h + slack });

/**
 * A small chevron on each side where the drawing goes on past the frame, so a close-up never
 * passes for the whole picture. Drawn in scene units at the aimed frame; they fade in once the glide
 * has landed.
 */
function CropCues({ view: v, cut, px }: { view: Box; cut: Edges; px: number }) {
  const a = 6 * px, inset = 10 * px; // in screen pixels, whatever the zoom
  const cx = v.x + v.w / 2, cy = v.y + v.h / 2;
  const marks: [string, string][] = [];
  if (cut.l) marks.push(["l", `M ${v.x + inset + a} ${cy - a * 1.4} L ${v.x + inset} ${cy} L ${v.x + inset + a} ${cy + a * 1.4}`]);
  if (cut.r) marks.push(["r", `M ${v.x + v.w - inset - a} ${cy - a * 1.4} L ${v.x + v.w - inset} ${cy} L ${v.x + v.w - inset - a} ${cy + a * 1.4}`]);
  if (cut.t) marks.push(["t", `M ${cx - a * 1.4} ${v.y + inset + a} L ${cx} ${v.y + inset} L ${cx + a * 1.4} ${v.y + inset + a}`]);
  if (cut.b) marks.push(["b", `M ${cx - a * 1.4} ${v.y + v.h - inset - a} L ${cx} ${v.y + v.h - inset} L ${cx + a * 1.4} ${v.y + v.h - inset - a}`]);
  return <g className="crop-cues" aria-hidden="true">{marks.map(([key, d]) => <path key={key} d={d} />)}</g>;
}

interface Props {
  /** From fitBox(). Used until the run has been measured. */
  viewBox: string;
  label: string;
  children: ReactNode;
}

/**
 * Hide every pointer whose point lies outside `view`: once the camera crops, a flag whose cell or tile
 * is off-stage would otherwise hang over empty floor or another part of the drawing. Reads the
 * pointer's own point (`data-at`), not its live position, which may still be sliding.
 */
export function hideOffstage(svg: Element, view: Box | null) {
  for (const el of svg.querySelectorAll<SVGGElement>(".ptr[data-at]")) {
    const [x, y] = (el.getAttribute("data-at") ?? "").split(" ").map(Number);
    const out = !!view && !(x >= view.x && x <= view.x + view.w && y >= view.y && y <= view.y + view.h);
    if (out) el.setAttribute("data-off", ""); else el.removeAttribute("data-off");
  }
}

/** Scene units per screen pixel when `box` is fitted into a w x h element (preserveAspectRatio meet: the tighter axis rules). */
export function sceneScale(box: Box, w: number, h: number): number {
  if (!(w > 0) || !(h > 0) || !(box.w > 0) || !(box.h > 0)) return 1;
  return Math.max(box.w / w, box.h / h);
}

/** The drawing surface: an SVG with a camera over an endless isometric floor. */
export default function IsoScene({ viewBox, label, children }: Props) {
  const measuring = useContext(MeasureContext);
  const target = useContext(CameraContext);
  const { lens, whole, onCrop } = useContext(ZoomContext);
  const [cut, setCut] = useState<Edges | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const floorRef = useRef<SVGRectElement>(null);
  const shown = useRef<Box | null>(null);
  const aimed = useRef<Box | null>(null);
  const [px, setPx] = useState(1);
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
    const shot = target ?? parseBox(viewBox);
    const lensOn = whole ? undefined : lens;
    let to = measuring ? parseBox(viewBox) : follow(aimed.current, shot, size.w, size.h, MAX_SCALE, lensOn);
    /* On the stage, labels grow when the camera zooms out (--px); leave them room inside the frame.
       Room and scale feed each other, so settle them in a few rounds. */
    for (let k = 0; k < 4 && !measuring && lens; k++) {
      const next = follow(aimed.current, roomFor(shot, sceneScale(to, size.w, size.h)), size.w, size.h, MAX_SCALE, lensOn);
      if (Math.abs(next.w - to.w) < 0.5 && Math.abs(next.h - to.h) < 0.5) { to = next; break; }
      to = next;
    }
    aimed.current = to;
    /* Only the lesson stage (a lens) keeps scene text at its screen size; walkthroughs and thumbnails
       are deliberate small overviews, so their text shrinks with the drawing. */
    setPx(measuring || !lens ? 1 : sceneScale(to, size.w, size.h));
    if (!measuring) {
      hideOffstage(svg, size.w > 0 ? to : null);
      const c = size.w > 0 && crops(to, shot);
      setCut(c ? edges(to, shot) : null);
      if (onCrop && lens) onCrop(size.w > 0 && crops(aim(shot, size.w, size.h, MAX_SCALE, lens), shot));
    }
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
  }, [target, viewBox, size.w, size.h, measuring, lens, whole, onCrop]);

  return (
    <svg className="iso" ref={svgRef} style={lens && !measuring ? ({ "--px": px } as CSSProperties) : undefined} preserveAspectRatio="xMidYMid meet" role="img" aria-label={label}>
      {!measuring && (
        <g className="floor" aria-hidden="true">
          <defs>
            {/* One tile of the 2:1 grid in scene units, so the floor pans and zooms with the camera. */}
            <pattern id={`grid-${id}`} x={-U / 2} y={-U / 4} width={2 * U} height={U} patternUnits="userSpaceOnUse">
              <circle cx={U / 2} cy={U / 4} r={1.6} />
              <circle cx={(3 * U) / 2} cy={(3 * U) / 4} r={1.6} />
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
      {cut && aimed.current && <CropCues key={boxString(aimed.current)} view={aimed.current} cut={cut} px={aimed.current.w / size.w} />}
    </svg>
  );
}

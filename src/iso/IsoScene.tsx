import { createContext, useContext, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { aim, boxString, crops, flagBox, follow, lerpBox, parseBox, readPin, roomFor, type Box, type Lens, type Shot } from "./camera";
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
/** Which sides of the frame `v` the drawing `s` runs past. Pass the drawing itself, not the room
    `roomFor` leaves for grown flags, or a cue would mark a cut where nothing is cut. */
export const cropEdges = (v: Box, s: Box, slack = 4): Edges =>
  ({ l: s.x < v.x - slack, r: s.x + s.w > v.x + v.w + slack, t: s.y < v.y - slack, b: s.y + s.h > v.y + v.h + slack });

/** One crop cue: its side, and where its pill meets the view's edge (the middle of its outer side), in scene units. */
export interface CueSpot { key: "l" | "r" | "t" | "b"; x: number; y: number }

/** A cue's pill in screen pixels: its length along the edge, its depth, and its gap from the edge. */
const PILL_L = 28, PILL_S = 16, PILL_GAP = 4;

/**
 * Where each crop cue sits: at the middle of its cut edge, a small gap in from the very edge of the
 * view `v`. The cue draws on its own pill, so it reads over plates as well as floor.
 */
export function cueSpots(v: Box, cut: Edges, px: number): CueSpot[] {
  const g = PILL_GAP * px, cx = v.x + v.w / 2, cy = v.y + v.h / 2;
  const spots: CueSpot[] = [];
  if (cut.l) spots.push({ key: "l", x: v.x + g, y: cy });
  if (cut.r) spots.push({ key: "r", x: v.x + v.w - g, y: cy });
  if (cut.t) spots.push({ key: "t", x: cx, y: v.y + g });
  if (cut.b) spots.push({ key: "b", x: cx, y: v.y + v.h - g });
  return spots;
}

/**
 * A small chevron on a `--surface` pill on each side where the drawing goes on past the frame, so a
 * close-up never passes for the whole picture. Drawn in scene units at the aimed frame, sized in
 * screen pixels (`px`); they fade in once the glide has landed. A mark, not a control.
 */
export function CropCues({ view, cut, px }: { view: Box; cut: Edges; px: number }) {
  const L = PILL_L * px, S = PILL_S * px, a = 6 * px, k = 8 * px, inset = (S - a) / 2;
  const cue = ({ key, x, y }: CueSpot) => {
    const across = key === "t" || key === "b";
    /* The pill grows inward from the edge point; the chevron's tip points at the edge. */
    const rx = across ? x - L / 2 : key === "l" ? x : x - S;
    const ry = across ? (key === "t" ? y : y - S) : y - L / 2;
    const d = key === "l" ? `M ${x + inset + a} ${y - k} L ${x + inset} ${y} L ${x + inset + a} ${y + k}`
      : key === "r" ? `M ${x - inset - a} ${y - k} L ${x - inset} ${y} L ${x - inset - a} ${y + k}`
        : key === "t" ? `M ${x - k} ${y + inset + a} L ${x} ${y + inset} L ${x + k} ${y + inset + a}`
          : `M ${x - k} ${y - inset - a} L ${x} ${y - inset} L ${x + k} ${y - inset - a}`;
    return (
      <g key={key} className="crop-cue">
        <rect className="crop-pill" x={rx} y={ry} width={across ? L : S} height={across ? S : L} rx={S / 2} />
        <path d={d} />
      </g>
    );
  };
  return <g className="crop-cues" aria-hidden="true">{cueSpots(view, cut, px).map(cue)}</g>;
}

interface Props {
  /** From fitBox(). Used until the run has been measured. */
  viewBox: string;
  label: string;
  children: ReactNode;
}

/**
 * Hide every pointer whose point lies outside `view`, or whose flag would be clipped by its edge:
 * once the camera crops, a flag whose cell or tile is off-stage would otherwise hang over empty floor
 * or another part of the drawing. Reads the pointer's own point (`data-at`), not its live position,
 * which may still be sliding, and how far its flag reaches (`data-reach`: "up 44 25" (reach, half-width) or "right 52",
 * at 1x; the flag grows by `px` on the stage). Both axes count (`flagBox`, the same box the camera
 * keeps in view for lit pointers): an up flag's sides against the left and right edges, and a right
 * flag's height against the top and bottom.
 */
export function hideOffstage(svg: Element, view: Box | null, px = 1) {
  for (const el of svg.querySelectorAll<SVGGElement>(".ptr[data-at]")) {
    const pin = readPin(el.getAttribute("data-at"), el.getAttribute("data-reach"));
    const f = pin && flagBox(pin, px);
    const out = !!view && !!pin && !!f && (!(pin.x >= view.x && pin.x <= view.x + view.w && pin.y >= view.y && pin.y <= view.y + view.h)
      || (pin.reach > 0 && (f.x < view.x || f.y < view.y || f.x + f.w > view.x + view.w || f.y + f.h > view.y + view.h)));
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
    const px = measuring || !lens ? 1 : sceneScale(to, size.w, size.h);
    setPx(px);
    if (!measuring) {
      /* The room-padded drawing is for fitting only; crop cues and Show all judge the drawing itself,
         so a step whose room is cut but whose drawing is whole shows no cue. */
      hideOffstage(svg, size.w > 0 ? to : null, px);
      const c = size.w > 0 && crops(to, shot);
      setCut(c ? cropEdges(to, shot) : null);
      if (onCrop && lens) onCrop(size.w > 0 && crops(aim(roomFor(shot, px), size.w, size.h, MAX_SCALE, lens), shot));
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

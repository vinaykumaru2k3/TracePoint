import { memo, useLayoutEffect, useRef, useState, type ComponentType } from "react";
import { MeasureContext, type Box, type Shot } from "./IsoScene";

interface Props<S> {
  steps: S[];
  Scene: ComponentType<{ step: S }>;
  /** Called with each step's drawn bounds and focus (same order as steps), or null if nothing could be measured. */
  onFit(shots: Shot[] | null): void;
  pad?: number;
}

/**
 * Draws every step of the run once, off-screen and without motion, and reports where each step's
 * drawing sits. The visible scene's camera moves between these boxes as the steps play.
 */
/** What a step is about: lit cells, pointers, active edges and windows, and the table headers that
    name the lit cell (`.grid-head.on`); failing those, what it found. */
const FOCUS = ".s-active, .s-compare, .s-swap, .e-active, .ptr:not(.dim), .win, .grid-head.on";
/** Lit table headers: the focus then starts at a header row, which the camera keeps (`Shot.headed`). */
const HEAD = ".grid-head.on";
const FOUND = ".s-found";

/** The side strip under a drawing (a queue, a heap array, the chosen items); see `Shot.core`. */
const STRIP = ".strip";

/**
 * The elements a focus is measured from: the lit ones, else (only when nothing is lit) the found
 * ones. `core` leaves out the strip; when everything lit is in the strip, the core is empty, so the
 * camera keeps the full focus rather than framing found cells that are not the step's subject.
 */
export function pickFocus<E>(focus: E[], found: E[], inStrip: (el: E) => boolean, core: boolean): E[] {
  if (focus.length) return core ? focus.filter((el) => !inStrip(el)) : focus;
  return core ? found.filter((el) => !inStrip(el)) : found;
}

/** The union of the elements' on-screen boxes, in the svg's own units, grown by `pad`. */
function boxOf(svg: SVGSVGElement, els: Element[], pad: number): Box | undefined {
  const m = svg.getScreenCTM()?.inverse();
  if (!m) return undefined;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const el of els) {
    const r = el.getBoundingClientRect();
    if (!r.width && !r.height) continue;
    for (const [px, py] of [[r.left, r.top], [r.right, r.bottom]]) {
      const p = new DOMPoint(px, py).matrixTransform(m);
      x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y);
    }
  }
  return x1 > x0 ? { x: x0 - pad, y: y0 - pad, w: x1 - x0 + 2 * pad, h: y1 - y0 + 2 * pad } : undefined;
}

/** The focus box (see FOCUS); `core` leaves out the strip and `heads: false` the lit headers. */
function focusOf(svg: SVGSVGElement, pad: number, core = false, heads = true): Box | undefined {
  const lit = [...svg.querySelectorAll(FOCUS)].filter((el) => heads || !el.matches(HEAD));
  return boxOf(svg, pickFocus(lit, [...svg.querySelectorAll(FOUND)], (el) => !!el.closest(STRIP), core), pad);
}

/** The scenes to draw: all of them until the fit pass has measured, none after. */
export function fitScenes<S>(steps: S[], measured: boolean): S[] {
  return measured ? [] : steps;
}

function SceneFit<S>({ steps, Scene, onFit, pad = 18 }: Props<S>) {
  const ref = useRef<HTMLDivElement>(null);
  /* Measured for one (steps, Scene) pair; a new pair draws again, with no stale flag in between. */
  const [done, setDone] = useState<{ steps: S[]; Scene: unknown } | null>(null);
  const measured = done !== null && done.steps === steps && done.Scene === Scene;

  useLayoutEffect(() => {
    const measure = () => {
      const host = ref.current;
      if (!host) return;
      /* The root svg's box is in its own user units and takes in the children's transforms. */
      const svgs = [...host.querySelectorAll<SVGSVGElement>("svg.iso")];
      if (svgs.length !== steps.length) { onFit(null); return; }
      const raw = svgs.map((svg) => {
        const b = svg.getBBox();
        if (!(b.width || b.height)) return null;
        const shot: Shot = { x: b.x - pad, y: b.y - pad, w: b.width + 2 * pad, h: b.height + 2 * pad, focus: focusOf(svg, pad), flags: !!svg.querySelector(".ptr") };
        if (svg.querySelector(STRIP)) { shot.core = focusOf(svg, pad, true); shot.strip = boxOf(svg, [...svg.querySelectorAll(STRIP)], 4); }
        if (svg.querySelector(HEAD)) { shot.headed = true; shot.lit = focusOf(svg, pad, true, false); }
        return shot;
      });
      /* An empty step keeps the frame of the step before it (or after it, at the start). */
      const firstGood = raw.find(Boolean) ?? null;
      if (!firstGood) { onFit(null); return; }
      let prev: Shot = firstGood;
      onFit(raw.map((b) => (prev = b ?? prev)));
    };
    measure();
    /* Labels change size once the web font arrives; after that the scenes are let go. */
    let live = true;
    const finish = () => setDone({ steps, Scene });
    if (document.fonts?.ready) document.fonts.ready.then(() => { if (live) { measure(); finish(); } });
    else finish();
    return () => { live = false; };
  }, [steps, Scene, onFit, pad]);

  return (
    <div className="scene-fit" ref={ref} aria-hidden="true" {...({ inert: "" } as object)}>
      <MeasureContext.Provider value={true}>
        {fitScenes(steps, measured).map((s, i) => <Scene key={i} step={s} />)}
      </MeasureContext.Provider>
    </div>
  );
}

/* Props are stable (steps, Scene, setBoxes), so a step change or a hover does not redraw every step off-screen. */
export default memo(SceneFit) as typeof SceneFit;

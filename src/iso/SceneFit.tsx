import { useLayoutEffect, useRef, type ComponentType } from "react";
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
/** What a step is about: lit cells, pointers, active edges and windows; failing those, what it found. */
const FOCUS = ".s-active, .s-compare, .s-swap, .e-active, .ptr:not(.dim), .win";
const FOUND = ".s-found";

/** The union of the matching elements' on-screen boxes, in the svg's own units. */
function focusOf(svg: SVGSVGElement, pad: number): Box | undefined {
  const m = svg.getScreenCTM()?.inverse();
  if (!m) return undefined;
  let els = [...svg.querySelectorAll(FOCUS)];
  if (!els.length) els = [...svg.querySelectorAll(FOUND)];
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

export default function SceneFit<S>({ steps, Scene, onFit, pad = 18 }: Props<S>) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const host = ref.current;
      if (!host) return;
      /* The root svg's box is in its own user units and takes in the children's transforms. */
      const svgs = [...host.querySelectorAll<SVGSVGElement>("svg.iso")];
      if (svgs.length !== steps.length) { onFit(null); return; }
      const raw = svgs.map((svg) => {
        const b = svg.getBBox();
        return b.width || b.height ? { x: b.x - pad, y: b.y - pad, w: b.width + 2 * pad, h: b.height + 2 * pad, focus: focusOf(svg, pad) } as Shot : null;
      });
      /* An empty step keeps the frame of the step before it (or after it, at the start). */
      const firstGood = raw.find(Boolean) ?? null;
      if (!firstGood) { onFit(null); return; }
      let prev: Shot = firstGood;
      onFit(raw.map((b) => (prev = b ?? prev)));
    };
    measure();
    /* Labels change size once the web font arrives. */
    let live = true;
    document.fonts?.ready.then(() => { if (live) measure(); });
    return () => { live = false; };
  }, [steps, Scene, onFit, pad]);

  return (
    <div className="scene-fit" ref={ref} aria-hidden="true" {...({ inert: "" } as object)}>
      <MeasureContext.Provider value={true}>
        {steps.map((s, i) => <Scene key={i} step={s} />)}
      </MeasureContext.Provider>
    </div>
  );
}

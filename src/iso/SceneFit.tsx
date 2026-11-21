import { useLayoutEffect, useRef, type ComponentType } from "react";
import { MeasureContext, type Box } from "./IsoScene";

interface Props<S> {
  steps: S[];
  Scene: ComponentType<{ step: S }>;
  /** Called with each step's drawn bounds (same order as steps), or null if nothing could be measured. */
  onFit(boxes: Box[] | null): void;
  pad?: number;
}

/**
 * Draws every step of the run once, off-screen and without motion, and reports where each step's
 * drawing sits. The visible scene's camera moves between these boxes as the steps play.
 */
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
        return b.width || b.height ? { x: b.x - pad, y: b.y - pad, w: b.width + 2 * pad, h: b.height + 2 * pad } : null;
      });
      /* An empty step keeps the frame of the step before it (or after it, at the start). */
      const firstGood = raw.find(Boolean) ?? null;
      if (!firstGood) { onFit(null); return; }
      let prev = firstGood;
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

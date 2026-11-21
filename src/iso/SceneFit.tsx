import { useLayoutEffect, useRef, type ComponentType } from "react";

interface Props<S> {
  steps: S[];
  Scene: ComponentType<{ step: S }>;
  /** Called with one viewBox that holds every step of the run, or null if nothing could be measured. */
  onFit(viewBox: string | null): void;
  pad?: number;
}

/**
 * Draws every step of the run once, off-screen and without motion, and reports the union of their
 * drawn bounds. The visible scene then uses that one frame for the whole run: tight around what is
 * really on screen, and still constant from step to step.
 */
export default function SceneFit<S>({ steps, Scene, onFit, pad = 14 }: Props<S>) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const host = ref.current;
      if (!host) return;
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      /* The root svg's box is in its own user units and takes in the children's transforms. */
      host.querySelectorAll<SVGSVGElement>("svg.iso").forEach((svg) => {
        const b = svg.getBBox();
        if (!b.width && !b.height) return;
        x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y);
        x1 = Math.max(x1, b.x + b.width); y1 = Math.max(y1, b.y + b.height);
      });
      onFit(Number.isFinite(x0) ? [x0 - pad, y0 - pad, x1 - x0 + 2 * pad, y1 - y0 + 2 * pad].map(Math.round).join(" ") : null);
    };
    measure();
    /* Labels change size once the web font arrives. */
    let live = true;
    document.fonts?.ready.then(() => { if (live) measure(); });
    return () => { live = false; };
  }, [steps, Scene, onFit, pad]);

  return (
    <div className="scene-fit" ref={ref} aria-hidden="true" {...({ inert: "" } as object)}>
      {steps.map((s, i) => <Scene key={i} step={s} />)}
    </div>
  );
}

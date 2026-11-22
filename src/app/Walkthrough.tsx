import { useMemo, useState, type KeyboardEvent, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import type { AnyLesson, AnyStep } from "../engine/types";
import { Icon } from "../design/ui";
import { CameraContext, type Box } from "../iso/IsoScene";
import SceneFit from "../iso/SceneFit";
import { Rich } from "../theory/inline";

const nn = (n: number) => String(n).padStart(2, "0");

/** The lesson's default run, the one the theory's shots point into. */
export function defaultRun(lesson: AnyLesson): AnyStep[] {
  const r = lesson.parse(lesson.defaultText);
  return r.ok ? lesson.generate(r.input) : [];
}

/**
 * "How it works" as a stepper: the numbered steps beside the lesson's own scene, drawn at the trace
 * step each one describes. Picking a step glides the camera to that moment.
 */
export default function Walkthrough({ lesson, initial = 0 }: { lesson: AnyLesson; initial?: number }) {
  const { steps, shots } = lesson.theory;
  const run = useMemo(() => defaultRun(lesson), [lesson]);
  const frames = useMemo(() => shots.map((n) => run[n - 1]), [run, shots]);
  const [i, setI] = useState(Math.min(Math.max(initial, 0), steps.length - 1));
  const [boxes, setBoxes] = useState<Box[] | null>(null);
  const step = frames[i];
  const n = shots[i];
  const last = steps.length - 1;
  const go = (k: number) => setI(Math.min(Math.max(k, 0), last));
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); go(i + 1); }
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); go(i - 1); }
  };
  /* A click on the step's text selects it too, unless it was on a link inside the text. */
  const pick = (k: number) => (e: MouseEvent) => { if (!(e.target as HTMLElement).closest("a")) setI(k); };
  if (!step) return null;

  return (
    <div className="walk">
      <ol className="walk-steps" aria-label="Steps" onKeyDown={onKey}>
        {steps.map((s, k) => (
          <li key={k} className={k === i ? "on" : k < i ? "past" : ""} onClick={pick(k)}>
            <button type="button" className="walk-num" aria-current={k === i ? "step" : undefined} aria-label={`Show step ${k + 1} in the diagram`} onClick={() => setI(k)}>{k + 1}</button>
            <span className="walk-text"><Rich text={s} /></span>
          </li>
        ))}
      </ol>
      <figure className="walk-fig" aria-label={`Diagram for step ${i + 1}`}>
        <div className="walk-cap">
          <span className="walk-op"><span className="walk-ix">#{nn(n)}</span> {step.op ?? step.kind}</span>
          <span className="walk-title">{step.title}</span>
        </div>
        <div className="walk-stage">
          <CameraContext.Provider value={boxes?.[i] ?? null}>
            <lesson.Scene step={step} />
          </CameraContext.Provider>
        </div>
        <figcaption className="walk-ctl">
          <button className="icon-btn" type="button" onClick={() => go(i - 1)} disabled={i === 0} aria-label="Previous step"><Icon name="left" size={12} /></button>
          <span className="walk-count" aria-live="polite">step {i + 1} of {steps.length}</span>
          <button className="icon-btn" type="button" onClick={() => go(i + 1)} disabled={i === last} aria-label="Next step"><Icon name="right" size={12} /></button>
          <Link className="walk-open" to={`/${lesson.id}/${n}`}>open #{nn(n)} in the trace</Link>
        </figcaption>
        <SceneFit steps={frames} Scene={lesson.Scene} onFit={setBoxes} />
      </figure>
    </div>
  );
}

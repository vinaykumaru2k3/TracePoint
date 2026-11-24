import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../design/ui";
import { linesFor, parseAll } from "../engine/anchors";
import type { AnyLesson } from "../engine/types";
import type { Progress } from "../hooks/useProgress";
import { INTRO_KEY, useStoredFlag } from "../hooks/useStoredFlag";
import { LazyLesson } from "../lessons/load";
import ErrorBoundary from "./ErrorBoundary";
import { defaultRun } from "./Walkthrough";

export { INTRO_KEY };
const SHOWN = 3;

/** The lines with their shared leading whitespace removed, so relative indentation survives. */
export function dedent(lines: string[]): string {
  const margin = Math.min(...lines.filter((l) => l.trim()).map((l) => /^\s*/.exec(l)![0].length), Infinity);
  const cut = margin === Infinity ? 0 : margin;
  return lines.map((l) => l.slice(cut).trimEnd()).join("\n");
}

/** Three steps of the stack's default run, played by hand: the picture, the sentence and the line that ran. */
export function MiniTrace({ lesson }: { lesson: AnyLesson }) {
  /* Step 0 is the problem statement; the demo starts at the first push. */
  const steps = useMemo(() => defaultRun(lesson).slice(1, 1 + SHOWN), [lesson]);
  const java = useMemo(() => parseAll(lesson.code).java, [lesson]);
  const [i, setI] = useState(0);
  /* Empty until the first step change, so the region is quiet on mount. */
  const [said, setSaid] = useState("");
  /* A button that disables itself under the learner's focus hands focus to its partner. */
  const backRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const step = steps[i];
  if (!step) return null;
  const go = (n: number) => {
    const s = steps[n];
    setI(n);
    setSaid(`Step ${n + 1} of ${steps.length}. ${s.title}. ${s.text}`);
    if (n === steps.length - 1) backRef.current?.focus();
    else if (n === 0) nextRef.current?.focus();
  };
  const code = dedent(linesFor(java, step.anchors).map((n) => java.lines[n - 1]));
  return (
    <div className="mini" role="group" aria-label="A three-step example">
      <div className="mini-scene" aria-hidden="true"><lesson.Scene step={step} /></div>
      <p className="mini-title">{step.title}</p>
      <p className="mini-text">{step.text}</p>
      <pre className="mini-code" aria-label="Line that ran"><code>{code}</code></pre>
      <div className="mini-nav">
        <button className="btn sm" ref={backRef} type="button" onClick={() => go(i - 1)} disabled={i === 0}><Icon name="left" size={12} />Back</button>
        <span className="mini-at">Step {i + 1} of {steps.length}</span>
        <button className="btn sm" ref={nextRef} type="button" onClick={() => go(i + 1)} disabled={i === steps.length - 1}>Next<Icon name="right" size={12} /></button>
      </div>
      <p className="sr" aria-live="polite" aria-atomic="true">{said}</p>
    </div>
  );
}

/** The first-visit welcome on the home page. Gone once any lesson has been opened, or when hidden. */
export default function Intro({ progress, onHide }: { progress: Progress; onHide?(): void }) {
  const [hidden, setHidden] = useStoredFlag(INTRO_KEY, false);
  if (hidden || Object.keys(progress).length > 0) return null;
  const hide = () => {
    /* The button is about to unmount; the page heading takes focus so it does not fall to the body. */
    if (typeof document !== "undefined") document.querySelector<HTMLElement>(".guide-head h1")?.focus();
    setHidden(true);
    onHide?.();
  };
  const blank = <div className="mini mini-blank" aria-hidden="true" />;
  return (
    <section className="intro" aria-labelledby="intro-h">
      <div className="intro-grid">
      <div className="intro-copy">
        <h2 id="intro-h">Watch an algorithm run, one line at a time.</h2>
        <p>Each step shows the picture, the sentence that explains it, and the line of code that ran. You can type your own input and watch that run too.</p>
        <div className="intro-actions">
          <Link to="/big-o-by-counting/1" className="btn primary">Start the course <Icon name="right" size={13} /></Link>
          <button className="btn" type="button" onClick={hide}>Hide</button>
        </div>
      </div>
      <ErrorBoundary resetKey="intro" fallback={() => blank}>
        <LazyLesson id="stack" fallback={blank}>{(l) => <MiniTrace lesson={l} />}</LazyLesson>
      </ErrorBoundary>
      </div>
    </section>
  );
}

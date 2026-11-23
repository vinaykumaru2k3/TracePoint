import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../design/ui";
import { linesFor, parseAll } from "../engine/anchors";
import type { AnyLesson } from "../engine/types";
import type { Progress } from "../hooks/useProgress";
import { useStoredFlag } from "../hooks/useStoredFlag";
import { LazyLesson } from "../lessons/load";
import ErrorBoundary from "./ErrorBoundary";
import { defaultRun } from "./Walkthrough";

export const INTRO_KEY = "tracepoint-intro-hidden";
const SHOWN = 3;

/** Three steps of the stack's default run, played by hand: the picture, the sentence and the line that ran. */
function MiniTrace({ lesson }: { lesson: AnyLesson }) {
  /* Step 0 is the problem statement; the demo starts at the first push. */
  const steps = useMemo(() => defaultRun(lesson).slice(1, 1 + SHOWN), [lesson]);
  const java = useMemo(() => parseAll(lesson.code).java, [lesson]);
  const [i, setI] = useState(0);
  /* Empty until the first step change, so the region is quiet on mount. */
  const [said, setSaid] = useState("");
  const step = steps[i];
  if (!step) return null;
  const go = (n: number) => {
    const s = steps[n];
    setI(n);
    setSaid(`Step ${n + 1} of ${steps.length}. ${s.title}. ${s.text}`);
  };
  const code = linesFor(java, step.anchors).map((n) => java.lines[n - 1].trim()).join("\n");
  return (
    <div className="mini" role="group" aria-label="A three-step example">
      <div className="mini-scene" aria-hidden="true"><lesson.Scene step={step} /></div>
      <h2 className="mini-title">{step.title}</h2>
      <p className="mini-text">{step.text}</p>
      <pre className="mini-code" aria-label="Line that ran"><code>{code}</code></pre>
      <div className="mini-nav">
        <button className="btn sm" type="button" onClick={() => go(i - 1)} disabled={i === 0}><Icon name="left" size={12} />Back</button>
        <span className="mini-at">Step {i + 1} of {steps.length}</span>
        <button className="btn sm" type="button" onClick={() => go(i + 1)} disabled={i === steps.length - 1}>Next<Icon name="right" size={12} /></button>
      </div>
      <p className="sr" aria-live="polite" aria-atomic="true">{said}</p>
    </div>
  );
}

/** The first-visit welcome on the home page. Gone once any lesson has been opened, or when hidden. */
export default function Intro({ progress }: { progress: Progress }) {
  const [hidden, setHidden] = useStoredFlag(INTRO_KEY, false);
  if (hidden || Object.keys(progress).length > 0) return null;
  const blank = <div className="mini mini-blank" aria-hidden="true" />;
  return (
    <section className="intro" aria-labelledby="intro-h">
      <div className="intro-copy">
        <h2 id="intro-h">Watch an algorithm run, one line at a time.</h2>
        <p>Each step shows the picture, the sentence that explains it, and the line of code that ran. You can type your own input and watch that run too.</p>
        <div className="intro-actions">
          <Link to="/big-o-by-counting/1" className="btn primary">Start the course <Icon name="right" size={13} /></Link>
          <button className="btn" type="button" onClick={() => setHidden(true)}>Hide</button>
        </div>
      </div>
      <ErrorBoundary resetKey="intro" fallback={() => blank}>
        <LazyLesson id="stack" fallback={blank}>{(l) => <MiniTrace lesson={l} />}</LazyLesson>
      </ErrorBoundary>
    </section>
  );
}

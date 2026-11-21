import { useCallback, useEffect, useRef, useState } from "react";
import { COURSE } from "../data/course.js";
import { LESSONS } from "../data/lessons.js";
import { STEPS } from "../engine/steps.js";
import CourseMap from "./CourseMap.jsx";
import LearnList from "./LearnList.jsx";
import Stats from "./Stats.jsx";
import Stage from "./Stage.jsx";
import Memory from "./Memory.jsx";
import StepRail from "./StepRail.jsx";
import Explain from "./Explain.jsx";
import CodePanel from "./CodePanel.jsx";

const STEP_MS = 2800;

/* One lesson. App remounts it (key=id) when the route changes, so step state resets. */
export default function Lesson({ id, progress, onVisit }) {
  const lesson = LESSONS[id], steps = STEPS[id], last = steps.length - 1;
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);

  const go = useCallback((i) => setIdx(Math.max(0, Math.min(last, i))), [last]);
  const stop = useCallback(() => setPlaying(false), []);

  useEffect(() => { onVisit(id, idx); }, [id, idx, onVisit]);

  useEffect(() => {
    if (!playing) return undefined;
    const t = setInterval(() => setIdx((i) => Math.min(last, i + 1)), STEP_MS);
    return () => clearInterval(t);
  }, [playing, last]);
  useEffect(() => { if (playing && idx >= last) setPlaying(false); }, [playing, idx, last]);

  const togglePlay = () => {
    if (playing) { setPlaying(false); return; }
    if (idx >= last) setIdx(0);
    setPlaying(true);
  };
  const togglePlayRef = useRef(togglePlay);
  togglePlayRef.current = togglePlay;
  const back = () => { stop(); go(idx - 1); };
  const next = () => { stop(); go(idx >= last ? 0 : idx + 1); };
  const reset = () => { stop(); go(0); };

  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowRight") { setPlaying(false); setIdx((i) => Math.min(last, i + 1)); e.preventDefault(); }
      else if (e.key === "ArrowLeft") { setPlaying(false); setIdx((i) => Math.max(0, i - 1)); e.preventDefault(); }
      else if ((e.key === "r" || e.key === "R") && e.target === document.body) { setPlaying(false); setIdx(0); }
      else if (e.key === " " && e.target === document.body) {
        togglePlayRef.current();
        e.preventDefault();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [last]);

  const step = steps[idx];
  const reached = Math.max(progress[id], idx);
  const prog = { ...progress, [id]: reached };

  let sectIdx = 0, inSect = 0, total = 0;
  COURSE.forEach((sc, si) => sc.lessons.forEach((l, li) => { if (l.id === id) { sectIdx = si; inSect = li; total = sc.lessons.length; } }));
  const sect = COURSE[sectIdx];

  return (
    <>
      <aside className="left" aria-label="Course">
        <CourseMap currentId={id} progress={prog} />
        <LearnList lesson={lesson} steps={steps} reached={reached} />
        <p className="hint"><kbd>&larr;</kbd> <kbd>&rarr;</kbd> step &nbsp; <kbd>Space</kbd> play &nbsp; <kbd>R</kbd> reset</p>
      </aside>

      <main className="center" aria-label="Lesson">
        <div className="chead">
          <div>
            <div className="crumb">
              {`${sect.n} ${sect.name}  ·  lesson ${inSect + 1} of ${total}  ·  ≈ ${lesson.minutes} min  ·  beginner  ·  ${last} steps`}
            </div>
            <h1>{lesson.title}</h1>
            <p className="sub">{lesson.sub}</p>
          </div>
          <Stats lesson={lesson} step={step} />
        </div>
        <Stage lesson={lesson} step={step} />
        <Memory lesson={lesson} step={step} />
        <div className="bottom">
          <div className="ctl">
            <button className="btn" onClick={reset} title="Back to the start">Reset</button>
            <button className="btn primary" onClick={togglePlay}>{playing ? "Pause" : (idx === last ? "Replay" : "Play")}</button>
          </div>
          <StepRail steps={steps} idx={idx} reached={reached} onGo={(k) => { stop(); go(k); }} />
        </div>
      </main>

      <aside className="right" aria-label="Explanation and code">
        <Explain lesson={lesson} steps={steps} idx={idx} onBack={back} onNext={next} />
        <CodePanel lesson={lesson} step={step} idx={idx} />
      </aside>
    </>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { sectionOf } from "../curriculum";
import { Icon, Kbd, KindChip, MetricCard } from "../design/ui";
import { usePlayer } from "../engine/usePlayer";
import type { AnyLesson } from "../engine/types";
import { useKeyboard } from "../hooks/useKeyboard";
import { useMedia } from "../hooks/useMedia";
import { usePageFocus, usePageTitle } from "../hooks/usePage";
import type { Progress } from "../hooks/useProgress";
import { CameraContext, ZoomContext, type Shot, type Zoom } from "../iso/IsoScene";
import SceneFit from "../iso/SceneFit";
import { LazyLesson } from "../lessons/load";
import { DEFAULT_LESSON, META_BY_ID } from "../lessons/meta";
import CodeCard from "./CodeCard";
import { LearnList, MemoryStrip, describeMemory } from "./LessonParts";
import RunForm from "./RunForm";
import Scrubber from "./Scrubber";
import { runMax, useLessonRun } from "./useLessonRun";
import CourseDrawer, { NARROW } from "./CourseDrawer";

/* Matches the phone block in app.css, where the colour key folds. */
const PHONE = "(max-width: 560px)";
import CourseSidebar from "./CourseSidebar";
import ErrorBoundary, { SceneError } from "./ErrorBoundary";
import SideCol from "./SideCol";
import type { ExplorerKind, ExplorerPrefs } from "../hooks/useExplorer";
import TheoryView, { LessonTabs } from "./TheoryView";

interface Props {
  view: "theory" | "trace"; progress: Progress; onVisit(id: string, idx: number): void; courseOpen: boolean; onCloseCourse(): void;
  explorer: ExplorerPrefs; onExplorer(kind: ExplorerKind, open: boolean): void;
}

/** Below 0.85 px per scene unit the smallest scene labels drop under about 9px; read at 1:1 instead. */
const LENS = { floor: 0.85, read: 1 };
const WHOLE_KEY = "tracepoint-whole";
const storedWhole = () => { try { return localStorage.getItem(WHOLE_KEY) === "1"; } catch { return false; } };

const reduced = () => !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Route: /<lesson>/<step>?in=<own input>, with step counted from 1, or /<lesson>/learn for the theory tab. */
export default function LessonPage(props: Props) {
  const { lessonId = "", step } = useParams();
  const meta = META_BY_ID[lessonId];
  if (!meta) return <Navigate to={`/${DEFAULT_LESSON}/1`} replace />;
  /* The lesson's chunk loads on demand. Until it arrives nothing below runs, so no progress is reported. */
  return (
    <LazyLesson key={meta.id} id={meta.id} fallback={<LoadingFrame id={meta.id} title={meta.title} {...props} />}>
      {(lesson) => <LessonView lesson={lesson} stepParam={step} {...props} />}
    </LazyLesson>
  );
}

/** The page frame while a lesson's chunk loads: the course tree stays, and the centre holds the stage's height, so nothing jumps when the lesson arrives. */
function LoadingFrame({ id, title, view, progress, courseOpen, onCloseCourse, explorer, onExplorer }: Props & { id: string; title: string }) {
  const narrow = useMedia(NARROW);
  const sidebar = <CourseSidebar currentId={id} currentIdx={0} progress={progress} />;
  const busy = <main className="lesson-loading card" aria-busy="true" aria-label={`Loading ${title}`} />;
  if (narrow) {
    return <div className="page flow"><CourseDrawer open={courseOpen} onClose={onCloseCourse}>{sidebar}</CourseDrawer>{busy}</div>;
  }
  const kind: ExplorerKind = view === "theory" ? "read" : "trace";
  const open = explorer[kind];
  return (
    <div className={`page${open ? "" : " side-shut"}`}>
      <SideCol open={open} onToggle={() => onExplorer(kind, !open)}>{sidebar}</SideCol>
      <div className="center">{busy}</div>
      <aside className="right" aria-label="Explanation and code" />
    </div>
  );
}

function LessonView({ lesson, stepParam, view, progress, onVisit, courseOpen, onCloseCourse, explorer, onExplorer }: Props & { lesson: AnyLesson; stepParam?: string }) {
  const navigate = useNavigate();
  const narrow = useMedia(NARROW);
  const phone = useMedia(PHONE);
  const [params] = useSearchParams();
  /* The input lives in the URL, so a custom run can be shared and survives a reload. The notice for a bad link is derived from it too. */
  const asked = params.get("in");
  const { text, linkError, steps, query, isDefault } = useLessonRun(lesson, asked);
  const last = steps.length - 1;

  const wanted = Number.parseInt(stepParam ?? "1", 10);
  const idx = Math.max(0, Math.min(last, Number.isFinite(wanted) ? wanted - 1 : 0));
  const setIdx = useCallback((i: number) => navigate(`/${lesson.id}/${i + 1}${query}`, { replace: true }), [navigate, lesson.id, query]);
  const player = usePlayer(last, idx, setIdx, view === "trace");
  /* The camera reads big drawings up close; the viewer can ask for the whole drawing instead. */
  const [whole, setWhole] = useState(storedWhole);
  const [cropped, setCropped] = useState(false);
  const toggleWhole = useCallback(() => setWhole((w) => {
    try { localStorage.setItem(WHOLE_KEY, w ? "0" : "1"); } catch { /* private mode: keep it for this visit */ }
    return !w;
  }), []);
  const zoom = useMemo<Zoom>(() => ({ lens: LENS, whole, onCrop: setCropped }), [whole]);
  useKeyboard({
    prev: player.back, next: () => player.jump(idx + 1), first: () => player.jump(0), last: () => player.jump(last),
    toggle: player.toggle, reset: player.reset, whole: () => { if (cropped) toggleWhole(); }
  }, view === "trace");
  const theory = view === "theory";

  /* Saved progress counts steps of the default run only. A custom run keeps its own furthest step, keyed by its input. */
  const [custom, setCustom] = useState({ text: lesson.defaultText, max: 0 });
  useEffect(() => {
    /* The theory tab never counts toward progress. */
    if (theory) return;
    if (isDefault) { onVisit(lesson.id, idx); setCustom((m) => (m.max ? { text: m.text, max: 0 } : m)); }
    else setCustom((m) => runMax(m, text, idx));
  }, [theory, isDefault, text, lesson.id, idx, onVisit]);

  /* A new lesson or tab starts at the top of the page on narrow screens, where the page scrolls. */
  useEffect(() => { if (narrow) window.scrollTo({ top: 0 }); }, [view]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Widening the window brings the in-page course back, so the drawer is done. */
  useEffect(() => { if (!narrow) onCloseCourse(); }, [narrow, onCloseCourse]);

  const [boxes, setBoxes] = useState<Shot[] | null>(null);

  const step = steps[idx];
  const reached = Math.min(last, isDefault ? Math.max(progress[lesson.id] ?? 0, idx) : custom.text === text ? Math.max(custom.max, idx) : idx);
  const sec = sectionOf(lesson.section);
  const label = (i: number) => steps[i].op ?? (i === 0 ? "start" : "recap");
  const nn = (i: number) => String(i + 1).padStart(steps.length > 99 ? 3 : 2, "0");
  /* A stop's name: its short form, else its op. When one op names most of the run (bfs(A) on every step),
     the op says nothing about the step, so the stop falls back to the step's kind. */
  const runOp = useMemo(() => {
    const n = new Map<string, number>();
    for (const s of steps) if (s.op) n.set(s.op, (n.get(s.op) ?? 0) + 1);
    for (const [op, c] of n) if (c >= steps.length * 0.4) return op;
    return null;
  }, [steps]);
  const railName = (i: number) => steps[i].short ?? (steps[i].op && steps[i].op === runOp ? steps[i].kind : label(i));
  const stepTitle = useCallback((i: number) => steps[i].title, [steps]);

  const run = (raw: string) => {
    player.stop();
    navigate(`/${lesson.id}/1${raw === lesson.defaultText ? "" : `?in=${encodeURIComponent(raw)}`}`);
    /* On one column the input sits below the drawing, so bring the new run into view. */
    if (narrow) requestAnimationFrame(() => document.getElementById("stage")?.scrollIntoView({ block: "start", behavior: reduced() ? "auto" : "smooth" }));
  };

  const sidebar = <CourseSidebar currentId={lesson.id} currentIdx={isDefault && !theory ? idx : 0} progress={progress} />;
  /* On the trace the explorer starts folded so the stage gets the width; the theory tab is a reading page. */
  const sideKind: ExplorerKind = theory ? "read" : "trace";
  const sideOpen = explorer[sideKind];
  const sideCol = <SideCol open={sideOpen} onToggle={() => onExplorer(sideKind, !sideOpen)}>{sidebar}</SideCol>;
  const pageCls = `page${sideOpen ? "" : " side-shut"}`;
  const stepOf = `Step ${idx + 1} of ${steps.length}`;
  /* The tab names the lesson and step; a new lesson or tab moves focus to its heading. */
  usePageTitle(theory ? `${lesson.title} · theory · Tracepoint` : `${lesson.title} · step ${idx + 1} of ${steps.length} · Tracepoint`);
  const h1Ref = useRef<HTMLHeadingElement>(null);
  usePageFocus(h1Ref, `${lesson.id}/${view}`);
  /* One announcement per step: its number, title and text. Quiet while playing, so it does not queue up;
     pausing announces the step it landed on. */
  const said = player.playing ? "" : `${stepOf}. ${step.title}. ${step.text}`;
  const sceneState = describeMemory(lesson.memory(step));

  const playLabel = player.playing ? "Pause" : idx === last ? "Replay" : idx === 0 ? "Play all" : "Play";

  const head = (
    <header className={`lesson-head${theory ? "" : " trace-head"}`} key="head">
      <nav className="crumb" aria-label="Breadcrumb">
        <span>dsa</span><span className="sep" aria-hidden="true">/</span>
        {sec && <><span>{sec.id}</span><span className="sep" aria-hidden="true">/</span></>}
        <span className="cur" aria-current="page">{lesson.id}</span>
      </nav>
      <h1 ref={h1Ref} tabIndex={-1}>{lesson.title}</h1>
      <p className="meta">{lesson.minutes} min · {lesson.level} · {steps.length} steps</p>
      <p className="sub">{lesson.subtitle}</p>
      <LessonTabs id={lesson.id} view={view} search={query} />
    </header>
  );

  const legendList = (
    <ul className="legend" aria-label="Colour key">
      {lesson.legend.map((l: { cls: string; label: string }) => <li key={l.label}><i className={`swatch ${l.cls}`} aria-hidden="true" />{l.label}</li>)}
    </ul>
  );
  const stage = (
    <section className="stagecard" id="stage" aria-label="Animated diagram" aria-describedby="scene-state" key="stage">
      <p className="sr" id="scene-state">{sceneState}</p>
      <div className="stage">
        <div className="stage-top">
          <div className="metrics" aria-label="Live values">
            {lesson.metrics(step).map((m: { label: string; value: string | number }) => <MetricCard key={m.label} {...m} />)}
          </div>
          <div className="stage-ctl">
            {cropped && (
              <button className="btn sm zoom" type="button" onClick={toggleWhole} aria-pressed={whole} title="Fit the whole drawing on the stage, or read it up close (F)">
                <Icon name={whole ? "focus" : "expand"} size={12} />Show all
              </button>
            )}
            <button className="btn sm" type="button" onClick={player.reset} disabled={idx === 0}>Reset</button>
            <button className="btn sm speed" type="button" onClick={player.cycleSpeed} aria-label={`Playback speed ${player.speed}×`}>{player.speed}×</button>
            <button className="btn play" type="button" onClick={player.toggle}>
              <Icon name={player.playing ? "pause" : idx === last ? "replay" : "play"} size={12} />
              {playLabel}
              {player.playing && <span className="tick" key={idx} style={{ animationDuration: `${player.ms}ms` }} aria-hidden="true" />}
            </button>
          </div>
        </div>
        <ZoomContext.Provider value={zoom}>
          <CameraContext.Provider value={boxes?.[idx] ?? null}>
            <ErrorBoundary resetKey={`${text}#${idx}`} fallback={() => <SceneError />}>
              <lesson.Scene step={step} />
            </ErrorBoundary>
          </CameraContext.Provider>
        </ZoomContext.Provider>
        <div className="stage-foot">
          {/* On a phone the key folds to its swatches, so the explanation stays on the first screen. */}
          {phone ? (
            <details className="legend-fold">
              <summary>
                <span className="legend-dots" aria-hidden="true">{lesson.legend.map((l: { cls: string; label: string }) => <i key={l.label} className={`swatch ${l.cls}`} />)}</span>
                Colour key
              </summary>
              {legendList}
            </details>
          ) : legendList}
          {step.op && step.ret !== undefined && (
            <div className="result">
              <small>{step.op} returns</small>
              <b className={step.ret === "void" ? "void" : step.ret === "throws" ? "throws" : ""}>{step.ret}</b>
              {step.retNote && <em>{step.retNote}</em>}
            </div>
          )}
        </div>
        {/* The off-screen fit pass draws every step; if one fails, the camera just stays wide. */}
        <ErrorBoundary resetKey={text} fallback={() => null}>
          <SceneFit steps={steps} Scene={lesson.Scene} onFit={setBoxes} />
        </ErrorBoundary>
      </div>
    </section>
  );

  const rail = <Scrubber key="rail" steps={steps} idx={idx} reached={reached} name={railName} title={stepTitle} onJump={player.jump} />;

  /* Keyed on the run, so Back and Forward give the form a fresh draft that follows the URL. */
  const form = <RunForm key={`run:${text}\n${linkError}`} lesson={lesson} text={text} linkError={linkError} asked={asked} step={idx} onRun={run} />;

  const memory = <MemoryStrip key="mem" lesson={lesson} step={step} />;

  const explain = (
    <section className="card explain" aria-label="Explanation" key="explain">
      <div className="pane-title" aria-hidden="true">TRACE</div>
      <div className="head"><span className="stephead"><b>#{nn(idx)}</b>{" "}{label(idx)}</span><KindChip kind={step.kind} /></div>
      <h2>{step.title}</h2>
      <p>{step.text}</p>
      <p className="sr" aria-live="polite" aria-atomic="true">{said}</p>
      <div className="idea"><small>watch</small><div>{step.idea}</div></div>
      <div className="nav">
        <button className="btn" type="button" onClick={player.back} disabled={idx === 0}><Icon name="left" />Back</button>
        <button className="btn primary cue" type="button" onClick={player.next}><span>{idx >= last ? "Start over" : `Next: ${label(idx + 1)}`}</span><Icon name={idx >= last ? "replay" : "right"} /></button>
      </div>
      <p className="keys"><Kbd>←</Kbd><Kbd>→</Kbd> step · <Kbd>Home</Kbd><Kbd>End</Kbd> ends · <Kbd>Space</Kbd> play · <Kbd>R</Kbd> reset · <Kbd>F</Kbd> show all</p>
    </section>
  );

  /* The theory tab shows the code at rest: no line is lit. */
  const restStep = useMemo(() => ({ ...steps[0], anchors: [] }), [steps]);
  const code = theory ? <CodeCard key="code" lesson={lesson} step={restStep} idx={0} idle="Open the trace tab to see which lines run." /> : <CodeCard key="code" lesson={lesson} step={step} idx={idx} />;
  const learn = <LearnList key="learn" items={lesson.learn.map(([t, test]) => [t, steps.slice(0, reached + 1).some(test)] as const)} />;

  if (theory) {
    const body = <TheoryView lesson={lesson} search={query} key="body" />;
    if (narrow) {
      return (
        <div className="page flow">
          <CourseDrawer open={courseOpen} onClose={onCloseCourse}>{sidebar}</CourseDrawer>
          <main className="flow-main guide" aria-label="Lesson theory">
            {head}
            <div className="gbody card">{body}</div>
            {code}
          </main>
        </div>
      );
    }
    return (
      <div className={pageCls}>
        {sideCol}
        <div className="center">
          <main className="lesson card guide" aria-label="Lesson theory">{head}<div className="gbody">{body}</div></main>
        </div>
        <aside className="right" aria-label="Code">{code}</aside>
      </div>
    );
  }

  /* Narrow screens: one column in reading order, so tab order and screen readers follow what is on screen. */
  if (narrow) {
    return (
      <div className="page flow">
        <CourseDrawer open={courseOpen} onClose={onCloseCourse}>{sidebar}</CourseDrawer>
        <main className="flow-main" aria-label="Lesson">
          {[head, stage, explain, rail, code, form, memory, learn]}
        </main>
        {/* Back and Next stay under the thumb while the page scrolls. */}
        <nav className="stepbar" aria-label="Step controls">
          {/* The view switch scrolls away on a phone; the way back to theory stays under the thumb. */}
          <Link className="btn to-theory" to={`/${lesson.id}/learn${query}`} aria-label="Theory" title="Theory"><Icon name="file" /></Link>
          <button className="btn" type="button" onClick={player.back} disabled={idx === 0} aria-label="Back"><Icon name="left" /></button>
          <span className="stepbar-at">Step {idx + 1}/{steps.length} · <b>{label(idx)}</b></span>
          <button className="btn primary cue" type="button" onClick={player.next}><span>{idx >= last ? "Start over" : "Next"}</span><Icon name={idx >= last ? "replay" : "right"} /></button>
        </nav>
      </div>
    );
  }

  return (
    <div className={pageCls}>
      {sideCol}
      <div className="center">
        <main className="lesson card" aria-label="Lesson">{[head, stage, rail, form, memory]}</main>
      </div>
      <aside className="right" aria-label="Explanation and code">{[explain, code, learn]}</aside>
    </div>
  );
}

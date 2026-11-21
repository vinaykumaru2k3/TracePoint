import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { sectionOf } from "../curriculum";
import { Badge, Icon, Kbd, KindChip, MetricCard } from "../design/ui";
import { usePlayer } from "../engine/usePlayer";
import type { AnyLesson, MemoryCell } from "../engine/types";
import { useKeyboard } from "../hooks/useKeyboard";
import { useMedia } from "../hooks/useMedia";
import type { Progress } from "../hooks/useProgress";
import { CameraContext, type Box } from "../iso/IsoScene";
import SceneFit from "../iso/SceneFit";
import { DEFAULT_LESSON, LESSON_BY_ID } from "../lessons";
import CodeCard from "./CodeCard";
import CourseDrawer, { NARROW } from "./CourseDrawer";
import CourseSidebar from "./CourseSidebar";

interface Props { progress: Progress; onVisit(id: string, idx: number): void; courseOpen: boolean; onCloseCourse(): void }

const reduced = () => !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Route: /<lesson>/<step>?in=<own input>, with step counted from 1. */
export default function LessonPage(props: Props) {
  const { lessonId = "", step } = useParams();
  const lesson = LESSON_BY_ID[lessonId];
  if (!lesson) return <Navigate to={`/${DEFAULT_LESSON}/1`} replace />;
  return <LessonView key={lesson.id} lesson={lesson} stepParam={step} {...props} />;
}

function LessonView({ lesson, stepParam, progress, onVisit, courseOpen, onCloseCourse }: Props & { lesson: AnyLesson; stepParam?: string }) {
  const navigate = useNavigate();
  const narrow = useMedia(NARROW);
  const [params] = useSearchParams();
  /* The input lives in the URL, so a custom run can be shared and survives a reload. */
  const asked = params.get("in");
  const askedParse = asked === null ? null : lesson.parse(asked);
  const askedOk = !askedParse || askedParse.ok;
  const text = asked !== null && askedOk ? asked : lesson.defaultText;
  const [draft, setDraft] = useState(asked ?? lesson.defaultText);
  const [error, setError] = useState(() =>
    askedParse && !askedParse.ok ? `This link's input could not run, so the default run is shown. ${askedParse.error}` : "");

  const steps = useMemo(() => {
    const r = lesson.parse(text);
    return r.ok ? lesson.generate(r.input) : lesson.generate((lesson.parse(lesson.defaultText) as { input: unknown }).input);
  }, [lesson, text]);
  const last = steps.length - 1;
  const query = text === lesson.defaultText ? "" : `?in=${encodeURIComponent(text)}`;

  const wanted = Number.parseInt(stepParam ?? "1", 10);
  const idx = Math.max(0, Math.min(last, Number.isFinite(wanted) ? wanted - 1 : 0));
  const setIdx = useCallback((i: number) => navigate(`/${lesson.id}/${i + 1}${query}`, { replace: true }), [navigate, lesson.id, query]);
  const player = usePlayer(last, idx, setIdx);
  useKeyboard({
    prev: player.back, next: () => player.jump(idx + 1), first: () => player.jump(0), last: () => player.jump(last),
    toggle: player.toggle, reset: player.reset
  });

  /* Saved progress counts steps of the default run only. Custom inputs have their own step lists. */
  const isDefault = text === lesson.defaultText;
  const [customMax, setCustomMax] = useState(0);
  useEffect(() => {
    if (isDefault) onVisit(lesson.id, idx);
    else setCustomMax((m) => Math.max(m, idx));
  }, [isDefault, lesson.id, idx, onVisit]);

  /* Back and forward through runs: the box follows the URL's input (not on first load, so a bad link's input stays visible). */
  const seenText = useRef(text);
  useEffect(() => {
    if (seenText.current === text) return;
    seenText.current = text;
    setDraft(text);
  }, [text]);

  /* A new lesson starts at the top of the page on narrow screens, where the page scrolls. */
  useEffect(() => { if (narrow) window.scrollTo({ top: 0 }); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* A Run error is about the input that failed; once the step moves on it is stale. */
  const seenIdx = useRef(idx);
  useEffect(() => {
    if (seenIdx.current === idx) return;
    seenIdx.current = idx;
    setError("");
  }, [idx]);

  /* Widening the window brings the in-page course back, so the drawer is done. */
  useEffect(() => { if (!narrow) onCloseCourse(); }, [narrow, onCloseCourse]);

  const [boxes, setBoxes] = useState<Box[] | null>(null);

  const step = steps[idx];
  const reached = Math.min(last, isDefault ? Math.max(progress[lesson.id] ?? 0, idx) : customMax);
  const sec = sectionOf(lesson.section);
  const inSec = sec ? sec.lessons.findIndex((l) => l.id === lesson.id) + 1 : 0;
  const label = (i: number) => steps[i].op ?? (i === 0 ? "start" : "recap");
  const railName = (i: number) => steps[i].short ?? label(i);

  const run = (raw: string) => {
    const r = lesson.parse(raw);
    if (!r.ok) { setError(r.error); return; }
    setError("");
    setCustomMax(0);
    setDraft(raw);
    player.stop();
    navigate(`/${lesson.id}/1${raw === lesson.defaultText ? "" : `?in=${encodeURIComponent(raw)}`}`);
    /* On one column the input sits below the drawing, so bring the new run into view. */
    if (narrow) requestAnimationFrame(() => document.getElementById("stage")?.scrollIntoView({ block: "start", behavior: reduced() ? "auto" : "smooth" }));
  };
  /* Checked as you type, shown quietly; the alert is kept for a failed Run. */
  const check = useMemo(() => (draft === text ? null : lesson.parse(draft)), [draft, text, lesson]);

  const [copyState, setCopyState] = useState("");
  const copy = async () => {
    try { await navigator.clipboard.writeText(window.location.href); setCopyState("Copied"); }
    catch { setCopyState("Could not copy. Use the address bar."); }
    setTimeout(() => setCopyState(""), 2400);
  };

  /* Keep the current stop in the middle of the rail; only the rail scrolls. */
  const railRef = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const rail = railRef.current;
    const li = rail?.children[idx] as HTMLElement | undefined;
    if (!rail || !li || rail.scrollWidth <= rail.clientWidth) return;
    rail.scrollTo({ left: li.offsetLeft - (rail.clientWidth - li.offsetWidth) / 2, behavior: reduced() ? "auto" : "smooth" });
  }, [idx, steps, narrow]);

  const sidebar = <CourseSidebar currentId={lesson.id} currentIdx={isDefault ? idx : 0} progress={progress} />;
  const playLabel = player.playing ? "Pause" : idx === last ? "Replay" : idx === 0 ? "Play all" : "Play";
  const stepOf = `Step ${idx + 1} of ${steps.length}`;

  const head = (
    <header className="lesson-head" key="head">
      <div className="crumb">{sec ? `${sec.n}. ${sec.name}` : ""}<span aria-hidden="true">/</span>{sec ? `Lesson ${inSec} of ${sec.lessons.length}` : ""}</div>
      <div className="title-row">
        <h1>{lesson.title}</h1>
        <div className="badges">
          <Badge tone="var(--c-amber)">{lesson.minutes} min</Badge>
          <Badge tone="var(--c-green)">{lesson.level}</Badge>
          <Badge tone="var(--c-lav)">{steps.length} steps</Badge>
        </div>
      </div>
      <p className="sub">{lesson.subtitle}</p>
    </header>
  );

  const stage = (
    <section className="stagecard" id="stage" aria-label="Animated diagram" key="stage">
      <div className="stage">
        <div className="stage-top">
          <div className="metrics" aria-label="Live values">
            {lesson.metrics(step).map((m: { label: string; value: string | number }) => <MetricCard key={m.label} {...m} />)}
          </div>
          <div className="stage-ctl">
            <button className="btn sm" type="button" onClick={player.reset} disabled={idx === 0}>Reset</button>
            <button className="btn sm speed" type="button" onClick={player.cycleSpeed} aria-label={`Playback speed ${player.speed}×`}>{player.speed}×</button>
            <button className="btn play" type="button" onClick={player.toggle}>
              <Icon name={player.playing ? "pause" : idx === last ? "replay" : "play"} size={12} />
              {playLabel}
              {player.playing && <span className="tick" key={idx} style={{ animationDuration: `${player.ms}ms` }} aria-hidden="true" />}
            </button>
          </div>
        </div>
        <CameraContext.Provider value={boxes?.[idx] ?? null}>
          <lesson.Scene step={step} />
        </CameraContext.Provider>
        <div className="stage-foot">
          <ul className="legend" aria-label="Colour key">
            {lesson.legend.map((l: { cls: string; label: string }) => <li key={l.label}><i className={`swatch ${l.cls}`} aria-hidden="true" />{l.label}</li>)}
          </ul>
          {step.op && step.ret !== undefined && (
            <div className="result">
              <small>{step.op} returns</small>
              <b className={step.ret === "void" ? "void" : step.ret === "throws" ? "throws" : ""}>{step.ret}</b>
              {step.retNote && <em>{step.retNote}</em>}
            </div>
          )}
        </div>
        <SceneFit steps={steps} Scene={lesson.Scene} onFit={setBoxes} />
      </div>
    </section>
  );

  const rail = (
    <div className="rail-wrap" key="rail">
      <div className="rail-head">
        <span className="lbl">In this lesson</span>
        <span className="muted">{stepOf} · <b>{label(idx)}</b></span>
      </div>
      <ol className="rail" ref={railRef}>
        {steps.map((_, i) => {
          const state = i === idx ? "" : i <= reached ? ", seen" : "";
          return (
            <li key={i} className={i === idx ? "cur" : i <= reached ? "seen" : ""}>
              <button type="button" aria-current={i === idx ? "step" : undefined} onClick={() => player.jump(i)} title={`Step ${i + 1}: ${label(i)}`} aria-label={`Step ${i + 1}: ${label(i)}${state}`}>
                <span className="num">{i + 1}</span><span className="name">{railName(i)}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );

  const form = (
    <form className="run" key="run" onSubmit={(e) => { e.preventDefault(); run(draft); }}>
      <label htmlFor="ops">{lesson.inputLabel}</label>
      <div className="run-row">
        <input id="ops" type="text" value={draft} onChange={(e) => { setDraft(e.target.value); setError(""); }} spellCheck={false} autoComplete="off"
          aria-describedby={error ? "ops-err ops-hint" : "ops-hint ops-check"} aria-invalid={!!error || (check ? !check.ok : false)} />
        <select aria-label="Examples" value="" onChange={(e) => e.target.value && run(e.target.value)}>
          <option value="">Examples…</option>
          <option value={lesson.defaultText}>Default run</option>
          {lesson.presets.map((p: { label: string; text: string }) => <option key={p.label} value={p.text}>{p.label}</option>)}
        </select>
        <button className="btn sm" type="submit">Run</button>
        <button className="btn sm" type="button" onClick={copy}><Icon name="link" size={12} />Copy link</button>
        <span className="copy-state" role="status">{copyState}</span>
      </div>
      {error && <p className="err" role="alert" id="ops-err">{error}</p>}
      <p className="hint" id="ops-hint">{lesson.inputHint}</p>
      {!error && check && <p className={check.ok ? "check ok" : "check"} id="ops-check">{check.ok ? "Ready: press Run." : `Not runnable yet: ${check.error}`}</p>}
    </form>
  );

  const memory = <MemoryStrip key="mem" lesson={lesson} step={step} />;

  const explain = (
    <section className="card explain" aria-label="Explanation" key="explain">
      <div className="head"><span>{stepOf}</span><KindChip kind={step.kind} /></div>
      <h2>{step.title}</h2>
      <p aria-live="polite">{step.text}</p>
      <div className="idea"><i aria-hidden="true"><Icon name="spark" size={13} /></i><div><small>Key idea</small>{step.idea}</div></div>
      <div className="nav">
        <button className="btn" type="button" onClick={player.back} disabled={idx === 0}><Icon name="left" />Back</button>
        <button className="btn primary" type="button" onClick={player.next}><span>{idx >= last ? "Start over" : `Next: ${label(idx + 1)}`}</span><Icon name={idx >= last ? "replay" : "right"} /></button>
      </div>
      <p className="keys"><Kbd>←</Kbd><Kbd>→</Kbd> step · <Kbd>Home</Kbd><Kbd>End</Kbd> ends · <Kbd>Space</Kbd> play · <Kbd>R</Kbd> reset</p>
    </section>
  );

  const code = <CodeCard key="code" lesson={lesson} step={step} idx={idx} />;
  const learn = <LearnList key="learn" items={lesson.learn.map(([t, test]) => [t, steps.slice(0, reached + 1).some(test)] as const)} />;

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
          <button className="btn" type="button" onClick={player.back} disabled={idx === 0} aria-label="Back"><Icon name="left" /></button>
          <span className="stepbar-at">Step {idx + 1}/{steps.length} · <b>{label(idx)}</b></span>
          <button className="btn primary" type="button" onClick={player.next}><span>{idx >= last ? "Start over" : "Next"}</span><Icon name={idx >= last ? "replay" : "right"} /></button>
        </nav>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="side-col">{sidebar}</div>
      <div className="center">
        <main className="lesson card" aria-label="Lesson">{[head, stage, rail, form, memory]}</main>
      </div>
      <aside className="right" aria-label="Explanation and code">{[explain, code, learn]}</aside>
    </div>
  );
}

/** Open only on tall screens (1000px and up); folded on short ones so the code box keeps its height. The summary still shows progress. */
function LearnList({ items }: { items: (readonly [string, boolean])[] }) {
  const done = items.filter(([, ok]) => ok).length;
  const [open] = useState(() => window.innerHeight >= 1000);
  return (
    <details className="card learn" open={open}>
      <summary><span className="lbl">You will learn</span><span className="muted">{done} / {items.length}</span></summary>
      <ul>
        {items.map(([t, ok]) => <li key={t} className={ok ? "ok" : ""}>{t}<span className="sr">{ok ? ", done" : ""}</span></li>)}
      </ul>
    </details>
  );
}

function MemoryStrip({ lesson, step }: { lesson: AnyLesson; step: ReturnType<AnyLesson["generate"]>[number] }) {
  const mem = lesson.memory(step);
  return (
    <section className="mem" aria-label="Memory">
      <div className="memhead">
        <span className="lbl">{mem.title}</span>
        <span className="costs">{lesson.costs.map(([n, c]: [string, string]) => <span key={n}><b>{c}</b> {n}</span>)}</span>
      </div>
      <div className="cells" style={{ gridTemplateColumns: `repeat(${mem.cells.length}, minmax(0, 1fr))` }}>
        {mem.cells.map((c: MemoryCell, i: number) => (
          <div key={i} className={"cell" + (c.v === null ? " empty" : c.live ? "" : " stale") + (c.act ? " act" + (c.tone ? ` t-${c.tone}` : "") : "")}>
            <div className="box">{c.v === null ? "·" : c.v}</div>
            <div className="idx">{c.tag ?? `[${i}]`}</div>
            <div className="mk">{c.marks.join(" ")}</div>
          </div>
        ))}
      </div>
      <p className="memnote">{mem.note}</p>
    </section>
  );
}

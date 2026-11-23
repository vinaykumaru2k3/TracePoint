import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent, type SyntheticEvent } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { sectionOf } from "../curriculum";
import { Icon, Kbd, KindChip, MetricCard, kindColor } from "../design/ui";
import { usePlayer } from "../engine/usePlayer";
import type { AnyLesson, MemoryCell } from "../engine/types";
import { useKeyboard } from "../hooks/useKeyboard";
import { useMedia } from "../hooks/useMedia";
import type { Progress } from "../hooks/useProgress";
import { CameraContext, ZoomContext, type Shot, type Zoom } from "../iso/IsoScene";
import SceneFit from "../iso/SceneFit";
import { DEFAULT_LESSON, LESSON_BY_ID } from "../lessons";
import CodeCard from "./CodeCard";
import CourseDrawer, { NARROW } from "./CourseDrawer";
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
  const lesson = LESSON_BY_ID[lessonId];
  if (!lesson) return <Navigate to={`/${DEFAULT_LESSON}/1`} replace />;
  return <LessonView key={lesson.id} lesson={lesson} stepParam={step} {...props} />;
}

function LessonView({ lesson, stepParam, view, progress, onVisit, courseOpen, onCloseCourse, explorer, onExplorer }: Props & { lesson: AnyLesson; stepParam?: string }) {
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

  /* Saved progress counts steps of the default run only. Custom inputs have their own step lists. */
  const isDefault = text === lesson.defaultText;
  const [customMax, setCustomMax] = useState(0);
  useEffect(() => {
    /* The theory tab never counts toward progress. */
    if (theory) return;
    if (isDefault) onVisit(lesson.id, idx);
    else setCustomMax((m) => Math.max(m, idx));
  }, [theory, isDefault, lesson.id, idx, onVisit]);

  /* Back and forward through runs: the box follows the URL's input (not on first load, so a bad link's input stays visible). */
  const seenText = useRef(text);
  useEffect(() => {
    if (seenText.current === text) return;
    seenText.current = text;
    setDraft(text);
  }, [text]);

  /* A new lesson or tab starts at the top of the page on narrow screens, where the page scrolls. */
  useEffect(() => { if (narrow) window.scrollTo({ top: 0 }); }, [view]); // eslint-disable-line react-hooks/exhaustive-deps

  /* A Run error is about the input that failed; once the step moves on it is stale. */
  const seenIdx = useRef(idx);
  useEffect(() => {
    if (seenIdx.current === idx) return;
    seenIdx.current = idx;
    setError("");
  }, [idx]);

  /* Widening the window brings the in-page course back, so the drawer is done. */
  useEffect(() => { if (!narrow) onCloseCourse(); }, [narrow, onCloseCourse]);

  const [boxes, setBoxes] = useState<Shot[] | null>(null);

  const step = steps[idx];
  const reached = Math.min(last, isDefault ? Math.max(progress[lesson.id] ?? 0, idx) : customMax);
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
  const [peek, setPeek] = useState<number | null>(null);

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

  /* The scrubber: a point on the track names a step; pressing jumps there and dragging scrubs. */
  const scrubRef = useRef<HTMLDivElement>(null);
  const scrubbing = useRef(false);
  const stepAt = (clientX: number) => {
    const r = scrubRef.current?.getBoundingClientRect();
    if (!r || r.width === 0) return idx;
    return Math.max(0, Math.min(steps.length - 1, Math.floor(((clientX - r.left) / r.width) * steps.length)));
  };
  const onScrubDown = (e: RPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    scrubbing.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const i = stepAt(e.clientX);
    if (i !== idx) player.jump(i);
  };
  const onScrubMove = (e: RPointerEvent<HTMLDivElement>) => {
    const i = stepAt(e.clientX);
    if (scrubbing.current) { if (i !== idx) player.jump(i); }
    else if (e.pointerType === "mouse") setPeek(i);
  };
  const onScrubEnd = () => { scrubbing.current = false; };

  const sidebar = <CourseSidebar currentId={lesson.id} currentIdx={isDefault && !theory ? idx : 0} progress={progress} />;
  /* On the trace the explorer starts folded so the stage gets the width; the theory tab is a reading page. */
  const sideKind: ExplorerKind = theory ? "read" : "trace";
  const sideOpen = explorer[sideKind];
  const sideCol = <SideCol open={sideOpen} onToggle={() => onExplorer(sideKind, !sideOpen)}>{sidebar}</SideCol>;
  const pageCls = `page${sideOpen ? "" : " side-shut"}`;
  const playLabel = player.playing ? "Pause" : idx === last ? "Replay" : idx === 0 ? "Play all" : "Play";
  const stepOf = `Step ${idx + 1} of ${steps.length}`;

  const head = (
    <header className={`lesson-head${theory ? "" : " trace-head"}`} key="head">
      <nav className="crumb" aria-label="Breadcrumb">
        <span>dsa</span><span className="sep" aria-hidden="true">/</span>
        {sec && <><span>{sec.id}</span><span className="sep" aria-hidden="true">/</span></>}
        <span className="cur" aria-current="page">{lesson.id}</span>
      </nav>
      <h1>{lesson.title}</h1>
      <p className="meta">{lesson.minutes} min · {lesson.level} · {steps.length} steps</p>
      <p className="sub">{lesson.subtitle}</p>
      <LessonTabs id={lesson.id} view={view} search={query} />
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
        {/* The off-screen fit pass draws every step; if one fails, the camera just stays wide. */}
        <ErrorBoundary resetKey={text} fallback={() => null}>
          <SceneFit steps={steps} Scene={lesson.Scene} onFit={setBoxes} />
        </ErrorBoundary>
      </div>
    </section>
  );

  /* The timeline is a scrubber: one track, one tick per step in its kind's colour. The walked stretch is
     filled in ink up to the playhead, an ember knob carrying the current step's number and name. Click or drag
     anywhere on the track to scrub; arrows, Home and End move it from the keyboard. Hovering previews a step's
     title in the header without moving the playhead. The track always fits its width, however long the run. */
  const tickCls = (i: number) => (i === idx ? "cur" : i < idx ? "past" : i <= reached ? "seen" : "") + (peek === i && i !== idx ? " pk" : "");
  const shown = peek !== null && peek !== idx ? peek : idx;
  const at = (i: number) => `${((i + 0.5) / steps.length) * 100}%`;
  const rail = (
    <div className="rail-wrap" key="rail">
      <div className="rail-head">
        <span className="lbl">Timeline</span>
        <span className={`muted rail-read${shown !== idx ? " peeking" : ""}`}>
          {shown === idx ? stepOf : `Jump to step ${shown + 1}`} · <b>{steps[shown].title}</b>
        </span>
      </div>
      <div className="scrub" ref={scrubRef} role="slider" tabIndex={0} aria-label="Step"
        aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={idx + 1} aria-valuetext={`${stepOf}: ${step.title}`}
        onPointerDown={onScrubDown} onPointerMove={onScrubMove} onPointerUp={onScrubEnd} onPointerCancel={onScrubEnd}
        onPointerLeave={() => setPeek(null)}
        style={{ "--x": (idx + 0.5) / steps.length } as CSSProperties}>
        <ol className="scrub-ticks" aria-hidden="true" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
          {steps.map((s, i) => <li key={i} className={tickCls(i)} style={{ "--k": kindColor(s.kind) } as CSSProperties} />)}
        </ol>
        <div className="scrub-base" aria-hidden="true"><i style={{ width: at(idx) }} /></div>
        <span className="scrub-head" aria-hidden="true" style={{ left: at(idx) }}>
          <b><span className="n">{nn(idx)}</span>{railName(idx)}</b>
        </span>
      </div>
      <div className="scrub-scale" aria-hidden="true"><span>{nn(0)}</span><span>{nn(last)}</span></div>
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
      <p className={error || check ? "hint" : "hint quiet"} id="ops-hint">{lesson.inputHint}</p>
      {!error && check && <p className={check.ok ? "check ok" : "check"} id="ops-check">{check.ok ? "Ready: press Run." : `Not runnable yet: ${check.error}`}</p>}
    </form>
  );

  const memory = <MemoryStrip key="mem" lesson={lesson} step={step} />;

  const explain = (
    <section className="card explain" aria-label="Explanation" key="explain">
      <div className="pane-title" aria-hidden="true">TRACE</div>
      <div className="head"><span className="stephead"><b>#{nn(idx)}</b>{" "}{label(idx)}</span><KindChip kind={step.kind} /></div>
      <h2>{step.title}</h2>
      <p aria-live="polite">{step.text}</p>
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

/** Open only on tall screens (1000px and up); folded on short ones so the code box keeps its height. The summary still shows progress. */
function LearnList({ items }: { items: (readonly [string, boolean])[] }) {
  const done = items.filter(([, ok]) => ok).length;
  const [open] = useState(() => window.innerHeight >= 1000);
  return (
    <details className="card learn" open={open}>
      <summary>Checkpoints · {done}/{items.length} hit</summary>
      <ul>
        {items.map(([t, ok]) => <li key={t} className={ok ? "ok" : ""}><span className="mk" aria-hidden="true">{ok && <Icon name="check" size={10} />}</span><span>{t}</span><span className="sr">{ok ? ", done" : ""}</span></li>)}
      </ul>
    </details>
  );
}

const MEM_KEY = "tracepoint-memory";
const storedMemOpen = () => { try { return localStorage.getItem(MEM_KEY) !== "0"; } catch { return true; } };

/** Folds to its header line when the reader wants the stage taller; the choice is remembered. */
function MemoryStrip({ lesson, step }: { lesson: AnyLesson; step: ReturnType<AnyLesson["generate"]>[number] }) {
  const mem = lesson.memory(step);
  const [open, setOpen] = useState(storedMemOpen);
  const onToggle = (e: SyntheticEvent<HTMLDetailsElement>) => {
    const o = e.currentTarget.open;
    setOpen(o);
    try { localStorage.setItem(MEM_KEY, o ? "1" : "0"); } catch { /* private mode: keep it for this visit */ }
  };
  return (
    <details className="mem" open={open} onToggle={onToggle}>
      <summary className="memhead">
        <span className="lbl">{mem.title}</span>
        <span className="costs">{lesson.costs.map(([n, c]: [string, string]) => <span key={n}><b>{c}</b> {n}</span>)}</span>
      </summary>
      {mem.layout === "table" ? (
        <div className="cells tbl" role="table" aria-label={mem.title}>
          {mem.head !== undefined && (
            <div className="trow thead" role="row"><div className="idx" role="columnheader">col</div><div className="box" role="columnheader">{mem.head}</div></div>
          )}
          {mem.cells.map((c: MemoryCell, i: number) => (
            <div key={i} role="row" className={"trow" + (c.live ? "" : " stale") + (c.act ? " act" + (c.tone ? ` t-${c.tone}` : "") : "")}>
              <div className="idx" role="rowheader">{c.tag ?? `[${i}]`}</div>
              <div className="box" role="cell">{c.v === null ? "·" : c.v}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="cells" style={{ gridTemplateColumns: `repeat(${mem.cells.length}, minmax(0, 1fr))` }}>
          {mem.cells.map((c: MemoryCell, i: number) => (
            <div key={i} className={"cell" + (c.v === null ? " empty" : c.live ? "" : " stale") + (c.act ? " act" + (c.tone ? ` t-${c.tone}` : "") : "")}>
              <div className="box">{c.v === null ? "·" : c.v}</div>
              <div className="idx">{c.tag ?? `[${i}]`}</div>
              <div className="mk">{c.marks.join(" ")}</div>
            </div>
          ))}
        </div>
      )}
      <p className="memnote">{mem.note}</p>
    </details>
  );
}

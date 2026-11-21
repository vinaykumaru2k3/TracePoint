import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { sectionOf } from "../curriculum";
import { Badge, Kbd, KindChip, MetricCard } from "../design/ui";
import { usePlayer } from "../engine/usePlayer";
import type { AnyLesson, MemoryCell } from "../engine/types";
import { useKeyboard } from "../hooks/useKeyboard";
import type { Progress } from "../hooks/useProgress";
import { DEFAULT_LESSON, LESSON_BY_ID } from "../lessons";
import CodeCard from "./CodeCard";
import CourseSidebar from "./CourseSidebar";

interface Props { progress: Progress; onVisit(id: string, idx: number): void }

/** Route: /<lesson>/<step>, with step counted from 1. */
export default function LessonPage(props: Props) {
  const { lessonId = "", step } = useParams();
  const lesson = LESSON_BY_ID[lessonId];
  if (!lesson) return <Navigate to={`/${DEFAULT_LESSON}/1`} replace />;
  return <LessonView key={lesson.id} lesson={lesson} stepParam={step} {...props} />;
}

function LessonView({ lesson, stepParam, progress, onVisit }: Props & { lesson: AnyLesson; stepParam?: string }) {
  const navigate = useNavigate();
  const [text, setText] = useState(lesson.defaultText);
  const [draft, setDraft] = useState(lesson.defaultText);
  const [error, setError] = useState("");

  const steps = useMemo(() => {
    const r = lesson.parse(text);
    return r.ok ? lesson.generate(r.input) : lesson.generate((lesson.parse(lesson.defaultText) as { input: unknown }).input);
  }, [lesson, text]);
  const last = steps.length - 1;

  const wanted = Number.parseInt(stepParam ?? "1", 10);
  const idx = Math.max(0, Math.min(last, Number.isFinite(wanted) ? wanted - 1 : 0));
  const setIdx = useCallback((i: number) => navigate(`/${lesson.id}/${i + 1}`, { replace: true }), [navigate, lesson.id]);
  const player = usePlayer(last, idx, setIdx);
  useKeyboard({ prev: player.back, next: () => player.jump(idx + 1), toggle: player.toggle, reset: player.reset });

  useEffect(() => { onVisit(lesson.id, idx); }, [lesson.id, idx, onVisit]);

  const step = steps[idx];
  const reached = Math.min(last, Math.max(progress[lesson.id] ?? 0, idx));
  const sec = sectionOf(lesson.section);
  const inSec = sec ? sec.lessons.findIndex((l) => l.id === lesson.id) + 1 : 0;
  const label = (i: number) => steps[i].op ?? (i === 0 ? "start" : "recap");

  const run = (raw: string) => {
    const r = lesson.parse(raw);
    if (!r.ok) { setError(r.error); return; }
    setError("");
    setText(raw);
    setDraft(raw);
    player.stop();
    setIdx(0);
  };

  return (
    <div className="page">
      <CourseSidebar currentId={lesson.id} currentIdx={idx} progress={progress} />

      <div className="center">
      <main className="lesson card" aria-label="Lesson">
        <header className="lesson-head">
          <div className="crumb">{sec ? `${sec.n}. ${sec.name}` : ""}<span aria-hidden="true">/</span>{sec ? `Lesson ${inSec} of ${sec.lessons.length}` : ""}</div>
          <div className="title-row">
            <h1>{lesson.title}</h1>
            <div className="badges">
              <Badge tone="var(--c-amber)">{lesson.minutes} min</Badge>
              <Badge tone="var(--c-green)">{lesson.level}</Badge>
              <Badge tone="var(--c-lav)">{last} steps</Badge>
            </div>
          </div>
          <p className="sub">{lesson.subtitle}</p>
        </header>

        <section className="stagecard" aria-label="Animated diagram">
          <div className="stage">
            <lesson.Scene step={step} />
            <div className="stage-top">
              <div className="metrics" aria-label="Live values">
                {lesson.metrics(step).map((m: { label: string; value: string | number }) => <MetricCard key={m.label} {...m} />)}
              </div>
              <div className="stage-ctl">
                <button className="btn sm" onClick={player.reset} disabled={idx === 0}>Reset</button>
                <button className="btn sm speed" onClick={player.cycleSpeed} aria-label={`Speed ${player.speed} times, change`}>{player.speed}×</button>
                <button className="btn primary play" onClick={player.toggle} aria-pressed={player.playing}>
                  <span aria-hidden="true">{player.playing ? "❚❚" : idx === last ? "↺" : "▶"}</span>
                  {player.playing ? "Pause" : idx === last ? "Replay" : idx === 0 ? "Play all" : "Play"}
                </button>
              </div>
            </div>
            {step.op && step.ret !== undefined && (
              <div className="result">
                <small>{step.op} returns</small>
                <b className={step.ret === "void" ? "void" : step.ret === "throws" ? "throws" : ""}>{step.ret}</b>
                {step.retNote && <em>{step.retNote}</em>}
              </div>
            )}
            {player.playing && <div className="tick" key={idx} style={{ animationDuration: `${player.ms}ms` }} aria-hidden="true" />}
            <div className="legend" aria-hidden="true">
              {lesson.legend.map((l: { cls: string; label: string }) => <span key={l.label}><i className={`swatch ${l.cls}`} />{l.label}</span>)}
            </div>
          </div>
        </section>

        <div className="rail-wrap">
          <div className="rail-head"><span className="lbl">In this lesson</span><span className="muted">Step {idx + 1} of {steps.length}</span></div>
          <ol className="rail">
            {steps.map((_, i) => (
              <li key={i} className={i === idx ? "cur" : i <= reached ? "seen" : ""}>
                <button aria-current={i === idx ? "step" : undefined} onClick={() => player.jump(i)}>
                  <span className="num">{i + 1}</span><span className="name">{label(i)}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>

        <form className="run" onSubmit={(e) => { e.preventDefault(); run(draft); }}>
          <label htmlFor="ops">{lesson.inputLabel}</label>
          <div className="run-row">
            <input id="ops" type="text" value={draft} onChange={(e) => setDraft(e.target.value)} spellCheck={false} autoComplete="off" aria-describedby="ops-hint" aria-invalid={!!error} />
            <select aria-label="Examples" value="" onChange={(e) => e.target.value && run(e.target.value)}>
              <option value="">Examples…</option>
              <option value={lesson.defaultText}>Default run</option>
              {lesson.presets.map((p: { label: string; text: string }) => <option key={p.label} value={p.text}>{p.label}</option>)}
            </select>
            <button className="btn sm" type="submit">Run</button>
          </div>
          {error ? <p className="err" role="alert">{error}</p> : <p className="hint" id="ops-hint">{lesson.inputHint}</p>}
        </form>

        <MemoryStrip lesson={lesson} step={step} />
      </main>
      </div>

      <aside className="right" aria-label="Explanation and code">
        <section className="card explain">
          <div className="head"><span>Step {idx + 1} / {steps.length}</span><KindChip kind={step.kind} /></div>
          <h2>{step.title}</h2>
          <p aria-live="polite">{step.text}</p>
          <div className="idea"><i aria-hidden="true">✦</i><div><small>Key idea</small>{step.idea}</div></div>
          <div className="nav">
            <button className="btn" onClick={player.back} disabled={idx === 0}>← Back</button>
            <button className="btn primary" onClick={player.next}><span>{idx >= last ? "Start over" : `Next: ${label(idx + 1)}`}</span><span aria-hidden="true">→</span></button>
          </div>
          <p className="keys"><Kbd>←</Kbd><Kbd>→</Kbd> step · <Kbd>Space</Kbd> play · <Kbd>R</Kbd> reset</p>
        </section>

        <CodeCard lesson={lesson} step={step} idx={idx} />

        <LearnList items={lesson.learn.map(([t, test]) => [t, steps.slice(0, reached + 1).some(test)] as const)} />
      </aside>
    </div>
  );
}

/** Folded by default so the code box keeps the height; the summary still shows progress. */
function LearnList({ items }: { items: (readonly [string, boolean])[] }) {
  const done = items.filter(([, ok]) => ok).length;
  return (
    <details className="card learn">
      <summary><span className="lbl">You will learn</span><span className="muted">{done} / {items.length}</span></summary>
      <ul>
        {items.map(([t, ok]) => <li key={t} className={ok ? "ok" : ""}>{t}</li>)}
      </ul>
    </details>
  );
}

function MemoryStrip({ lesson, step }: { lesson: AnyLesson; step: ReturnType<AnyLesson["generate"]>[number] }) {
  const mem = lesson.memory(step);
  return (
    <section aria-label="Memory">
      <div className="memhead">
        <span className="lbl">{mem.title}</span>
        <span className="costs">{lesson.costs.map(([n, c]: [string, string]) => <span key={n}><b>{c}</b> {n}</span>)}</span>
      </div>
      <div className="cells" style={{ gridTemplateColumns: `repeat(${mem.cells.length}, minmax(0, 1fr))` }}>
        {mem.cells.map((c: MemoryCell, i: number) => (
          <div key={i} className={"cell" + (c.v === null ? " empty" : c.live ? "" : " stale") + (c.act ? " act" : "")}>
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

import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { sectionOf } from "../curriculum";
import { Badge, Kbd, KindChip, MetricCard } from "../design/ui";
import { usePlayer } from "../engine/usePlayer";
import type { AnyLesson } from "../engine/types";
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

      <main className="center" aria-label="Lesson">
        <header>
          <div className="crumb">{sec ? `${sec.n} ${sec.name} · lesson ${inSec} of ${sec.lessons.length}` : ""}</div>
          <h1>{lesson.title}</h1>
          <p className="sub">{lesson.subtitle}</p>
          <div className="badges">
            <Badge>≈ {lesson.minutes} min</Badge>
            <Badge tone="var(--c-green)">{lesson.level}</Badge>
            <Badge>{last} steps</Badge>
          </div>
        </header>

        <div className="metrics" aria-label="Live values">
          {lesson.metrics(step).map((m: { label: string; value: string | number }) => <MetricCard key={m.label} {...m} />)}
        </div>

        <form className="run" onSubmit={(e) => { e.preventDefault(); run(draft); }}>
          <label htmlFor="ops">{lesson.inputLabel}</label>
          <input id="ops" type="text" value={draft} onChange={(e) => setDraft(e.target.value)} spellCheck={false} autoComplete="off" aria-describedby="ops-hint" aria-invalid={!!error} />
          <button className="btn primary" type="submit">Run</button>
          <select aria-label="Examples" value="" onChange={(e) => e.target.value && run(e.target.value)}>
            <option value="">Examples…</option>
            <option value={lesson.defaultText}>Default run</option>
            {lesson.presets.map((p: { label: string; text: string }) => <option key={p.label} value={p.text}>{p.label}</option>)}
          </select>
          {error ? <p className="err" role="alert">{error}</p> : <p className="hint" id="ops-hint">{lesson.inputHint}</p>}
        </form>

        <section className="card stagecard" aria-label="Animated diagram">
          <div className="stagebar">
            <button className="btn" onClick={player.reset}>Reset</button>
            <button className="btn primary" onClick={player.toggle}>{player.playing ? "Pause" : idx === last ? "Replay" : "Play"}</button>
            <div className="legend" aria-hidden="true">
              {lesson.legend.map((l: { cls: string; label: string }) => <span key={l.label}><i className={`swatch ${l.cls}`} />{l.label}</span>)}
            </div>
          </div>
          <div className="stage">
            <lesson.Scene step={step} />
            {step.op && (
              <div className="result">
                <small>{step.op} returns</small>
                <b className={step.ret === "void" ? "void" : step.ret === "throws" ? "throws" : ""}>{step.ret}</b>
                {step.retNote && <em>{step.retNote}</em>}
              </div>
            )}
          </div>
        </section>

        <MemoryStrip lesson={lesson} step={step} />

        <div className="rail-wrap">
          <span className="lbl">In this lesson</span>
          <div className="rail">
            {steps.map((_, i) => (
              <button key={i} className={i === idx ? "cur" : i <= reached ? "seen" : ""} aria-current={i === idx ? "step" : undefined}
                onClick={() => player.jump(i)}>{i + 1}. {label(i)}</button>
            ))}
          </div>
        </div>
      </main>

      <aside className="right" aria-label="Explanation and code">
        <section className="card explain">
          <div className="head"><span>Step {idx + 1} / {steps.length}</span><KindChip kind={step.kind} /></div>
          <h2>{step.title}</h2>
          <p aria-live="polite">{step.text}</p>
          <div className="idea"><small>Key idea</small>{step.idea}</div>
          <div className="nav">
            <button className="btn" onClick={player.back} disabled={idx === 0}>Back <Kbd>←</Kbd></button>
            <button className="btn primary" onClick={player.next}>{idx >= last ? "Start over" : `Next: ${label(idx + 1)}`} <Kbd>→</Kbd></button>
          </div>
          <p className="memnote"><Kbd>Space</Kbd> play · <Kbd>R</Kbd> reset · <Kbd>Ctrl K</Kbd> search</p>
        </section>

        <CodeCard lesson={lesson} step={step} idx={idx} />

        <section className="card learn" aria-label="You will learn">
          <h3>You will learn</h3>
          <ul>
            {lesson.learn.map(([t, test]) => (
              <li key={t} className={steps.slice(0, reached + 1).some(test) ? "ok" : ""}>{t}</li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
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
        {mem.cells.map((c: { v: number | null; live: boolean; act: boolean; marks: string[] }, i: number) => (
          <div key={i} className={"cell" + (c.v === null ? " empty" : c.live ? "" : " stale") + (c.act ? " act" : "")}>
            <div className="box">{c.v === null ? "·" : c.v}</div>
            <div className="idx">[{i}]</div>
            <div className="mk">{c.marks.join(" ")}</div>
          </div>
        ))}
      </div>
      <p className="memnote">{mem.note}</p>
    </section>
  );
}

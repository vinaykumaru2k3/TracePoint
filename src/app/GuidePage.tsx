import { useEffect, useMemo, useRef, useState } from "react";
import { usePageFocus, usePageTitle } from "../hooks/usePage";
import { Link, Navigate, useParams } from "react-router-dom";
import { folderName, sectionOf } from "../curriculum";
import { LazyLesson } from "../lessons/load";
import { META_BY_ID } from "../lessons/meta";
import type { Progress } from "../hooks/useProgress";
import { useMedia } from "../hooks/useMedia";
import { GUIDES } from "../theory";
import { Icon } from "../design/ui";
import type { AnyLesson } from "../engine/types";
import GrowthChart from "../theory/GrowthChart";
import { useInk } from "../theory/useInk";
import { growthRank } from "../theory/growth";
import { Rich } from "../theory/inline";
import { Cost, heatClass } from "../theory/Meter";
import type { Guide } from "../theory/types";
import { Analogy, MarkList } from "./TheoryView";
import { defaultRun } from "./Walkthrough";
import CourseDrawer, { NARROW } from "./CourseDrawer";
import CourseSidebar from "./CourseSidebar";
import ErrorBoundary from "./ErrorBoundary";
import Intro, { INTRO_KEY } from "./Intro";
import { readFlag } from "../hooks/useStoredFlag";
import SideCol from "./SideCol";
import type { ExplorerKind, ExplorerPrefs } from "../hooks/useExplorer";

interface Props { progress: Progress; courseOpen: boolean; onCloseCourse(): void; sectionId?: string; explorer: ExplorerPrefs; onExplorer(kind: ExplorerKind, open: boolean): void }

/** The parts of a guide in reading order, with the id each one is linked by. */
const PARTS = [
  ["core", "Core idea"], ["analogy", "Analogy"], ["prereqs", "Before you start"], ["terms", "Key terms"],
  ["cheat", "Cheat sheet"], ["patterns", "When you see…"], ["tips", "Tips and traps"], ["cases", "Case studies"],
  ["lessons", "Lessons here"]
] as const;

/** What a section id leads to: a guide, a notice (no guide yet) or the home page. */
export function resolveGuide(sectionId: string): "guide" | "missing" | "redirect" {
  if (!sectionOf(sectionId)) return "redirect";
  return GUIDES[sectionId] ? "guide" : "missing";
}

export function Part({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section className="gpart" id={id} aria-labelledby={`${id}-h`}>
      <h2 className="pane-title-label" id={`${id}-h`}>{title}</h2>
      {children}
    </section>
  );
}

/** A small still of a lesson's scene at the middle of its walkthrough. Decorative: the link names the lesson. */
export function Thumb({ id, className = "thumb" }: { id: string; className?: string }) {
  /* The empty span keeps the thumbnail's size while the lesson loads, and again if its chunk fails: a missing still must not take the guide down. */
  const blank = <span className={className} aria-hidden="true" />;
  return (
    <ErrorBoundary resetKey={id} fallback={() => blank}>
      <LazyLesson id={id} fallback={blank}>{(lesson) => <ThumbScene lesson={lesson} className={className} />}</LazyLesson>
    </ErrorBoundary>
  );
}

function ThumbScene({ lesson, className }: { lesson: AnyLesson; className: string }) {
  const step = useMemo(() => {
    const shots = lesson.theory.shots;
    return defaultRun(lesson)[shots[Math.floor(shots.length / 2)] - 1];
  }, [lesson]);
  if (!step) return null;
  return <span className={className} aria-hidden="true"><lesson.Scene step={step} /></span>;
}

/** Every lesson of a section, in order: live ones link to their theory tab with the hook, the rest read "soon".
 *  `thumbs` adds a still of each live lesson's scene. */
function LessonRows({ guide, hooks, thumbs = false }: { guide: Guide; hooks: boolean; thumbs?: boolean }) {
  const sec = sectionOf(guide.section)!;
  return (
    <ul className={thumbs ? "glessons gallery" : "glessons"}>
      {sec.lessons.map((l) => META_BY_ID[l.id]
        ? (
          <li key={l.id}>
            {thumbs && <Thumb id={l.id} />}
            <span className="gl-text">
              <Link to={`/${l.id}/learn`}>{l.name}</Link>
              {hooks && guide.hooks[l.id] && <span className="hook"><Rich text={guide.hooks[l.id]} /></span>}
            </span>
          </li>
        )
        : <li key={l.id} className="soon"><span>{l.name}</span><small className="soon-tag">soon</small></li>)}
    </ul>
  );
}

/** Cheat-sheet cells that name a cost class get a meter. */
const Cell = ({ text }: { text: string }) => (growthRank(text) === null ? <Rich text={text} /> : <Cost>{text}</Cost>);

/** A row's name, with a trailing "(qualifier)" set on its own muted line. */
function RowName({ text }: { text: string }) {
  const m = /^(.+?)\s*\(([^()]+)\)$/.exec(text);
  if (!m) return <span className="cheat-name"><Rich text={text} /></span>;
  return <><span className="cheat-name"><Rich text={m[1]} /></span><span className="cheat-qual"><Rich text={m[2]} /></span></>;
}

/** One guide, pure: the parts in the order the spec fixes. */
export function GuideView({ guide }: { guide: Guide }) {
  /* The growth classes the cheat sheet names, inked on the chart. */
  const marked = new Set(guide.cheat.rows.flat().map(growthRank).filter((r): r is number => r !== null));
  const [first, ...rest] = guide.core;
  const ref = useRef<HTMLDivElement>(null);
  useInk(ref, guide.section);
  return (
    <div className="prose" ref={ref}>
      <div className="band">
        <Part id="core" title="Core idea">
          <p className="lead"><Rich text={first} /></p>
          {rest.map((p, i) => <p key={i}><Rich text={p} /></p>)}
        </Part>
        <div className="band-side">
          <Part id="analogy" title="Analogy"><Analogy text={guide.analogy} /></Part>
          <Part id="prereqs" title="Before you start"><MarkList items={guide.prereqs} icon="check" tone="yes" /></Part>
        </div>
      </div>
      <Part id="terms" title="Key terms">
        <dl className="terms">
          {guide.terms.map(([t, m]) => <div key={t}><dt><Rich text={t} /></dt><dd><Rich text={m} /></dd></div>)}
        </dl>
      </Part>
      <Part id="cheat" title="Cheat sheet">
        <div className="table-wrap">
          <table className="cheat">
            <thead><tr>{guide.cheat.head.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
            <tbody>
              {guide.cheat.rows.map((row, i) => (
                <tr key={i}>{row.map((c, j) => {
                  const last = j === row.length - 1;
                  if (j === 0) return <th key={j} scope="row"><RowName text={c} /></th>;
                  return <td key={j} className={last ? "cheat-note" : heatClass(c)}>{last ? <Rich text={c} /> : <Cell text={c} />}</td>;
                })}</tr>
              ))}
            </tbody>
          </table>
        </div>
        {marked.size > 0 && <GrowthChart marked={marked} />}
      </Part>
      <Part id="patterns" title="When you see…">
        <ul className="pairs">
          {guide.patterns.map(([signal, move], i) => (
            <li key={i}>
              <span className="sig"><Rich text={signal} /></span>
              <span className="arrow" aria-hidden="true"><Icon name="right" size={14} /></span>
              <span className="mv"><Rich text={move} /></span>
            </li>
          ))}
        </ul>
      </Part>
      <Part id="tips" title="Tips and traps"><MarkList items={guide.tips} icon="warn" tone="warn cols" /></Part>
      <Part id="cases" title="Case studies">
        {guide.cases.map((c) => (
          <article className="case" key={c.title}>
            <h3>{c.title}</h3>
            <dl className="flow">
              <div><dt>setting</dt><dd><Rich text={c.setting} /></dd></div>
              <div><dt>idea</dt><dd><Rich text={c.idea} /></dd></div>
              <div><dt>why it fits</dt><dd><Rich text={c.why} /></dd></div>
            </dl>
          </article>
        ))}
      </Part>
      <Part id="lessons" title="Lessons here"><LessonRows guide={guide} hooks thumbs /></Part>
    </div>
  );
}

function Notice({ sectionName }: { sectionName: string }) {
  return (
    <div className="prose">
      <section className="gpart">
        <h2 className="pane-title-label">Guide</h2>
        <p>The guide for {sectionName} arrives with its lessons. Until then, start with the <Link to="/guide/foundations">Foundations guide</Link>.</p>
      </section>
    </div>
  );
}

/** Route: /guide/:sectionId. Also rendered at the root with sectionId "foundations". */
export default function GuidePage({ progress, courseOpen, onCloseCourse, sectionId: fixed, explorer, onExplorer }: Props) {
  const params = useParams();
  const sectionId = fixed ?? params.sectionId ?? "";
  const narrow = useMedia(NARROW);
  /* A new guide starts at the top of the page on narrow screens, where the page scrolls. */
  useEffect(() => { if (narrow) window.scrollTo({ top: 0 }); }, [sectionId]); // eslint-disable-line react-hooks/exhaustive-deps
  const h1Ref = useRef<HTMLHeadingElement>(null);
  const [introHidden, setIntroHidden] = useState(false);
  usePageTitle(`${sectionOf(sectionId)?.name ?? "Guide"} · guide · Tracepoint`);
  usePageFocus(h1Ref, `guide/${sectionId}`);
  const kind = resolveGuide(sectionId);
  if (kind === "redirect") return <Navigate to="/" replace />;
  const sec = sectionOf(sectionId)!;
  const guide = GUIDES[sectionId];

  /* The way in: the first live lesson not yet complete, at its theory tab if never opened. */
  const live = sec.lessons.filter((l) => META_BY_ID[l.id]);
  const isDone = (id: string) => (progress[id] ?? 0) >= Math.max(1, (META_BY_ID[id]?.steps ?? 1) - 1);
  const doneCount = live.filter((l) => isDone(l.id)).length;
  const next = live.find((l) => !isDone(l.id));
  const cta = next && (progress[next.id] === undefined
    ? { to: `/${next.id}/learn`, label: `Start with ${next.name}` }
    : { to: `/${next.id}/1`, label: `Continue ${next.name}` });

  const sidebar = <CourseSidebar currentId="" currentIdx={0} progress={progress} guideId={sectionId} />;
  const home = fixed !== undefined;
  /* While the intro offers "Start the course", the hero button steps back so a first visitor sees one primary way in. */
  const introShown = home && !introHidden && Object.keys(progress).length === 0 && !readFlag(INTRO_KEY, false);
  const intro = home ? <Intro progress={progress} onHide={() => setIntroHidden(true)} key="intro" /> : null;
  const head = (
    <header className="lesson-head guide-head" key="head" style={{ "--sec": sec.color } as React.CSSProperties}>
      <div className="ghero">
        <div className="ghero-text">
          <div className="crumb" aria-label="Path">
            <i className="sec-swatch" style={{ background: sec.color }} aria-hidden="true" />
            <span>dsa</span><span aria-hidden="true">/</span><span>{folderName(sec).replace(/\/$/, "")}</span><span aria-hidden="true">/</span><span className="cur">README.md</span>
          </div>
          <h1 ref={h1Ref} tabIndex={-1}>{sec.name}</h1>
          {guide && <p className="sub"><Rich text={guide.tagline} /></p>}
          {guide && live.length > 0 && (
            <div className="ghero-meta">
              {cta && <Link to={cta.to} className={introShown ? "btn" : "btn primary"}>{cta.label} <Icon name="right" size={13} /></Link>}
              <span className="ghero-stat"><strong>{live.length}</strong> {live.length === 1 ? "lesson" : "lessons"}</span>
              <span className="ghero-stat"><strong>{doneCount}</strong> complete</span>
            </div>
          )}
        </div>
        {guide && live[0] && <Thumb id={live[0].id} className="ghero-scene" />}
      </div>
    </header>
  );
  const body = guide ? <GuideView guide={guide} key="body" /> : <Notice sectionName={sec.name} key="body" />;
  const side = guide && (
    <div className="guide-side" key="side">
      <nav className="card guide-toc" aria-label="On this page">
        <div className="pane-title">On this page</div>
        <ul>{PARTS.map(([id, t]) => <li key={id}><a href={`#/guide/${sectionId}`} onClick={(e) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ block: "start" }); }}>{t}</a></li>)}</ul>
      </nav>
      <section className="card guide-lessons" aria-label="Lessons here">
        <div className="pane-title">Lessons here</div>
        <LessonRows guide={guide} hooks />
      </section>
    </div>
  );

  if (narrow) {
    return (
      <div className="page flow">
        <CourseDrawer open={courseOpen} onClose={onCloseCourse}>{sidebar}</CourseDrawer>
        <main className="flow-main guide" aria-label="Guide">
          {intro}{head}
          <div className="gbody card">{body}</div>
          {side}
        </main>
      </div>
    );
  }
  return (
    <div className={`page${explorer.read ? "" : " side-shut"}`}>
      <SideCol open={explorer.read} onToggle={() => onExplorer("read", !explorer.read)}>{sidebar}</SideCol>
      <div className="center">
        <main className="lesson card guide" aria-label="Guide">{intro}{head}<div className="gbody">{body}</div></main>
      </div>
      <aside className="right" aria-label="On this page and lessons">{side}</aside>
    </div>
  );
}

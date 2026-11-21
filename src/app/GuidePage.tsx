import { Link, Navigate, useParams } from "react-router-dom";
import { folderName, sectionOf } from "../curriculum";
import { LESSON_BY_ID } from "../lessons";
import type { Progress } from "../hooks/useProgress";
import { useMedia } from "../hooks/useMedia";
import { GUIDES } from "../theory";
import { Rich } from "../theory/inline";
import type { Guide } from "../theory/types";
import CourseDrawer, { NARROW } from "./CourseDrawer";
import CourseSidebar from "./CourseSidebar";

interface Props { progress: Progress; courseOpen: boolean; onCloseCourse(): void; sectionId?: string }

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

function Part({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section className="gpart" id={id} aria-labelledby={`${id}-h`}>
      <h2 className="pane-title-label" id={`${id}-h`}>{title}</h2>
      {children}
    </section>
  );
}

/** Every lesson of a section, in order: live ones link to their theory tab with the hook, the rest read "soon". */
function LessonRows({ guide, hooks }: { guide: Guide; hooks: boolean }) {
  const sec = sectionOf(guide.section)!;
  return (
    <ul className="glessons">
      {sec.lessons.map((l) => LESSON_BY_ID[l.id]
        ? (
          <li key={l.id}>
            <Link to={`/${l.id}/learn`}>{l.name}</Link>
            {hooks && guide.hooks[l.id] && <span className="hook"><Rich text={guide.hooks[l.id]} /></span>}
          </li>
        )
        : <li key={l.id} className="soon"><span>{l.name}</span><small className="soon-tag">soon</small></li>)}
    </ul>
  );
}

/** One guide, pure: the parts in the order the spec fixes. */
export function GuideView({ guide }: { guide: Guide }) {
  return (
    <div className="prose">
      <Part id="core" title="Core idea">{guide.core.map((p, i) => <p key={i}><Rich text={p} /></p>)}</Part>
      <Part id="analogy" title="Analogy"><p><Rich text={guide.analogy} /></p></Part>
      <Part id="prereqs" title="Before you start">
        <ul>{guide.prereqs.map((p, i) => <li key={i}><Rich text={p} /></li>)}</ul>
      </Part>
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
                <tr key={i}>{row.map((c, j) => <td key={j}><Rich text={c} /></td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </Part>
      <Part id="patterns" title="When you see…">
        <ul className="pairs">
          {guide.patterns.map(([signal, move], i) => (
            <li key={i}><span className="sig"><Rich text={signal} /></span><span className="mv"><Rich text={move} /></span></li>
          ))}
        </ul>
      </Part>
      <Part id="tips" title="Tips and traps">
        <ul>{guide.tips.map((t, i) => <li key={i}><Rich text={t} /></li>)}</ul>
      </Part>
      <Part id="cases" title="Case studies">
        {guide.cases.map((c) => (
          <article className="case" key={c.title}>
            <h3>{c.title}</h3>
            <p><b>Setting.</b> <Rich text={c.setting} /></p>
            <p><b>Idea.</b> <Rich text={c.idea} /></p>
            <p><b>Why it fits.</b> <Rich text={c.why} /></p>
          </article>
        ))}
      </Part>
      <Part id="lessons" title="Lessons here"><LessonRows guide={guide} hooks /></Part>
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
export default function GuidePage({ progress, courseOpen, onCloseCourse, sectionId: fixed }: Props) {
  const params = useParams();
  const sectionId = fixed ?? params.sectionId ?? "";
  const narrow = useMedia(NARROW);
  const kind = resolveGuide(sectionId);
  if (kind === "redirect") return <Navigate to="/" replace />;
  const sec = sectionOf(sectionId)!;
  const guide = GUIDES[sectionId];

  const sidebar = <CourseSidebar currentId="" currentIdx={0} progress={progress} guideId={sectionId} />;
  const head = (
    <header className="lesson-head guide-head" key="head">
      <div className="crumb" aria-label="Path">
        <i className="sec-swatch" style={{ background: sec.color }} aria-hidden="true" />
        <span>dsa</span><span aria-hidden="true">/</span><span>{folderName(sec)}</span><span aria-hidden="true">/</span><span className="cur">README.md</span>
      </div>
      <h1>{sec.name}</h1>
      {guide && <p className="sub"><Rich text={guide.tagline} /></p>}
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
          {head}
          <div className="gbody card">{body}</div>
          {side}
        </main>
      </div>
    );
  }
  return (
    <div className="page">
      <div className="side-col">{sidebar}</div>
      <div className="center">
        <main className="lesson card guide" aria-label="Guide">{head}<div className="gbody">{body}</div></main>
      </div>
      <aside className="right" aria-label="On this page and lessons">{side}</aside>
    </div>
  );
}

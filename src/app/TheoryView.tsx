import { Link } from "react-router-dom";
import type { AnyLesson } from "../engine/types";
import { Rich } from "../theory/inline";
import { Part } from "./GuidePage";

/** The lesson's two views: the reading (theory) and the step-through (trace). Both keep the run's `?in=`. */
export function LessonTabs({ id, view, search }: { id: string; view: "theory" | "trace"; search: string }) {
  return (
    <nav className="lesson-tabs" aria-label="Lesson view">
      <Link to={`/${id}/learn${search}`} className={`tab${view === "theory" ? " on" : ""}`} aria-current={view === "theory" ? "page" : undefined}>theory</Link>
      <Link to={`/${id}/1${search}`} className={`tab${view === "trace" ? " on" : ""}`} aria-current={view === "trace" ? "page" : undefined}>trace</Link>
    </nav>
  );
}

/** One lesson's theory, pure: the parts in the order the spec fixes, then the way into the trace. */
export default function TheoryView({ lesson, search }: { lesson: AnyLesson; search: string }) {
  const t = lesson.theory;
  const watch = <Link to={`/${lesson.id}/1${search}`} className="btn primary watch">Watch it run</Link>;
  if (!t) return <div className="prose theory">{watch}</div>;
  const list = (items: string[]) => <ul>{items.map((x, i) => <li key={i}><Rich text={x} /></li>)}</ul>;
  return (
    <div className="prose theory">
      <Part id="definition" title="Definition"><p><Rich text={t.definition} /></p></Part>
      <Part id="analogy" title="Analogy"><p><Rich text={t.analogy} /></p></Part>
      <Part id="steps" title="How it works"><ol>{t.steps.map((x, i) => <li key={i}><Rich text={x} /></li>)}</ol></Part>
      {t.ops && (
        <Part id="ops" title="Operations">
          <div className="table-wrap">
            <table className="cheat plain">
              <thead><tr><th scope="col">Operation</th><th scope="col">Cost</th><th scope="col">Note</th></tr></thead>
              <tbody>{t.ops.map((row, i) => <tr key={i}>{row.map((c, j) => <td key={j}><Rich text={c} /></td>)}</tr>)}</tbody>
            </table>
          </div>
        </Part>
      )}
      <Part id="glance" title="At a glance">
        <div className="table-wrap">
          <table className="cheat plain">
            <thead><tr><th scope="col">Operation</th><th scope="col">Cost</th></tr></thead>
            <tbody>{lesson.costs.map(([name, cost]: [string, string]) => <tr key={name}><td>{name}</td><td>{cost}</td></tr>)}</tbody>
          </table>
        </div>
      </Part>
      <Part id="use" title="Use it when">{list(t.useWhen)}</Part>
      <Part id="avoid" title="Avoid it when">{list(t.avoidWhen)}</Part>
      <Part id="example" title="Worked example">{t.example.map((x, i) => <p key={i}><Rich text={x} /></p>)}</Part>
      <Part id="pitfalls" title="Pitfalls">{list(t.pitfalls)}</Part>
      <div className="watch-row">{watch}</div>
    </div>
  );
}

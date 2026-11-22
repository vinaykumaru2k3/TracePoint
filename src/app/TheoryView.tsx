import { Link } from "react-router-dom";
import type { AnyLesson } from "../engine/types";
import { Icon, type IconName } from "../design/ui";
import { Rich } from "../theory/inline";
import { Cost } from "../theory/Meter";
import { Part } from "./GuidePage";
import Walkthrough from "./Walkthrough";

/** The lesson's two views: the reading (theory) and the step-through (trace). Both keep the run's `?in=`. */
export function LessonTabs({ id, view, search }: { id: string; view: "theory" | "trace"; search: string }) {
  return (
    <nav className="lesson-tabs" aria-label="Lesson view">
      <Link to={`/${id}/learn${search}`} className={`tab${view === "theory" ? " on" : ""}`} aria-current={view === "theory" ? "page" : undefined}>theory</Link>
      <Link to={`/${id}/1${search}`} className={`tab${view === "trace" ? " on" : ""}`} aria-current={view === "trace" ? "page" : undefined}>trace</Link>
    </nav>
  );
}

/** A list whose items each lead with a drawn icon: checks, crosses or warnings. */
export function MarkList({ items, icon, tone }: { items: string[]; icon: IconName; tone: string }) {
  return (
    <ul className={`marks ${tone}`}>
      {items.map((x, i) => <li key={i}><span className="mark" aria-hidden="true"><Icon name={icon} size={13} /></span><span><Rich text={x} /></span></li>)}
    </ul>
  );
}

/** The everyday picture, set apart from the prose with a bulb. */
export function Analogy({ text }: { text: string }) {
  return <div className="analogy"><span className="mark" aria-hidden="true"><Icon name="bulb" size={16} /></span><p><Rich text={text} /></p></div>;
}

/** One lesson's theory, pure: the parts in the order the spec fixes, then the way into the trace. */
export default function TheoryView({ lesson, search }: { lesson: AnyLesson; search: string }) {
  const t = lesson.theory;
  const watch = <Link to={`/${lesson.id}/1${search}`} className="btn primary watch">Watch it run <Icon name="right" size={13} /></Link>;
  return (
    <div className="prose theory">
      <div className="band">
        <Part id="definition" title="Definition"><p className="lead"><Rich text={t.definition} /></p></Part>
        <Part id="analogy" title="Analogy"><Analogy text={t.analogy} /></Part>
      </div>
      <Part id="steps" title="How it works"><Walkthrough lesson={lesson} /></Part>
      <div className={t.ops ? "band costs" : "band"}>
      {t.ops && (
        <Part id="ops" title="Operations">
          <div className="table-wrap">
            <table className="cheat plain">
              <thead><tr><th scope="col">Operation</th><th scope="col">Cost</th><th scope="col">Note</th></tr></thead>
              <tbody>{t.ops.map(([op, cost, note], i) => (
                <tr key={i}><td><Rich text={op} /></td><td><Cost>{cost}</Cost></td><td><Rich text={note} /></td></tr>
              ))}</tbody>
            </table>
          </div>
        </Part>
      )}
      <Part id="glance" title="At a glance">
        <div className="table-wrap">
          <table className="cheat plain glance">
            <thead><tr><th scope="col">Operation</th><th scope="col">Cost</th></tr></thead>
            <tbody>{lesson.costs.map(([name, cost]: [string, string]) => <tr key={name}><td>{name}</td><td><Cost>{cost}</Cost></td></tr>)}</tbody>
          </table>
        </div>
      </Part>
      </div>
      <div className="fit-pair">
        <Part id="use" title="Use it when"><MarkList items={t.useWhen} icon="check" tone="yes" /></Part>
        <Part id="avoid" title="Avoid it when"><MarkList items={t.avoidWhen} icon="close" tone="no" /></Part>
      </div>
      <div className="band even">
      <Part id="example" title="Worked example">
        <ol className="example">{t.example.map((x, i) => <li key={i}><span><Rich text={x} /></span></li>)}</ol>
      </Part>
      <Part id="pitfalls" title="Pitfalls"><MarkList items={t.pitfalls} icon="warn" tone="warn" /></Part>
      </div>
      <div className="watch-row">{watch}</div>
    </div>
  );
}

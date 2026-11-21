import { COURSE } from "../data/course.js";
import { STEPS } from "../engine/steps.js";

export default function CourseMap({ currentId, progress }) {
  let live = 0, all = 0, seen = 0, possible = 0;

  const sections = COURSE.map((sc) => (
    <div className="sect" key={sc.n}>
      <h3><em>{sc.n}</em>{sc.name}</h3>
      <ol className="track">
        {sc.lessons.map((l) => {
          all++;
          if (!l.id) {
            return (
              <li className="stop soon" key={l.name}>
                <span className="row"><span>{l.name}</span><span className="cnt">soon</span></span>
              </li>
            );
          }
          live++;
          const max = STEPS[l.id].length - 1, got = progress[l.id];
          seen += got; possible += max;
          const cls = "stop" + (got >= max ? " done" : "") + (l.id === currentId ? " current" : "");
          return (
            <li className={cls} key={l.id}>
              <a href={"#" + l.id} aria-current={l.id === currentId ? "page" : undefined}>
                <span>{l.name}</span><span className="cnt">{got}/{max}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </div>
  ));

  const pct = possible ? Math.round((seen / possible) * 100) : 0;

  return (
    <div>
      <div className="lbl"><span>Course</span><span>{live} of {all}</span></div>
      <div>{sections}</div>
      <div style={{ marginTop: 12 }}>
        <div className="lbl" style={{ marginBottom: 6 }}><span>Progress</span><span>{pct}%</span></div>
        <div className="bar"><i style={{ width: pct + "%" }} /></div>
      </div>
    </div>
  );
}

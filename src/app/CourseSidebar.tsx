import { Link } from "react-router-dom";
import { CURRICULUM } from "../curriculum";
import { DEFAULT_STEP_COUNT, LESSON_BY_ID, LESSONS } from "../lessons";
import type { Progress } from "../hooks/useProgress";

interface Props { currentId: string; currentIdx: number; progress: Progress }

const reachedOf = (id: string, p: Progress, cur: string, idx: number) => Math.max(p[id] ?? 0, id === cur ? idx : 0);
const doneOf = (id: string, reached: number) => reached >= (DEFAULT_STEP_COUNT[id] ?? 1) - 1;

/** The course tree. Lessons that exist link to their first step, the rest are listed as "soon". */
export default function CourseSidebar({ currentId, currentIdx, progress }: Props) {
  const completed = LESSONS.filter((l) => doneOf(l.id, reachedOf(l.id, progress, currentId, currentIdx))).length;
  const planned = CURRICULUM.reduce((n, s) => n + s.lessons.length, 0);

  return (
    <aside className="side" aria-label="Course">
      {CURRICULUM.map((sec) => {
        const live = sec.lessons.filter((l) => LESSON_BY_ID[l.id]);
        const open = live.length > 0;
        return (
          <details className="sec" key={sec.id} open={open} style={{ "--sec": sec.color } as React.CSSProperties}>
            <summary>{sec.n} {sec.name}<small>{live.length}/{sec.lessons.length}</small></summary>
            <ul>
              {sec.lessons.map((l) => {
                if (!LESSON_BY_ID[l.id]) {
                  return <li key={l.id}><span className="lnk soon" aria-disabled="true">{l.name}<small className="soon-tag">soon</small></span></li>;
                }
                const reached = reachedOf(l.id, progress, currentId, currentIdx);
                const done = doneOf(l.id, reached);
                return (
                  <li key={l.id}>
                    <Link to={`/${l.id}/1`} className={`lnk live${l.id === currentId ? " on" : ""}`} aria-current={l.id === currentId ? "page" : undefined}>
                      <span className={`dot${done ? " done" : reached > 0 ? " part" : ""}`} aria-hidden="true" />
                      {l.name}
                      <span className="sr">{done ? ", complete" : reached > 0 ? ", in progress" : ""}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </details>
        );
      })}
      <div className="side-foot">
        {completed} of {LESSONS.length} lessons done · {planned} planned
        <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={LESSONS.length} aria-valuenow={completed}>
          <i style={{ width: `${(completed / LESSONS.length) * 100}%` }} />
        </div>
      </div>
    </aside>
  );
}

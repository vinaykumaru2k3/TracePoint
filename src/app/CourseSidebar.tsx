import { useRef } from "react";
import { Link } from "react-router-dom";
import { COURSE, folderName } from "../curriculum";
import { Icon } from "../design/ui";
import { DEFAULT_STEP_COUNT, LESSON_BY_ID, LESSONS } from "../lessons";
import type { Progress } from "../hooks/useProgress";

interface Props { currentId: string; currentIdx: number; progress: Progress }

const reachedOf = (id: string, p: Progress, cur: string, idx: number) => Math.max(p[id] ?? 0, id === cur ? idx : 0);
const lastOf = (id: string) => Math.max(1, (DEFAULT_STEP_COUNT[id] ?? 1) - 1);
const doneOf = (id: string, reached: number) => reached >= lastOf(id);

/** A lesson's mark: an empty ring, a ring filling with the share of steps reached, then a check badge. */
function StatusMark({ done, fraction, fresh }: { done: boolean; fraction: number; fresh: boolean }) {
  if (done) return <span className={`badge${fresh ? " fresh" : ""}`} aria-hidden="true"><Icon name="check" size={10} /></span>;
  const pct = Math.round(Math.min(1, Math.max(0, fraction)) * 100);
  return (
    <svg className="ring" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" focusable="false">
      <circle className="ring-track" cx="7" cy="7" r="5.5" />
      {pct > 0 && <circle className="ring-arc" cx="7" cy="7" r="5.5" pathLength={100} strokeDasharray={`${pct} 100`} />}
    </svg>
  );
}

/** The course tree. Lessons that exist link to their first step, the rest are listed as "soon". */
export default function CourseSidebar({ currentId, currentIdx, progress }: Props) {
  const isDone = (id: string) => doneOf(id, reachedOf(id, progress, currentId, currentIdx));
  const completed = LESSONS.filter((l) => isDone(l.id)).length;
  const planned = COURSE.sections.reduce((n, s) => n + s.lessons.length, 0);
  /* Lessons already done when the tree mounted keep a still badge; one finished now pops in once. */
  const doneAtMount = useRef<Set<string> | null>(null);
  if (!doneAtMount.current) doneAtMount.current = new Set(LESSONS.filter((l) => isDone(l.id)).map((l) => l.id));

  return (
    <nav className="side" aria-label="Course">
      <div className="pane-title" aria-hidden="true">EXPLORER</div>
      <div className="tree">
      <details open className="root">
        <summary><Icon name="folder" size={14} /><span className="sec-name">{COURSE.name}/</span><small>{planned} lessons</small></summary>
        <div className="root-body">
      {COURSE.sections.map((sec) => {
        const live = sec.lessons.filter((l) => LESSON_BY_ID[l.id]);
        const doneHere = live.filter((l) => isDone(l.id)).length;
        const allDone = live.length > 0 && doneHere === live.length;
        const open = sec.lessons.some((l) => l.id === currentId);
        return (
          <details className="sec" key={sec.id} open={open}>
            <summary>
              <Icon name="folder" size={14} /><span className="sec-name" title={sec.name}>{folderName(sec)}</span>
              {!live.length ? <small>soon</small>
                : allDone ? <small className="sec-done"><span className="badge sm" aria-hidden="true"><Icon name="check" size={8} /></span>done<span className="sr">, all {live.length} lessons complete</span></small>
                : <small title={`${doneHere} of ${live.length} lessons complete`}>{doneHere}/{live.length}<span className="sr"> lessons complete</span></small>}
            </summary>
            <ul>
              {sec.lessons.map((l) => {
                if (!LESSON_BY_ID[l.id]) {
                  return <li key={l.id}><span className="lnk soon" aria-disabled="true"><span className="nm">{l.name}</span><small className="soon-tag">soon</small></span></li>;
                }
                const reached = reachedOf(l.id, progress, currentId, currentIdx);
                const done = doneOf(l.id, reached);
                return (
                  <li key={l.id}>
                    <Link to={`/${l.id}/1`} className={`lnk live${l.id === currentId ? " on" : ""}${done ? " done" : ""}`} aria-current={l.id === currentId ? "page" : undefined} title={l.name}>
                      <StatusMark done={done} fraction={reached / lastOf(l.id)} fresh={done && !doneAtMount.current!.has(l.id)} />
                      <span className="nm">{l.name}</span>
                      <span className="sr">{done ? ", complete" : reached > 0 ? ", in progress" : ""}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </details>
        );
      })}
        </div>
      </details>
      </div>
      <div className="side-foot">
        <span className="lbl">Progress</span> <b>{completed} / {LESSONS.length}</b> live lessons done
        <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={LESSONS.length} aria-valuenow={completed}>
          <i style={{ width: `${(completed / LESSONS.length) * 100}%` }} />
        </div>
      </div>
    </nav>
  );
}

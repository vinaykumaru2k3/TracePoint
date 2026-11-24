import { useState, type SyntheticEvent } from "react";
import { Icon } from "../design/ui";
import { useStoredFlag } from "../hooks/useStoredFlag";
import type { AnyLesson, MemoryCell } from "../engine/types";

/** The diagram's state in words, read from the memory strip: "Stack: [0] 4, [1] 9. top is 9". Big grids keep only the note. */
export function describeMemory(mem: { title: string; cells: MemoryCell[]; note: string }) {
  if (mem.cells.length > 16) return `${mem.title}. ${mem.note}`;
  const cells = mem.cells.map((c, i) => `${c.tag ?? `[${i}]`} ${c.v === null ? "empty" : c.v}${c.marks.length ? ` (${c.marks.join(", ")})` : ""}`);
  return `${mem.title}: ${cells.join(", ")}. ${mem.note}`;
}

/** Open only on tall screens (1000px and up); folded on short ones so the code box keeps its height. The summary still shows progress. */
export function LearnList({ items }: { items: (readonly [string, boolean])[] }) {
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

/** Folds to its header line when the reader wants the stage taller; the choice is remembered. */
export function MemoryStrip({ lesson, step }: { lesson: AnyLesson; step: ReturnType<AnyLesson["generate"]>[number] }) {
  const mem = lesson.memory(step);
  const [open, setOpen] = useStoredFlag("tracepoint-memory", false);
  /* Driven by the toggle event, so a browser opening the fold itself (find in page) keeps state in step. */
  const onToggle = (e: SyntheticEvent<HTMLDetailsElement>) => setOpen(e.currentTarget.open);
  return (
    <details className="mem" open={open} onToggle={onToggle}>
      <summary className="memhead">
        <span className="memtitle">{mem.title}</span>
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

/** The result box's label: `<op> returns`, or `answer` when the op is itself a `return`, so it never reads `return 2 returns`. */
export function resultLabel(op: string): string {
  return /^return\b/.test(op) ? "answer" : `${op} returns`;
}

/** The live values worth showing: a metric with no value yet (`-` or empty) is left out, on any step. */
export function shownMetrics<M extends { value: string | number }>(metrics: M[]): M[] {
  return metrics.filter((m) => m.value !== "-" && m.value !== "");
}

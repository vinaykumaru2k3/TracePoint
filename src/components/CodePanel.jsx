import { useEffect, useRef, useState } from "react";

const RE = /\b(class|private|void|int|if|throw|new|return|null)\b|\b([A-Z][A-Za-z]+)\b|\b(\d+)\b/g;

/* Java syntax colouring as React nodes (no innerHTML). */
function colour(src) {
  const out = [];
  let last = 0, m, i = 0;
  RE.lastIndex = 0;
  while ((m = RE.exec(src))) {
    if (m.index > last) out.push(src.slice(last, m.index));
    out.push(<span key={i++} className={m[1] ? "k" : m[2] ? "t" : "n"}>{m[0]}</span>);
    last = m.index + m[0].length;
  }
  if (last < src.length) out.push(src.slice(last));
  return out;
}

const reduced = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function CodePanel({ lesson, step, idx }) {
  const total = step.lines.length;
  const [shown, setShown] = useState(() => (reduced() ? total : 0));
  const [seenIdx, setSeenIdx] = useState(idx);
  const codeRef = useRef(null);

  /* New step: restart the line-by-line reveal (state reset during render, before paint). */
  if (seenIdx !== idx) {
    setSeenIdx(idx);
    setShown(reduced() ? total : 0);
  }

  useEffect(() => {
    if (reduced()) return undefined;
    const timers = step.lines.map((_, k) => setTimeout(() => setShown(k + 1), k * 380));
    return () => timers.forEach(clearTimeout);
  }, [step]);

  /* Keep the first executed line in view when the code box scrolls. */
  useEffect(() => {
    const el = codeRef.current;
    if (!el || !step.lines.length || el.scrollHeight <= el.clientHeight) return;
    const row = el.children[step.lines[0] - 1];
    if (row) el.scrollTop = Math.max(0, row.offsetTop - el.clientHeight / 3);
  }, [step]);

  const on = new Set(step.lines.slice(0, shown));
  const noteMap = Object.fromEntries(step.notes);
  const rows = step.lines.slice(0, shown).filter((ln) => noteMap[ln]);
  const vars = lesson.kind === "stack" ? `top = ${step.top}` : `head = ${step.head}   size = ${step.size}`;

  return (
    <section className="codewrap" aria-label="Java code">
      <div className="codehead"><span className="lang">Java</span><span className="vars">{vars}</span></div>
      <pre className="code" ref={codeRef}>
        {lesson.code.map((line, k) => (
          <div className={"ln" + (on.has(k + 1) ? " on" : "")} key={k}>
            <span className="no">{k + 1}</span><span>{colour(line)}</span>
          </div>
        ))}
      </pre>
      <div className="trace" aria-live="polite">
        {!total
          ? <div className="idle">Step forward to see which lines run.</div>
          : rows.map((ln) => <div className="row" key={ln}><b>line {ln}</b><span>{noteMap[ln]}</span></div>)}
      </div>
    </section>
  );
}

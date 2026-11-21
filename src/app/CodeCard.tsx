import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { linesFor, parseAll } from "../engine/anchors";
import { LANGS, type AnyLesson, type AnyStep, type Lang } from "../engine/types";
import { useLang } from "../hooks/useLang";

const KEYWORDS: Record<Lang, string> = {
  java: "class|private|void|int|if|throw|new|return|null",
  python: "class|def|if|raise|return|None|self",
  cpp: "class|private|public|void|int|if|throw|new|return|const|nullptr"
};
const COMMENT: Record<Lang, string> = { java: "//.*", python: "#.*", cpp: "//.*|#include.*" };
const RES = Object.fromEntries(LANGS.map(({ id }) => [id,
  new RegExp(`(${COMMENT[id]})|("[^"]*")|\\b(${KEYWORDS[id]})\\b|\\b([A-Z][A-Za-z_]+)\\b|\\b(\\d+)\\b`, "g")])) as Record<Lang, RegExp>;

/** Syntax colouring as React nodes (no innerHTML). */
function colour(src: string, lang: Lang): ReactNode[] {
  const re = RES[lang];
  const out: ReactNode[] = [];
  let last = 0, i = 0, m: RegExpExecArray | null;
  re.lastIndex = 0;
  while ((m = re.exec(src))) {
    if (m.index > last) out.push(src.slice(last, m.index));
    out.push(<span key={i++} className={m[1] ? "c" : m[2] ? "s" : m[3] ? "k" : m[4] ? "t" : "n"}>{m[0]}</span>);
    last = m.index + m[0].length;
  }
  if (last < src.length) out.push(src.slice(last));
  return out;
}

const reduced = () => !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

interface Props { lesson: AnyLesson; step: AnyStep; idx: number }

/** Code with Java, Python and C++ tabs. The highlight follows the step's anchors, so it stays in sync in every language. */
export default function CodeCard({ lesson, step, idx }: Props) {
  const [lang, setLang] = useLang();
  const code = useMemo(() => parseAll(lesson.code), [lesson]);
  const parsed = code[lang];
  const lines = linesFor(parsed, step.anchors);
  const total = lines.length;

  const [shown, setShown] = useState(() => (reduced() ? total : 0));
  const [seenIdx, setSeenIdx] = useState(idx);
  const codeRef = useRef<HTMLPreElement>(null);

  /* New step: restart the line-by-line reveal (state reset during render, before paint). */
  if (seenIdx !== idx) {
    setSeenIdx(idx);
    setShown(reduced() ? total : 0);
  }

  useEffect(() => {
    if (reduced()) return undefined;
    const timers = Array.from({ length: total }, (_, k) => setTimeout(() => setShown(k + 1), k * 380));
    return () => timers.forEach(clearTimeout);
  }, [step, total]);

  /* Keep the first executed line in view when the code box scrolls. */
  useEffect(() => {
    const el = codeRef.current;
    if (!el || !total || el.scrollHeight <= el.clientHeight) return;
    const row = el.children[lines[0] - 1] as HTMLElement | undefined;
    if (row) el.scrollTop = Math.max(0, row.offsetTop - el.clientHeight / 3);
  }, [step, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const on = new Set(lines.slice(0, shown));
  const rows = step.anchors.filter((a) => step.notes[a] && parsed.anchors[a] && on.has(parsed.anchors[a][0]));

  return (
    <section className="card codewrap" aria-label="Code">
      <div className="codetabs" role="tablist" aria-label="Language">
        {LANGS.map(({ id, label }) => (
          <button key={id} role="tab" aria-selected={lang === id} onClick={() => setLang(id)}>{label}</button>
        ))}
        <span className="vars">{lesson.vars(step)}</span>
      </div>
      <pre className="code" ref={codeRef}>
        {parsed.lines.map((line, k) => (
          <div className={"ln" + (on.has(k + 1) ? " on" : "")} key={k}>
            <span className="no">{k + 1}</span><span>{colour(line, lang)}</span>
          </div>
        ))}
      </pre>
      <div className="trace" aria-live="polite">
        {!total
          ? <div className="idle">Step forward to see which lines run.</div>
          : rows.map((a) => <div className="row" key={a}><b>line {parsed.anchors[a][0]}</b><span>{step.notes[a]}</span></div>)}
      </div>
    </section>
  );
}

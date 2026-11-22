import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { linesFor, parseAll } from "../engine/anchors";
import { LANGS, type AnyLesson, type AnyStep, type Lang } from "../engine/types";
import { useLang } from "../hooks/useLang";

const KEYWORDS: Record<Lang, string> = {
  java: "class|private|public|static|final|void|int|boolean|long|if|else|for|while|break|continue|throw|new|return|null|true|false|this",
  python: "class|def|if|elif|else|for|while|in|is|not|and|or|break|continue|raise|return|None|True|False|self|pass",
  cpp: "class|struct|private|public|static|constexpr|void|int|bool|auto|if|else|for|while|break|continue|throw|new|return|const|nullptr|true|false|this"
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

const reduced = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

interface Props { lesson: AnyLesson; step: AnyStep; idx: number; /** Text for the empty trace strip. */ idle?: string }

/** Code with Java, Python and C++ tabs. The highlight follows the step's anchors, so it stays in sync in every language. */
export default function CodeCard({ lesson, step, idx, idle = "Step forward to see which lines run." }: Props) {
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

  /* Keep every line this step runs in view. Rows are measured against the scroller's own box
     (offsetTop would be relative to the page, since the pre is not positioned). Only the code box
     scrolls, never the page. */
  useEffect(() => {
    const el = codeRef.current;
    if (!el || !total || el.scrollHeight <= el.clientHeight) return;
    const first = el.children[Math.min(...lines) - 1] as HTMLElement | undefined;
    const lastRow = el.children[Math.max(...lines) - 1] as HTMLElement | undefined;
    if (!first || !lastRow) return;
    const box = el.getBoundingClientRect();
    const top = first.getBoundingClientRect().top - box.top + el.scrollTop;
    const bottom = lastRow.getBoundingClientRect().bottom - box.top + el.scrollTop;
    const room = el.clientHeight, margin = Math.min(48, room / 6);
    const visible = top >= el.scrollTop + margin / 2 && bottom <= el.scrollTop + room - margin / 2;
    if (visible) return;
    const span = bottom - top;
    const want = span + 2 * margin <= room ? top - (room - span) / 2 : top - margin;
    el.scrollTo({ top: Math.max(0, want), behavior: reduced() ? "auto" : "smooth" });
  }, [step, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const on = new Set(lines.slice(0, shown));
  const rows = step.anchors.filter((a) => step.notes[a] && parsed.anchors[a] && on.has(parsed.anchors[a][0]));

  /* Tabs: arrows, Home and End move focus and selection together; only the selected tab is a Tab stop. */
  const tabsRef = useRef<HTMLDivElement>(null);
  const onTabKey = (e: KeyboardEvent) => {
    const i = LANGS.findIndex((l) => l.id === lang);
    const to = e.key === "ArrowRight" ? (i + 1) % LANGS.length : e.key === "ArrowLeft" ? (i + LANGS.length - 1) % LANGS.length
      : e.key === "Home" ? 0 : e.key === "End" ? LANGS.length - 1 : -1;
    if (to < 0) return;
    e.preventDefault();
    setLang(LANGS[to].id);
    tabsRef.current?.querySelectorAll<HTMLButtonElement>("[role='tab']")[to]?.focus();
  };

  return (
    <section className="card codewrap" aria-label="Code">
      <div className="codetabs">
        <span className="pane-title-label" aria-hidden="true">CODE</span>
        <div role="tablist" aria-label="Language" ref={tabsRef} onKeyDown={onTabKey}>
          {LANGS.map(({ id, label }) => (
            <button key={id} id={`tab-${id}`} type="button" role="tab" aria-selected={lang === id} tabIndex={lang === id ? 0 : -1} onClick={() => setLang(id)}>{label}</button>
          ))}
        </div>
        <span className="vars">{lesson.vars(step)}</span>
      </div>
      <pre className="code" ref={codeRef} role="tabpanel" aria-labelledby={`tab-${lang}`} tabIndex={0}>
        {parsed.lines.map((line, k) => {
          const indent = line.length - line.trimStart().length;
          return (
            <div className={"ln" + (on.has(k + 1) ? " on" : "")} key={k}>
              <span className="no">{k + 1}</span>
              <span className="src" style={indent ? { paddingLeft: `${indent + 2}ch` } : undefined}>{colour(line.slice(indent), lang)}</span>
            </div>
          );
        })}
      </pre>
      <div className="trace">
        {!total
          ? <div className="idle">{idle}</div>
          : rows.map((a) => <div className="row" key={a}><b>line {parsed.anchors[a][0]}</b><span>{step.notes[a]}</span></div>)}
      </div>
    </section>
  );
}

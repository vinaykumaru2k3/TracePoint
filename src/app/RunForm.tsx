import { useEffect, useMemo, useRef, useState, type SyntheticEvent } from "react";
import { Icon } from "../design/ui";
import { useStoredFlag } from "../hooks/useStoredFlag";
import type { AnyLesson } from "../engine/types";
import { MAX_INPUT } from "./useLessonRun";

interface Props {
  lesson: AnyLesson; text: string; linkError: string; onRun(raw: string): void;
  /** The input as the URL asked for it, so a bad link's input stays in the box. */
  asked?: string | null;
  /** The step on screen: a Run error is about the input that failed, so it is stale once the step moves on. */
  step?: number;
  /** Forces the fold open. */
  open?: boolean;
  /** The run is the learner's own input, so its form stays open. */
  custom?: boolean;
}

/** The input, Run, the live check and the share link. The page keys it on the run, so Back and Forward reset the box. */
export default function RunForm({ lesson, text, linkError, onRun, asked = null, step = 0, open: forceOpen = false, custom = false }: Props) {
  const [draft, setDraft] = useState(asked !== null && asked.length <= MAX_INPUT ? asked : text);
  const [fail, setFail] = useState<{ msg: string; step: number } | null>(null);
  const [typed, setTyped] = useState(false);
  const [stored, setStored] = useStoredFlag("tracepoint-run-open", false);
  const forced = forceOpen || custom || !!linkError;
  const [open, setOpen] = useState(stored || forced);
  /* The browser can open or close a <details> itself (find in page, a click), so the state follows its toggle event. */
  const onToggle = (e: SyntheticEvent<HTMLDetailsElement>) => {
    const o = e.currentTarget.open;
    setOpen(o);
    if (!forced) setStored(o);
  };
  const error = fail && fail.step === step ? fail.msg : typed ? "" : linkError;

  const run = (raw: string) => {
    if (raw.length > MAX_INPUT) { setFail({ msg: `That input is too long to run. Keep it to ${MAX_INPUT} characters or fewer.`, step }); return; }
    const r = lesson.parse(raw);
    if (!r.ok) { setFail({ msg: r.error, step }); return; }
    setFail(null);
    setDraft(raw);
    onRun(raw);
  };
  /* Checked as you type, shown quietly; the alert is kept for a failed Run. */
  const check = useMemo(() => (draft === text || draft.length > MAX_INPUT ? null : lesson.parse(draft)), [draft, text, lesson]);

  const [copyState, setCopyState] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = async () => {
    try { await navigator.clipboard.writeText(window.location.href); setCopyState("Copied"); }
    catch { setCopyState("Could not copy. Use the address bar."); }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopyState(""), 2400);
  };

  return (
    <details className="run-fold" open={open} onToggle={onToggle}>
      <summary><span>Try your own input</span><span className="run-fold-label">{` · ${lesson.inputLabel}`}</span></summary>
      <form className="run" onSubmit={(e) => { e.preventDefault(); run(draft); }}>
      <label htmlFor="ops">{lesson.inputLabel}</label>
      <div className="run-row">
        <input id="ops" type="text" value={draft} onChange={(e) => { setDraft(e.target.value); setFail(null); setTyped(true); }} spellCheck={false} autoComplete="off"
          aria-describedby={error ? "ops-err ops-hint" : "ops-hint ops-check"} aria-invalid={!!error || (check ? !check.ok : false)} />
        <select aria-label="Examples" value="" onChange={(e) => e.target.value && run(e.target.value)}>
          <option value="">Examples…</option>
          <option value={lesson.defaultText}>Default run</option>
          {lesson.presets.map((p: { label: string; text: string }) => <option key={p.label} value={p.text}>{p.label}</option>)}
        </select>
        <button className="btn sm" type="submit">Run</button>
        <button className="btn sm" type="button" onClick={copy}><Icon name="link" size={12} />Copy link</button>
        <span className="copy-state" role="status">{copyState}</span>
      </div>
      {error && <p className="err" role="alert" id="ops-err">{error}</p>}
      <p className={error || check ? "hint" : "hint quiet"} id="ops-hint">{lesson.inputHint}</p>
      {draft !== text && <button className="btn sm" type="button" onClick={() => { setDraft(text); setFail(null); setTyped(false); }}>Back to the running input</button>}
      {!error && check && <p className={check.ok ? "check ok" : "check"} id="ops-check">{check.ok ? "Ready: press Run." : `Not runnable yet: ${check.error}`}</p>}
      </form>
    </details>
  );
}

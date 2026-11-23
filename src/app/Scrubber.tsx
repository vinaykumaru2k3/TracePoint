import { useRef, useState, type CSSProperties, type KeyboardEvent as RKeyboardEvent, type PointerEvent as RPointerEvent } from "react";
import { kindColor } from "../design/ui";
import type { AnyStep } from "../engine/types";

/**
 * The step a key asks for on the slider, or null for a key it leaves alone.
 * PageUp and PageDown move by a tenth of the run, never less than one step.
 */
export function scrubKey(key: string, idx: number, last: number): number | null {
  const page = Math.max(1, Math.round((last + 1) / 10));
  let to: number;
  switch (key) {
    case "ArrowLeft": case "ArrowUp": to = idx - 1; break;
    case "ArrowRight": case "ArrowDown": to = idx + 1; break;
    case "Home": to = 0; break;
    case "End": to = last; break;
    case "PageUp": to = idx - page; break;
    case "PageDown": to = idx + page; break;
    default: return null;
  }
  return Math.max(0, Math.min(last, to));
}

interface Props {
  steps: AnyStep[]; idx: number; reached: number;
  /** The short name on the knob. */
  name(i: number): string;
  title(i: number): string;
  onJump(i: number): void;
}

/* The timeline is a scrubber: one track, one tick per step in its kind's colour. The walked stretch is filled in
   ink up to the playhead, an ember knob carrying the current step's number and name. Click or drag anywhere on the
   track to scrub; the slider handles its own keys. Hovering previews a step's title in the header without moving
   the playhead. The track always fits its width, however long the run. It owns the hover and drag state, so a
   hover re-renders only this component. */
export default function Scrubber({ steps, idx, reached, name, title, onJump }: Props) {
  const [peek, setPeek] = useState<number | null>(null);
  const scrubRef = useRef<HTMLDivElement>(null);
  const scrubbing = useRef(false);
  const last = steps.length - 1;
  const nn = (i: number) => String(i + 1).padStart(steps.length > 99 ? 3 : 2, "0");
  const stepOf = `Step ${idx + 1} of ${steps.length}`;

  const stepAt = (clientX: number) => {
    const r = scrubRef.current?.getBoundingClientRect();
    if (!r || r.width === 0) return idx;
    return Math.max(0, Math.min(last, Math.floor(((clientX - r.left) / r.width) * steps.length)));
  };
  const onDown = (e: RPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    scrubbing.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const i = stepAt(e.clientX);
    if (i !== idx) onJump(i);
  };
  const onMove = (e: RPointerEvent<HTMLDivElement>) => {
    const i = stepAt(e.clientX);
    if (scrubbing.current) { if (i !== idx) onJump(i); }
    else if (e.pointerType === "mouse") setPeek(i);
  };
  const onEnd = () => { scrubbing.current = false; };
  /* The slider owns its keys. Stopping the event keeps the global handler from stepping a second time. */
  const onKeyDown = (e: RKeyboardEvent<HTMLDivElement>) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const to = scrubKey(e.key, idx, last);
    if (to === null) return;
    e.preventDefault();
    e.stopPropagation();
    if (to !== idx) onJump(to);
  };

  const tickCls = (i: number) => (i === idx ? "cur" : i < idx ? "past" : i <= reached ? "seen" : "") + (peek === i && i !== idx ? " pk" : "");
  const shown = peek !== null && peek !== idx ? peek : idx;
  const at = (i: number) => `${((i + 0.5) / steps.length) * 100}%`;
  return (
    <div className="rail-wrap">
      <div className="rail-head">
        <span className="lbl">Timeline</span>
        <span className={`muted rail-read${shown !== idx ? " peeking" : ""}`}>
          {shown === idx ? stepOf : `Jump to step ${shown + 1}`} · <b>{title(shown)}</b>
        </span>
      </div>
      <div className="scrub" ref={scrubRef} role="slider" tabIndex={0} aria-label="Step"
        aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={idx + 1} aria-valuetext={`${stepOf}: ${title(idx)}`}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onEnd} onPointerCancel={onEnd}
        onPointerLeave={() => setPeek(null)} onKeyDown={onKeyDown}
        style={{ "--x": (idx + 0.5) / steps.length } as CSSProperties}>
        <ol className="scrub-ticks" aria-hidden="true" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
          {steps.map((s, i) => <li key={i} className={tickCls(i)} style={{ "--k": kindColor(s.kind) } as CSSProperties} />)}
        </ol>
        <div className="scrub-base" aria-hidden="true"><i style={{ width: at(idx) }} /></div>
        <span className="scrub-head" aria-hidden="true" style={{ left: at(idx) }}>
          <b><span className="n">{nn(idx)}</span>{name(idx)}</b>
        </span>
      </div>
      <div className="scrub-scale" aria-hidden="true"><span>{nn(0)}</span><span>{nn(last)}</span></div>
    </div>
  );
}

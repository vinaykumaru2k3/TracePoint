import { useEffect, useRef } from "react";
import { stepLabel } from "../engine/buildSteps.js";

export default function StepRail({ steps, idx, reached, onGo }) {
  const scrollRef = useRef(null);
  const nowRef = useRef(null);

  useEffect(() => {
    const sc = scrollRef.current, li = nowRef.current;
    if (sc && li) sc.scrollLeft = Math.max(0, li.offsetLeft - sc.clientWidth / 2 + li.clientWidth / 2);
  }, [idx]);

  return (
    <div className="railscroll" ref={scrollRef}>
      <ol className="rail">
        {steps.map((s, k) => (
          <li key={k} ref={k === idx ? nowRef : null} className={(k <= reached ? "seen " : "") + (k === idx ? "now" : "")}>
            <button type="button" className="dot" aria-label={`Go to step ${k + 1}: ${stepLabel(s)}`} onClick={() => onGo(k)}>{k}</button>
            <span className="lab">{stepLabel(s)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

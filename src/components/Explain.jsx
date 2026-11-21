import { stepLabel } from "../engine/buildSteps.js";

export default function Explain({ lesson, steps, idx, onBack, onNext }) {
  const s = steps[idx], isStack = lesson.kind === "stack";
  const kindText = { start: "start", add: isStack ? "push" : "offer", remove: isStack ? "pop" : "poll", peek: "peek", empty: "empty" }[s.kind];
  const last = idx >= steps.length - 1;
  return (
    <section className="explain">
      <div className="cap-top">
        <span className="stepno">Step {idx + 1} / {steps.length}</span>
        <span className={"kind " + s.kind}>{kindText}</span>
      </div>
      <h2>{s.title}</h2>
      <div className={"opchip" + (s.op ? "" : " idle")}>{s.op || "start"}</div>
      <p id="caption" aria-live="polite">{s.text}</p>
      <div className="idea"><small>Key idea</small><span>{s.idea}</span></div>
      <div className="nav">
        <button className="btn" onClick={onBack} disabled={idx === 0}>&larr; Back</button>
        <button className="btn primary" onClick={onNext}>
          {last ? "Replay lesson" : `Next: ${stepLabel(steps[idx + 1])} →`}
        </button>
      </div>
    </section>
  );
}

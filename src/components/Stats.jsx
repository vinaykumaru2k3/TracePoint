import { useEffect, useRef } from "react";

function Stat({ label, value }) {
  const prev = useRef(undefined);
  const pulse = prev.current !== undefined && prev.current !== value;
  useEffect(() => { prev.current = value; });
  return (
    <div className="st">
      <small>{label}</small>
      <b key={value} className={pulse ? "pulse" : ""}>{value}</b>
    </div>
  );
}

export default function Stats({ lesson, step }) {
  const cap = lesson.cap, n = step.items.length;
  const isStack = lesson.kind === "stack";
  const nextWrite = isStack
    ? (step.top + 1 < cap ? step.top + 1 : "full")
    : (n < cap ? (step.head + step.size) % cap : "full");
  const rows = [
    ["Size", n],
    [isStack ? "Top" : "Head", isStack ? step.top : step.head],
    ["Next write", nextWrite],
    ["Free", cap - n]
  ];
  return (
    <div className="stats">
      {rows.map(([label, v]) => <Stat key={label} label={label} value={String(v)} />)}
    </div>
  );
}

export default function Memory({ lesson, step }) {
  const cap = lesson.cap, isStack = lesson.kind === "stack";
  const cells = [];
  for (let i = 0; i < cap; i++) {
    const v = step.arr[i];
    const live = isStack ? i <= step.top : ((i - step.head + cap) % cap) < step.size;
    const marks = [];
    if (isStack) { if (i === step.top) marks.push("top"); }
    else {
      if (step.size > 0 && i === step.head) marks.push("head");
      if (step.size < cap && i === (step.head + step.size) % cap) marks.push("next");
    }
    const cls = "cell" + (v === null ? " empty" : (live ? "" : " stale")) + (i === step.cell ? " act" : "");
    cells.push(
      <div className={cls} key={i}>
        <div className="box">{v === null ? "·" : v}</div>
        <div className="idx">[{i}]</div>
        <div className="mk">{marks.join(" ")}</div>
      </div>
    );
  }
  return (
    <div>
      <div className="memhead">
        <div className="lbl" style={{ margin: 0 }}><span>In memory: int[] data</span></div>
        <div className="costs">
          {lesson.costs.map(([name, cost]) => <span key={name}><b>{cost}</b> {name}</span>)}
        </div>
      </div>
      <div className="cells" style={{ gridTemplateColumns: `repeat(${cap}, minmax(0, 1fr))` }}>{cells}</div>
      <p className="memnote">
        {isStack
          ? "Dashed cells are not part of the stack. Popped values stay behind until overwritten."
          : "The array is reused in a circle: after the last slot, the next write goes back to slot 0."}
      </p>
    </div>
  );
}

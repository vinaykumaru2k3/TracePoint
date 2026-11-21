import { useLayoutEffect, useRef, useState } from "react";
import { stepLabel } from "../engine/buildSteps.js";

const SLOTS = 6, SGAP = 6, SFLOOR = 12;

/* Geometry is computed from the stage size so the diagram fills whatever room it has. */
function geo(lesson, W, H) {
  if (lesson.kind === "stack") {
    const avail = H - SFLOOR - 26;
    const h = Math.max(24, Math.min(72, Math.floor(avail / SLOTS) - SGAP));
    const w = Math.max(110, Math.min(300, Math.round(W * 0.36)));
    return { W, H, h, w, x: Math.round((W - w) / 2) };
  }
  const gap = 10, n = lesson.cap;
  const slotW = Math.max(40, Math.min(140, Math.floor((W - 56 - gap * (n - 1)) / n)));
  return { W, H, gap, slotW, rowY: Math.max(60, Math.round((H - slotW) / 2)), x0: Math.round((W - (slotW * n + gap * (n - 1))) / 2) };
}

function pos(i, g, kind) {
  if (kind === "stack") return { x: g.x, y: g.H - SFLOOR - (i + 1) * (g.h + SGAP) + SGAP };
  return { x: g.x0 + i * (g.slotW + g.gap), y: g.rowY };
}

function itemBox(it, i, g, kind) {
  const p = pos(i, g, kind);
  const w = kind === "stack" ? g.w : g.slotW, h = kind === "stack" ? g.h : g.slotW;
  const fs = Math.round(kind === "stack" ? h * 0.42 : w * 0.3);
  return { id: it.id, v: it.v, x: p.x, y: p.y, w, h, fs };
}

function itemStyle(b, kind) {
  return {
    width: b.w, height: b.h, fontSize: b.fs,
    "--x": b.x + "px", "--y": b.y + "px",
    "--ex": kind === "stack" ? "0px" : "90px", "--ey": kind === "stack" ? "-70px" : "0px",
    "--lx": kind === "stack" ? "0px" : "-60px", "--ly": kind === "stack" ? "-60px" : "0px"
  };
}

export default function Stage({ lesson, step }) {
  const ref = useRef(null);
  const [size, setSize] = useState({ W: 0, H: 0 });
  const [ghosts, setGhosts] = useState([]);
  const prev = useRef(new Map());
  const ghostSeq = useRef(0);
  const timers = useRef([]);
  const kind = lesson.kind;

  useLayoutEffect(() => {
    const el = ref.current;
    const measure = () => setSize((s) => (s.W === el.clientWidth && s.H === el.clientHeight ? s : { W: el.clientWidth, H: el.clientHeight }));
    measure();
    if (!window.ResizeObserver) { window.addEventListener("resize", measure); return () => window.removeEventListener("resize", measure); }
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const g = geo(lesson, size.W || 500, size.H || 300);
  const boxes = step.items.map((it, i) => itemBox(it, i, g, kind));

  /* Items that disappeared since the last step keep playing a leave animation for a moment. */
  useLayoutEffect(() => {
    const now = new Map(boxes.map((b) => [b.id, b]));
    const gone = [...prev.current.values()].filter((b) => !now.has(b.id)).map((b) => ({ ...b, seq: ++ghostSeq.current }));
    prev.current = now;
    if (!gone.length) return undefined;
    setGhosts((gs) => gs.filter((x) => !gone.some((n) => n.id === x.id)).concat(gone));
    const seqs = gone.map((n) => n.seq);
    timers.current.push(setTimeout(() => setGhosts((gs) => gs.filter((x) => !seqs.includes(x.seq))), 520));
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);
  useLayoutEffect(() => () => timers.current.forEach(clearTimeout), []);

  const n = step.items.length;
  const liveIds = new Set(boxes.map((b) => b.id));
  let furniture, ptrs;

  if (kind === "stack") {
    const wl = g.w + 36, left = Math.round((g.W - wl) / 2);
    furniture = (
      <>
        <div className="well" style={{ width: wl, left, bottom: 6, height: SLOTS * (g.h + SGAP) + 12 }} />
        <div className="tubelabel" style={{ left, top: 4, width: wl, textAlign: "center" }}>push / pop here</div>
      </>
    );
    const p = pos(Math.max(n - 1, 0), g, "stack");
    ptrs = (
      <div className={"ptr" + (n ? "" : " dim")}
        style={{ transform: `translate(${Math.min(p.x + g.w + 52, g.W - 120)}px,${p.y + Math.round(g.h / 2) - 9}px)` }}>
        {n ? "← top" : "← top (empty)"}
      </div>
    );
  } else {
    const cap = lesson.cap;
    const tw = g.slotW * cap + g.gap * (cap - 1) + 28, tl = Math.round((g.W - tw) / 2);
    furniture = (
      <>
        <div className="tube" style={{ left: tl, width: tw, top: g.rowY - 12, height: g.slotW + 24 }} />
        <div className="tubelabel" style={{ left: tl, top: Math.max(4, g.rowY - 62) }}>← out</div>
        <div className="tubelabel" style={{ right: tl, top: Math.max(4, g.rowY - 62) }}>in →</div>
        {Array.from({ length: cap }, (_, q) => (
          <div className="slot" key={q} style={{ left: g.x0 + q * (g.slotW + g.gap), top: g.rowY, width: g.slotW, height: g.slotW }} />
        ))}
      </>
    );
    const fp = pos(0, g, "queue"), rp = pos(Math.max(n - 1, 0), g, "queue");
    ptrs = (
      <>
        <div className="ptr" style={{ transform: `translate(${fp.x}px,${fp.y + g.slotW + 18}px)` }}>{n ? "▲ front" : ""}</div>
        <div className="ptr" style={{ transform: `translate(${rp.x}px,${rp.y - 32}px)` }}>{n ? "rear ▼" : ""}</div>
      </>
    );
  }

  const cardCls = step.ret === "void" ? "void" : (step.ret === "throws" ? "throws" : "");

  return (
    <div id="stage" ref={ref} role="img" aria-label="Animated diagram of the data structure">
      {furniture}
      {boxes.map((b) => {
        const cls = "item" + (step.hl === b.id && step.mode === "in" ? " hl-in" : "") + (step.hl === b.id && step.mode === "peek" ? " hl-peek" : "");
        return <div key={b.id} className={cls} style={itemStyle(b, kind)}>{b.v}</div>;
      })}
      {ghosts.filter((x) => !liveIds.has(x.id)).map((b) => (
        <div key={"g" + b.seq} className="item leaving" style={itemStyle(b, kind)}>{b.v}</div>
      ))}
      {ptrs}
      {step.op && (
        <div className="result">
          <small>{stepLabel(step)} returns</small>
          <b className={cardCls}>{step.ret}</b>
          {step.retNote && <em>{step.retNote}</em>}
        </div>
      )}
    </div>
  );
}

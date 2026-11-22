import { LADDER } from "./growth";

/** Work done for input size n, per class on the ladder. */
const F: ((n: number) => number)[] = [
  () => 1, (n) => Math.log2(n), (n) => n, (n) => n * Math.log2(n), (n) => n * n, (n) => 2 ** n, (n) => { let f = 1; for (let k = 2; k <= n; k++) f *= k; return f; }
];
const W = 520, H = 260, L = 40, R = 92, T = 14, B = 34;
const NMAX = 16, YMAX = 64;
const x = (n: number) => L + ((n - 1) / (NMAX - 1)) * (W - L - R);
const y = (v: number) => T + (1 - Math.min(v, YMAX) / YMAX) * (H - T - B);

/** Each curve as a path, cut where it leaves the top of the chart, with the point its label sits at. */
function curve(f: (n: number) => number) {
  const pts: [number, number][] = [];
  for (let n = 1; n <= NMAX; n += 0.125) {
    const v = f(n);
    pts.push([x(n), y(v)]);
    if (v >= YMAX) break;
  }
  const d = pts.map(([px, py], k) => `${k ? "L" : "M"}${px.toFixed(1)} ${py.toFixed(1)}`).join("");
  return { d, end: pts[pts.length - 1] };
}

/* Label heights at the right edge, spread so they never overlap. */
const LABEL_Y: Record<number, number> = { 0: y(1) + 4, 1: Math.min(y(4) + 4, y(1) + 4 - 13), 2: y(16) + 4 };

/**
 * The growth ladder drawn as curves: how much work each class does as n grows.
 * Classes in `marked` are inked; the others stay as faint references.
 */
export default function GrowthChart({ marked }: { marked: Set<number> }) {
  const names = LADDER.filter((_, i) => marked.has(i));
  return (
    <figure className="growth">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Growth curves for ${LADDER.join(", ")}. Marked: ${names.join(", ") || "none"}.`}>
        <g className="g-grid" aria-hidden="true">
          {[0, 16, 32, 48, 64].map((v) => <line key={v} x1={L} x2={W - R} y1={y(v)} y2={y(v)} />)}
          {[1, 4, 8, 12, 16].map((n) => <line key={n} x1={x(n)} x2={x(n)} y1={T} y2={H - B} />)}
        </g>
        <g className="g-axis" aria-hidden="true">
          <line x1={L} x2={W - R} y1={H - B} y2={H - B} />
          <line x1={L} x2={L} y1={T} y2={H - B} />
          {[1, 4, 8, 12, 16].map((n) => <text key={n} x={x(n)} y={H - B + 15} textAnchor="middle">{n}</text>)}
          {[0, 32, 64].map((v) => <text key={v} x={L - 8} y={y(v) + 4} textAnchor="end">{v}</text>)}
          <text x={(L + W - R) / 2} y={H - 4} textAnchor="middle">input size n</text>
        </g>
        {F.map((f, i) => {
          const { d, end } = curve(f);
          const on = marked.has(i);
          const top = end[1] <= T + 1 && end[0] < W - R - 10;
          const lx = top ? end[0] + 4 : W - R + 6;
          const ly = top ? T + 4 + (i - 4) * 12 : LABEL_Y[i] ?? end[1] + 4;
          return (
            <g key={i} className={on ? "g-curve on" : "g-curve"}>
              <path d={d} />
              <text x={lx} y={ly}>{LADDER[i]}</text>
            </g>
          );
        })}
      </svg>
      <figcaption>Steps of work as <code>n</code> grows. Inked curves are the costs on this page; the steep ones leave the chart early.</figcaption>
    </figure>
  );
}

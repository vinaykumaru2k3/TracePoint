import type { Step } from "../../engine/types";
import type { BlockState } from "../../iso/IsoBlock";
import type { Cell } from "../../iso/CellRow";
import type { GridPointer } from "../../iso/GridTable";
import type { DPState, Grid } from "../dpkit";

export interface Interval { s: number; e: number }
export type GreedyInput = Interval[];

export type GreedyState = DPState & {
  /** The end of the last taken interval (0 before any). */
  lastEnd: number;
  taken: number;
  /** Intervals looked at so far. */
  seen: number;
  res: string | null;
};

export const MAX_END = 12;
/** One column per unit of time: plate t is the stretch from t to t + 1. Column 12 holds the pointer when an interval ends at 12. */
const COLS = Array.from({ length: MAX_END + 1 }, (_, i) => String(i));
export const label = (x: Interval) => `${x.s}-${x.e}`;

type Mark = "taken" | "now" | "skipped" | "none";
const STATE: Record<Mark, BlockState> = { taken: "found", now: "active", skipped: "stale", none: "default" };

function rows(list: Interval[], marks: Mark[]): Grid {
  return list.map((x, r) => COLS.map((_, t): Cell =>
    t >= x.s && t < x.e ? { v: marks[r] === "skipped" ? "x" : "", state: STATE[marks[r]] } : { v: null }));
}

export function generateGreedy(input: GreedyInput): Step<GreedyState>[] {
  const steps: Step<GreedyState>[] = [];
  const n = input.length;
  // Stable sort by end: equal ends keep their input order.
  const list = input.map((x, i) => ({ x, i })).sort((a, b) => a.x.e - b.x.e || a.i - b.i).map((o) => o.x);
  let lastEnd = 0, taken = 0, seen = 0;
  let res: string | null = null;

  const snap = (st: Omit<Step<GreedyState>, "state">, ls: Interval[], marks: Mark[], ptrs: GridPointer[] = []) => {
    steps.push({
      ...st,
      state: { kind: "grid", grid: rows(ls, marks), rowHead: ls.map(label), colHead: COLS, ptrs, lastEnd, taken, seen, res }
    });
  };

  snap({
    kind: "problem", op: null, anchors: [], notes: {},
    title: "Pick the most intervals",
    idea: "Take the interval that ends first, then the next one that fits after it, and repeat.",
    text: `An interval is a stretch of time with a start and an end, like 1-3. Two intervals overlap when they share some time. The goal is to pick as many as possible with no overlap. A greedy method makes the best-looking choice at each step and never undoes it. Each row is one interval, and each plate is one unit of time. The interval 1-3 fills plates 1 and 2. You have ${n} interval${n === 1 ? "" : "s"}.`
  }, input, input.map(() => "none"));

  const order = list.map(label).join(", ");
  snap({
    kind: "move", op: "sort by end", anchors: ["greedy.sort"], notes: { "greedy.sort": `sorted: ${order}` },
    title: "Sort by end",
    idea: "Sorting by end puts the interval that frees the time soonest first.",
    text: `The rows are sorted by end, earliest first. Two intervals with the same end keep their input order, because the sort is stable. The order is now ${order}.`
  }, list, list.map(() => "none"));

  snap({
    kind: "peek", op: "last end = 0", anchors: ["greedy.init"], notes: { "greedy.init": "lastEnd = 0, count = 0" },
    title: "Start with last end = 0",
    idea: "last end is where the time taken so far stops. An interval may start there or later.",
    text: "Nothing is taken yet, so count starts at 0 and last end starts at 0, the start of the number line. Every start is 0 or more, so the first interval always fits."
  }, list, list.map(() => "none"), [{ r: 0, c: 0, label: "last end" }]);

  const marks: Mark[] = list.map(() => "none");
  const takenNames: string[] = [];
  list.forEach((x, k) => {
    const ok = x.s >= lastEnd;
    const old = lastEnd;
    seen++;
    const loop = `row ${k + 1} of ${n}: ${label(x)}`;
    if (ok) {
      taken++; lastEnd = x.e; takenNames.push(label(x));
      marks[k] = "now";
      const why = old === 0 && k === 0
        ? `Nothing is taken yet, and ${x.s} >= ${old}.`
        : x.s === old
          ? `It starts at ${x.s}, exactly where the last taken interval ended. The two touch at one point and share no time, so touching is allowed and both fit.`
          : `It starts at ${x.s}, after last end ${old}, so it shares no time with the intervals taken.`;
      snap({
        kind: "add", op: `take ${label(x)}`, anchors: ["greedy.loop", "greedy.cmp", "greedy.take", "greedy.last"],
        notes: { "greedy.loop": loop, "greedy.cmp": `${x.s} >= ${old}: true`, "greedy.take": `count = ${taken}`, "greedy.last": `lastEnd = ${x.e}` },
        title: `Take ${label(x)}`,
        idea: "An interval that starts at or after last end cannot overlap anything taken, so take it and move last end to its end.",
        text: `${why} Take ${label(x)}. Last end moves from ${old} to ${x.e}, and the count is ${taken}.`
      }, list, marks, [{ r: k, c: x.e, label: "last end" }, { r: k, c: x.s, label: "start", dim: true }]);
      marks[k] = "taken";
    } else {
      marks[k] = "skipped";
      snap({
        kind: "check", op: `skip ${label(x)}`, anchors: ["greedy.loop", "greedy.cmp"],
        notes: { "greedy.loop": loop, "greedy.cmp": `${x.s} >= ${old}: false` },
        title: `Skip ${label(x)}`,
        idea: "An interval that starts before last end overlaps the last one taken, so it is skipped.",
        text: `${label(x)} starts at ${x.s}, before ${takenNames[takenNames.length - 1]} ends at ${old}. Since ${x.s} < ${old}, the two overlap. Skip ${label(x)}. Last end stays ${old}.`
      }, list, marks, [{ r: k, c: old, label: "last end" }, { r: k, c: x.s, label: "start", dim: true }]);
    }
  });

  res = String(taken);
  snap({
    kind: "found", op: `return ${taken}`, anchors: ["greedy.ret"], notes: { "greedy.ret": `return ${taken}` },
    title: `Answer: ${taken}`,
    idea: "One pass after the sort is enough, because each interval is compared with last end only.",
    text: `Every interval has been looked at. ${taken} ${taken === 1 ? "interval is" : "intervals are"} taken: ${takenNames.join(", ")}.`,
    ret: res, retNote: `${taken} interval${taken === 1 ? "" : "s"} with no overlap`
  }, list, marks, [{ r: n - 1, c: lastEnd, label: "last end" }]);

  snap({
    kind: "recap", op: null, anchors: [], notes: {},
    title: "Earliest end first",
    idea: "Sort by end, then keep any interval that starts at or after last end. That gives the largest set with no overlap.",
    text: `Sorting by end costs O(n log n) and the scan costs O(n). The picked intervals are ${takenNames.join(", ")}.`,
    ret: res
  }, list, marks);

  // Two neighbours with the same text would share a rail name: tell them apart by position.
  const name = (s: Step<GreedyState>) => s.short ?? s.op;
  for (let i = 1; i < steps.length; i++) {
    if (steps[i].op && name(steps[i]) === name(steps[i - 1])) steps[i].short = `${i - 3}: ${steps[i].op}`.slice(0, 14);
  }
  return steps;
}

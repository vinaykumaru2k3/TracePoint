import type { Step } from "../../engine/types";
import type { BlockState } from "../../iso/IsoBlock";
import type { NumsInput } from "../parseOps";
import { fmt, SortTrace, type SortState } from "../sortkit";

/** Selection sort: find the smallest of the unsorted part and swap it to the front of that part. */
export function generateSelection({ nums }: NumsInput): Step<SortState>[] {
  const t = new SortTrace(nums);
  const a = t.s.a as number[];
  const n = a.length;
  t.push({
    kind: "problem", op: null, anchors: [], notes: {},
    title: `Sort ${fmt(a)} with selection sort`,
    idea: "Pick the smallest remaining value and put it next in line.",
    text: "For each position from the left, scan everything after it for the smallest value, then swap that value into the position. The sorted part grows by one each round."
  });

  for (let i = 0; i < n - 1; i++) {
    let m = i;
    const view = (j: number | null): Partial<SortState> => {
      const marks: Partial<Record<number, BlockState>> = { [i]: "active", [m]: "visited" };
      if (j !== null) marks[j] = "compare";
      return {
        marks,
        ptrs: [{ at: i, label: "i" }, ...(j !== null ? [{ at: j, label: "j" }] : []), { at: m, label: "min" }]
      };
    };
    t.push({
      kind: "peek", op: `i = ${i}`, anchors: ["sl.sig", "sl.outer"],
      notes: { "sl.outer": `i = ${i}, min starts at ${i}` },
      title: `Fill position ${i}`,
      idea: "Assume the first unsorted value is the smallest until the scan proves otherwise.",
      text: `Position ${i} gets the smallest value of a[${i}..${n - 1}]. Start with min at index ${i} (value ${a[i]}).`
    }, view(null));
    for (let j = i + 1; j < n; j++) {
      t.s.compares++;
      const less = a[j] < a[m];
      t.push({
        kind: "check", op: "a[j] < min?", short: `cmp ${j}`, anchors: ["sl.cmp"],
        notes: { "sl.cmp": `${a[j]} < ${a[m]}? ${less ? "yes" : "no"}` },
        title: less ? `${a[j]} < ${a[m]}: a new minimum` : `${a[j]} >= ${a[m]}: keep the minimum`,
        idea: "Every remaining value is compared, even when the smallest is already found.",
        text: less ? `a[${j}] = ${a[j]} is smaller than the current minimum ${a[m]}.` : `a[${j}] = ${a[j]} is not smaller than ${a[m]}. The minimum stays at index ${m}.`
      }, view(j));
      if (less) {
        m = j;
        t.push({
          kind: "move", op: "min = a[j]", short: `min = ${a[j]}`, anchors: ["sl.min"],
          notes: { "sl.min": `min = ${j} (value ${a[j]})` },
          title: `The minimum is now ${a[j]}`,
          idea: "Only the index of the smallest value is remembered; nothing moves yet.",
          text: `min now points at index ${j}. The scan carries on to the end.`
        }, view(null));
      }
    }
    if (m !== i) {
      const lo = a[m], hi = a[i];
      [a[i], a[m]] = [a[m], a[i]];
      t.s.swaps++;
      t.settle(i);
      t.push({
        kind: "add", op: `swap ${i},${m}`, anchors: ["sl.swap"],
        notes: { "sl.swap": `a[${i}] = ${lo}, a[${m}] = ${hi}` },
        title: `${lo} swaps into position ${i}`,
        idea: "One swap per round, so selection sort never makes more than n - 1 swaps.",
        text: `The smallest remaining value ${lo} swaps with ${hi}. Position ${i} is final: ${fmt(a)}.`
      }, { marks: { [i]: "found", [m]: "swap" }, ptrs: [{ at: i, label: "i" }, { at: m, label: "min" }] });
    } else {
      t.settle(i);
      t.push({
        kind: "found", op: `a[${i}] stays`, anchors: ["sl.swap"],
        notes: { "sl.swap": `min == i, no swap needed` },
        title: `${a[i]} is already in place`,
        idea: "When the minimum is already at i, the swap is skipped.",
        text: `The smallest remaining value ${a[i]} is already at position ${i}. No swap.`
      }, { marks: { [i]: "found" }, ptrs: [{ at: i, label: "i" }] });
    }
  }

  return t.finish("sl.sig",
    "Selection sort always makes n(n-1)/2 compares, but at most n - 1 swaps.",
    `${t.s.compares} compares and ${t.s.swaps} swap${t.s.swaps === 1 ? "" : "s"} for ${n} values. The compares don't depend on the input, so it is O(n^2) even when sorted. Few swaps make it useful when writes are expensive. It is not stable.`);
}

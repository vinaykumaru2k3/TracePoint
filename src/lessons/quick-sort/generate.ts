import type { Step } from "../../engine/types";
import type { BlockState } from "../../iso/IsoBlock";
import type { NumsInput } from "../parseOps";
import { fmt, SortTrace, type SortState } from "../sortkit";

/** Quick sort with the Lomuto partition: the pivot is a[hi], and a[lo..i] holds the values below it. */
export function generateQuick({ nums }: NumsInput): Step<SortState>[] {
  const t = new SortTrace(nums);
  const a = t.s.a as number[];
  const n = a.length;
  t.push({
    kind: "problem", op: null, anchors: [], notes: {},
    title: `Sort ${fmt(a)} with quick sort`,
    idea: "Partitioning puts one value, the pivot, in its final place, with smaller values left and the rest right.",
    text: "Take the last value of a range as the pivot. Walk the range and move every smaller value to the left part. Then the pivot drops in right after them, and each side is sorted the same way."
  });

  const view = (lo: number, hi: number, i: number, j: number | null): Partial<SortState> => {
    const marks: Partial<Record<number, BlockState>> = { [hi]: "swap" };
    for (let k = lo; k <= i; k++) marks[k] = "visited";
    if (j !== null) marks[j] = "compare";
    return {
      marks,
      ptrs: [...(i >= lo ? [{ at: i, label: "i" }] : []), ...(j !== null ? [{ at: j, label: "j" }] : []), { at: hi, label: "pivot" }]
    };
  };

  const quick = (lo: number, hi: number) => {
    if (lo >= hi) {
      if (lo === hi) t.settle(lo);
      return;
    }
    const pivot = a[hi];
    let i = lo - 1;
    t.push({
      kind: "peek", op: `pivot = ${pivot}`, anchors: ["qs.sig", "qs.pivot"],
      notes: { "qs.pivot": `pivot = a[${hi}] = ${pivot}` },
      title: `Partition ${lo}..${hi} around ${pivot}`,
      idea: "Lomuto's scheme always takes the last value of the range as the pivot.",
      text: `The range is ${fmt(a.slice(lo, hi + 1))}. The pivot is its last value, ${pivot}. Values smaller than ${pivot} will gather on the left.`
    }, view(lo, hi, i, null));

    for (let j = lo; j < hi; j++) {
      t.s.compares++;
      const less = a[j] < pivot;
      if (less) i++;
      const moves = less && i !== j;
      t.push({
        kind: "check", op: "a[j] < pivot?", short: `cmp ${j}`, anchors: ["qs.cmp"],
        notes: { "qs.cmp": `${a[j]} < ${pivot}? ${less ? "yes" : "no"}` },
        title: less ? `${a[j]} < ${pivot}: it belongs on the left` : `${a[j]} >= ${pivot}: leave it`,
        idea: less ? "The left part grows by one cell to make room." : "Values not smaller than the pivot stay where they are for now.",
        text: less
          ? moves ? `a[${j}] = ${a[j]} is smaller than ${pivot}. i moves to ${i}, and a[${i}] swaps with a[${j}].` : `a[${j}] = ${a[j]} is smaller than ${pivot}, and it is already at the end of the left part (i = ${i}).`
          : `a[${j}] = ${a[j]} is not smaller than ${pivot}. It stays put.`
      }, view(lo, hi, less ? i - 1 : i, j));
      if (moves) {
        [a[i], a[j]] = [a[j], a[i]];
        t.s.swaps++;
        t.push({
          kind: "move", op: `swap ${i},${j}`, anchors: ["qs.swap"],
          notes: { "qs.swap": `a[${i}] = ${a[i]}, a[${j}] = ${a[j]}` },
          title: `${a[i]} moves into the left part`,
          idea: "Smaller values are swapped to the left of the pivot's future spot.",
          text: `${a[i]} swaps with ${a[j]}: ${fmt(a.slice(lo, hi + 1))}.`
        }, view(lo, hi, i, null));
      }
    }

    const p = i + 1;
    if (p !== hi) {
      [a[p], a[hi]] = [a[hi], a[p]];
      t.s.swaps++;
    }
    t.settle(p);
    const singles = [p - 1 === lo ? lo : -1, p + 1 === hi ? hi : -1].filter((k) => k >= 0);
    t.settle(...singles);
    t.push({
      kind: "found", op: `pivot at ${p}`, anchors: singles.length ? ["qs.place", "qs.base"] : ["qs.place"],
      notes: singles.length
        ? { "qs.place": `swap a[${p}] and a[${hi}]`, "qs.base": `a one-value side is already in place` }
        : { "qs.place": `swap a[${p}] and a[${hi}]` },
      title: `${pivot} lands at index ${p}`,
      idea: "Everything left of the pivot is smaller and nothing right of it is, so the pivot never moves again.",
      text: `${p === hi ? `Nothing is bigger, so ${pivot} stays at index ${hi}.` : `${pivot} swaps into index ${p}, right after the smaller values.`} Left side: ${fmt(a.slice(lo, p))}. Right side: ${fmt(a.slice(p + 1, hi + 1))}.`
    }, { marks: { [p]: "found" }, ptrs: [{ at: p, label: "p" }] });

    quick(lo, p - 1);
    quick(p + 1, hi);
  };

  quick(0, n - 1);

  const worst = (n * (n - 1)) / 2;
  return t.finish("qs.sig",
    "Quick sort averages O(n log n), but a pivot that splits badly every time makes it O(n^2).",
    `${t.s.compares} compares and ${t.s.swaps} swaps for ${n} values. ${t.s.compares === worst ? `That is n(n-1)/2, the worst case: every pivot was the largest or smallest, so each partition peeled off one value.` : `The worst case would be ${worst} compares, when every pivot is the largest or smallest value.`} Choosing a random or median pivot avoids that. Quick sort works in place but is not stable.`);
}

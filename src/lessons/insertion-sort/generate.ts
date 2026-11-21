import type { Step } from "../../engine/types";
import type { NumsInput } from "../parseOps";
import { fmt, SortTrace, type SortState } from "../sortkit";

/** Insertion sort: lift each value out, shift bigger ones right, drop it into the gap. */
export function generateInsertion({ nums }: NumsInput): Step<SortState>[] {
  const t = new SortTrace(nums);
  const a = t.s.a;
  const n = a.length;
  t.push({
    kind: "problem", op: null, anchors: [], notes: {},
    title: `Sort ${fmt(a)} with insertion sort`,
    idea: "Grow a sorted prefix by inserting one value at a time, like sorting a hand of cards.",
    text: "The first value alone is sorted. Take each next value out, slide the bigger values of the prefix one cell right, and drop it into the gap that opens."
  });

  for (let i = 1; i < n; i++) {
    const key = a[i] as number;
    a[i] = null;
    t.s.aux = [key];
    t.s.auxName = "key";
    t.s.auxAt = i;
    t.push({
      kind: "remove", op: "key = a[i]", short: `key = ${key}`, anchors: ["in.sig", "in.outer", "in.key"],
      notes: { "in.key": `key = a[${i}] = ${key}` },
      title: `Lift ${key} out of index ${i}`,
      idea: `Everything left of index ${i} is already sorted; ${key} must find its place among them.`,
      text: `Take a[${i}] = ${key} out. Its cell is now a gap that bigger values can slide into.`
    }, { ptrs: [{ at: i, label: "i" }] });

    let j = i - 1;
    while (j >= 0) {
      const v = a[j] as number;
      t.s.compares++;
      const bigger = v > key;
      t.push({
        kind: "check", op: "a[j] > key?", short: `cmp ${j}`, anchors: ["in.cmp"],
        notes: { "in.cmp": `${v} > ${key}? ${bigger ? "yes" : "no"}` },
        title: bigger ? `${v} > ${key}: shift it right` : `${v} <= ${key}: the gap is the spot`,
        idea: bigger ? "A bigger value has to end up right of the key." : "Equal values stay in front, which keeps insertion sort stable.",
        text: bigger ? `a[${j}] = ${v} is bigger than ${key}, so it moves one cell right into the gap.` : `a[${j}] = ${v} is not bigger than ${key}. Nothing left of it is bigger either, so ${key} goes right after it.`
      }, { marks: { [j]: "compare" }, ptrs: [{ at: i, label: "i", dim: true }, { at: j, label: "j" }] });
      if (!bigger) break;
      a[j + 1] = v;
      a[j] = null;
      t.s.swaps++;
      t.s.auxAt = j;
      t.push({
        kind: "move", op: "shift a[j]", short: `shift ${j}`, anchors: ["in.shift"],
        notes: { "in.shift": `a[${j + 1}] = ${v}` },
        title: `${v} slides to index ${j + 1}`,
        idea: "Shifting is one write, cheaper than a full swap.",
        text: `${v} moves right and the gap moves left to index ${j}.`
      }, { marks: { [j + 1]: "active" }, ptrs: [{ at: i, label: "i", dim: true }, { at: j, label: "j" }] });
      j--;
    }

    a[j + 1] = key;
    t.s.swaps++;
    t.s.aux = undefined;
    t.push({
      kind: "add", op: "a[j+1]=key", short: `a[${j + 1}] = ${key}`, anchors: ["in.drop"],
      notes: { "in.drop": `a[${j + 1}] = ${key}` },
      title: `${key} drops into index ${j + 1}`,
      idea: "After the drop, a[0..i] is sorted again.",
      text: j + 1 === i
        ? `Nothing had to move, so ${key} goes straight back to index ${i}. The prefix a[0..${i}] is sorted: ${fmt(a.slice(0, i + 1))}.`
        : `${key} fills the gap at index ${j + 1}. The prefix a[0..${i}] is sorted: ${fmt(a.slice(0, i + 1))}.`
    }, { marks: { [j + 1]: "active" }, ptrs: [{ at: i, label: "i", dim: true }] });
  }

  return t.finish("in.sig",
    "Insertion sort is O(n^2) in the worst case but O(n) on nearly sorted input.",
    `${t.s.compares} compares and ${t.s.swaps} writes for ${n} values. Sorted input costs one compare per value; reversed input shifts every value all the way. It is stable, in place, and fast on small or nearly sorted arrays, which is why real libraries use it for short runs.`);
}

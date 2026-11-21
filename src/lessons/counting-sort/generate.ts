import type { Step } from "../../engine/types";
import type { NumsInput } from "../parseOps";
import { fmt, SortTrace, type SortState } from "../sortkit";

/** Counting sort for small whole numbers: tally each value, then write the values back in order. */
export function generateCounting({ nums }: NumsInput): Step<SortState>[] {
  const t = new SortTrace(nums);
  const a = t.s.a as number[];
  const n = a.length;
  const max = Math.max(...a);
  t.push({
    kind: "problem", op: null, anchors: [], notes: {},
    title: `Sort ${fmt(a)} by counting`,
    idea: "When values are small whole numbers, you can count them instead of comparing them.",
    text: "Make one counter per possible value. Read the array once to count how often each value appears, then read the counters in order and write each value out that many times."
  });

  const count = Array<number>(max + 1).fill(0);
  t.s.aux = count;
  t.s.auxName = "count";
  t.s.auxAt = 0;
  t.s.auxIndexFrom = 0;
  t.push({
    kind: "peek", op: `max = ${max}`, anchors: ["cnt.sig", "cnt.max"],
    notes: { "cnt.max": `max = ${max}, so ${max + 1} counters` },
    title: `${max + 1} counters, all zero`,
    idea: "The count array needs one slot for every value from 0 to the maximum: that is the k in O(n + k).",
    text: `The largest value is ${max}, so count has slots 0 to ${max}.`
  });

  a.forEach((v, i) => {
    count[v]++;
    t.push({
      kind: "add", op: `count[${v}]++`, anchors: ["cnt.count"],
      notes: { "cnt.count": `count[${v}] = ${count[v]}` },
      title: `Count a ${v}`,
      idea: "Each value bumps its own counter. No value is compared with any other.",
      text: `a[${i}] = ${v}, so count[${v}] goes up to ${count[v]}.`
    }, { aux: count.slice(), marks: { [i]: "active" }, ptrs: [{ at: i, label: "i" }], auxPtrs: [{ at: v, label: "+1" }] });
  });

  let k = 0;
  for (let v = 0; v <= max; v++) {
    while (count[v] > 0) {
      a[k] = v;
      count[v]--;
      t.s.swaps++;
      t.settle(k);
      t.push({
        kind: "move", op: `write ${v}`, anchors: ["cnt.write"],
        notes: { "cnt.write": `a[${k}] = ${v}, count[${v}] = ${count[v]}` },
        title: `Write ${v} at index ${k}`,
        idea: "Reading the counters from 0 upward lays the values out in sorted order.",
        text: `count[${v}] was ${count[v] + 1}, so ${v} goes into a[${k}]${count[v] ? ` and ${count[v]} more ${v} still to write` : ""}.`
      }, { aux: count.slice(), marks: { [k]: "found" }, ptrs: [{ at: k, label: "k" }], auxPtrs: [{ at: v, label: "v" }] });
      k++;
    }
  }

  return t.finish("cnt.done",
    "Counting sort is O(n + k) with no comparisons, but it needs k + 1 counters, so it only suits small value ranges.",
    `${n} values counted and ${n} written, with ${t.s.compares} compares. The cost is O(n + k), where k = ${max + 1} is the number of counters, one per value from 0 to ${max}. It beats O(n log n) when k is small, and wastes memory when k is huge.`);
}

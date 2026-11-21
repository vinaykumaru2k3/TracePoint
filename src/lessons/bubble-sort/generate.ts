import type { Step } from "../../engine/types";
import type { NumsInput } from "../parseOps";
import { fmt, SortTrace, type SortState } from "../sortkit";

/** Bubble sort with the early exit: compare neighbours, swap when the left one is bigger. */
export function generateBubble({ nums }: NumsInput): Step<SortState>[] {
  const t = new SortTrace(nums);
  const a = t.s.a as number[];
  const n = a.length;
  t.push({
    kind: "problem", op: null, anchors: [], notes: {},
    title: `Sort ${fmt(a)} with bubble sort`,
    idea: "Swapping neighbours that are out of order makes big values bubble to the right.",
    text: `Walk the array comparing each pair of neighbours. A bigger value on the left swaps right, so each pass carries the largest one left to the end. Stop when a pass makes no swaps.`
  });

  for (let i = 0; i < n - 1; i++) {
    const end = n - 1 - i;
    t.push({
      kind: "peek", op: `pass ${i + 1}`, anchors: ["bb.sig", "bb.pass"],
      notes: { "bb.pass": `pass ${i + 1}: compare a[0..${end}]` },
      title: `Pass ${i + 1}`,
      idea: i === 0 ? "Each pass only needs to reach the cells that are not yet sorted." : `The last ${i} cell${i === 1 ? " is" : "s are"} already in place, so this pass stops earlier.`,
      text: `Compare neighbours from index 0 up to ${end}.${i ? ` The last ${i} cell${i === 1 ? " is" : "s are"} sorted and stays out of it.` : ""}`
    }, { ptrs: [{ at: end, label: "end" }] });
    let swapped = false;
    for (let j = 0; j < end; j++) {
      t.s.compares++;
      const big = a[j] > a[j + 1];
      t.push({
        kind: "check", op: "a[j] > a[j+1]?", short: `cmp ${j}`, anchors: ["bb.cmp"],
        notes: { "bb.cmp": `${a[j]} > ${a[j + 1]}? ${big ? "yes" : "no"}` },
        title: big ? `${a[j]} > ${a[j + 1]}: out of order` : `${a[j]} <= ${a[j + 1]}: in order`,
        idea: big ? "A bigger left neighbour has to move right." : "Equal or smaller on the left: leave the pair alone.",
        text: big ? `a[${j}] = ${a[j]} is bigger than a[${j + 1}] = ${a[j + 1]}, so they swap.` : `a[${j}] = ${a[j]} is not bigger than a[${j + 1}] = ${a[j + 1]}. No swap.`
      }, { marks: { [j]: "compare", [j + 1]: "compare" }, ptrs: [{ at: j, label: "j" }, { at: j + 1, label: "j+1" }] });
      if (big) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        t.s.swaps++;
        swapped = true;
        t.push({
          kind: "move", op: `swap ${j},${j + 1}`, anchors: ["bb.swap"],
          notes: { "bb.swap": `now a[${j}] = ${a[j]}, a[${j + 1}] = ${a[j + 1]}` },
          title: `Swap a[${j}] and a[${j + 1}]`,
          idea: "The bigger value moves one step right and keeps going if the next one is smaller.",
          text: `${a[j + 1]} moves right and ${a[j]} moves left: ${fmt(a)}.`
        }, { marks: { [j]: "swap", [j + 1]: "swap" }, ptrs: [{ at: j, label: "j" }, { at: j + 1, label: "j+1" }] });
      }
    }
    if (!swapped) {
      t.push({
        kind: "found", op: "no swaps", anchors: ["bb.early"],
        notes: { "bb.early": "swapped == false, stop" },
        title: "No swaps this pass",
        idea: "A pass with no swaps proves every neighbour pair is in order, so the array is sorted.",
        text: `Pass ${i + 1} found every pair in order. There is nothing left to do, so the sort stops early.`
      }, { done: a.map((_, k) => k) });
      break;
    }
    t.settle(end);
    if (end === 1) t.settle(0);
    t.push({
      kind: "found", op: `pass ${i + 1} done`, anchors: ["bb.pass"],
      notes: { "bb.pass": `a[${end}] = ${a[end]} is in place` },
      title: `${a[end]} is parked at index ${end}`,
      idea: "Each pass parks the largest remaining value at the end of the unsorted part.",
      text: `The biggest value still unsorted, ${a[end]}, bubbled all the way to index ${end}. It never moves again.`
    });
  }

  return t.finish("bb.sig",
    "Bubble sort is O(n^2) compares in the worst case and O(n) on sorted input, thanks to the early exit.",
    `${t.s.compares} compares and ${t.s.swaps} swaps for ${n} values. Reversed input is the worst case, with n(n-1)/2 of each. Bubble sort is stable and sorts in place, but it is slow, so it is mostly a teaching tool.`);
}

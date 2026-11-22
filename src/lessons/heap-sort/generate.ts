import type { Step } from "../../engine/types";
import type { BlockState } from "../../iso/IsoBlock";
import type { TilePointer } from "../../iso/TreeNodes";
import type { NumsInput } from "../parseOps";
import { heapFrame, heapView, levelsFor, type HItem, type TreeState } from "../treekit";

export const HS_MAX = 8;

export interface HsState extends TreeState {
  a: number[];
  /** Items still in the heap: a[0..heap). The rest is the sorted tail. */
  heap: number;
  phase: "build" | "sort" | "done" | null;
  swaps: number;
}

/** Heap sort: build a max-heap in place, then swap the root to the end of the array and sift down, n - 1 times. */
export function generateHeapSort({ nums }: NumsInput): Step<HsState>[] {
  const n = nums.length;
  const a: HItem[] = nums.map((v, i) => ({ id: i + 1, v }));
  const levels = levelsFor(n);
  let heap = n;
  let phase: HsState["phase"] = null;
  let swaps = 0;
  const steps: Step<HsState>[] = [];

  const snap = (s: Omit<Step<HsState>, "state">, v: { states?: Partial<Record<number, BlockState>>; edges?: number[]; ptrs?: TilePointer[] } = {}) => {
    const states: Partial<Record<number, BlockState>> = {};
    for (let k = heap; k < n; k++) states[k] = "found";
    Object.assign(states, v.states);
    const { nodes, edges } = heapView(a, heap, levels, states, new Set(v.edges ?? []));
    steps.push({
      ...s,
      state: {
        nodes, edges, ptrs: [], frame: heapFrame(levels),
        strip: { name: "a", tiles: a.map((x, k) => ({ v: x.v, state: states[k] })), slots: n, index: true, ptrs: v.ptrs ?? [] },
        a: a.map((x) => x.v), heap, phase, swaps
      }
    });
  };
  const arr = () => `[${a.map((x) => x.v).join(", ")}]`;
  const swap = (i: number, j: number) => { const t = a[i]; a[i] = a[j]; a[j] = t; swaps++; };

  /** Sift a[i] down inside a[0..heap), one step per level. */
  const siftDown = (start: number, why: string) => {
    let i = start;
    for (;;) {
      const l = 2 * i + 1, r = l + 1;
      let m = i;
      if (l < heap && a[l].v > a[m].v) m = l;
      if (r < heap && a[r].v > a[m].v) m = r;
      const kids = [l, r].filter((k) => k < heap);
      const op = `siftDown(${start})`;
      if (m === i) {
        snap({
          kind: "check", op, anchors: ["sift.cmp", "sift.stop"],
          notes: { "sift.cmp": `children ${kids.map((k) => a[k].v).join(", ")}`, "sift.stop": `${a[i].v} is largest, stop` },
          title: `${a[i].v} is no smaller than its children`, idea: "Sift-down stops when the item is at least as large as both children.",
          text: `${why}${a[i].v} is at least as large as ${kids.map((k) => a[k].v).join(" and ")}, so this subtree is a max-heap. a = ${arr()}.`
        }, { states: { [i]: "active", ...Object.fromEntries(kids.map((k) => [k, "compare" as BlockState])) }, edges: kids, ptrs: [{ at: i, label: "i" }] });
        return;
      }
      swap(i, m);
      const bottom = 2 * m + 1 >= heap;
      snap({
        kind: "move", op, anchors: ["sift.cmp", "sift.swap"],
        notes: { "sift.cmp": `larger child ${a[i].v}`, "sift.swap": `swap a[${i}], a[${m}], i = ${m}` },
        title: `Swap ${a[m].v} down past ${a[i].v}`, idea: "Swap with the larger child, so the new parent is at least as large as the other child too.",
        text: `${why}The larger child, ${a[i].v}, is bigger than ${a[m].v}, so they swap. ${bottom ? `${a[m].v} is now a leaf, so the sift is done.` : `${a[m].v} carries on down from a[${m}].`} a = ${arr()}.`
      }, { states: { [m]: "active", [i]: "compare" }, edges: [m], ptrs: [{ at: m, label: "i" }] });
      if (bottom) return;
      i = m;
      why = "";
    }
  };

  snap({
    kind: "problem", op: null, anchors: [], notes: {},
    title: "Sort with a heap, in place",
    idea: "A max-heap always has its largest item at a[0]. Swap it to the end, shrink the heap by one, repair it, and repeat.",
    text: `Sort ${nums.join(", ")}. A max-heap is a complete tree stored in an array where every parent is at least as large as its children. Heap sort builds one in the array itself, then pulls the largest item out n - 1 times. No extra array is needed.`
  });

  phase = "build";
  const firstParent = Math.floor(n / 2) - 1;
  snap({
    kind: "move", op: "buildHeap()", anchors: ["sort.sig", "build.loop"], notes: { "build.loop": `i from ${firstParent} down to 0` },
    title: "Build a max-heap from the bottom up",
    idea: "Leaves are already heaps of one. Sifting down every parent, last first, turns the whole array into a heap in O(n).",
    text: `The tree is the array read level by level. Indexes ${firstParent + 1} to ${n - 1} are leaves, so the work starts at the last parent, a[${firstParent}], and moves back to the root.`
  }, { ptrs: [{ at: firstParent, label: "i" }] });
  for (let i = firstParent; i >= 0; i--) siftDown(i, `Sift down a[${i}] = ${a[i].v}. `);

  phase = "sort";
  for (let end = n - 1; end > 0; end--) {
    const big = a[0].v;
    swap(0, end);
    heap = end;
    snap({
      kind: "remove", op: `swap(0, ${end})`, anchors: ["out.loop", "out.swap", ...(end > 1 ? ["out.sift"] : [])], notes: { "out.loop": `end = ${end}`, "out.swap": `a[0] = ${a[0].v}, a[${end}] = ${big}`, ...(end > 1 ? { "out.sift": "siftDown(a, 0, end)" } : {}) },
      title: `Move the largest, ${big}, to a[${end}]`, idea: "The largest item in the heap belongs at the end of what is left, so one swap puts it in its final place.",
      text: `${big} is at the root, so it is the largest item left. It swaps with a[${end}] = ${a[0].v} and leaves the heap: a[${end}..] is sorted. ${end > 1 ? `${a[0].v} is now at the root and may be too small for it.` : "One item is left, so it is in place too."}`
    }, { states: { 0: end > 1 ? "active" : "found" }, ptrs: [{ at: end, label: "end" }] });
    if (end > 1) siftDown(0, "");
  }

  phase = "done";
  heap = 0;
  snap({
    kind: "found", op: "heapSort()", ret: arr(), anchors: ["sort.sig"], notes: { "sort.sig": `a = ${arr()}` },
    title: "Sorted", idea: "Each of the n - 1 rounds costs one sift-down of O(log n), so heap sort is O(n log n) in every case.",
    text: `a = ${arr()}. The heap shrank by one each round while the sorted tail grew from the right, until they met.`
  });
  steps.push({
    kind: "recap", op: null, anchors: [], notes: {}, state: steps[steps.length - 1].state,
    title: "What happened",
    idea: "Heap sort is O(n log n) even on the worst input and needs O(1) extra space, but it is not stable.",
    text: `Building the heap took ${firstParent + 1} sift-down${firstParent === 0 ? "" : "s"}, then ${n - 1} round${n === 2 ? "" : "s"} moved the largest item to the end. There were ${swaps} swaps in all, and everything happened inside the one array.`
  });
  return steps;
}

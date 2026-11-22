import { defineLesson, toneOf, type MemoryView } from "../../engine/types";
import type { Op } from "../parseOps";
import TreeScene from "../TreeScene";
import { HEAP_MAX, generateHeap, parseHeap, type HeapState } from "./generate";
import java from "./code/Main.java?raw";
import python from "./code/main.py?raw";
import cpp from "./code/main.cpp?raw";
import theory from "./theory";

export default defineLesson<Op[], HeapState>({
  id: "binary-heap",
  title: "Binary heap",
  subtitle: "A min-heap in an array: push sifts up, pop moves the last item to the root and sifts down.",
  minutes: 8,
  level: "intermediate",
  section: "trees",

  inputLabel: "Operations",
  inputHint: `push N, pop. Up to 16 operations, at most ${HEAP_MAX} items at once.`,
  defaultText: "push 5, push 3, push 8, push 1, push 9, push 2, pop, pop, pop",
  presets: [
    { label: "Pop an empty heap", text: "pop, push 4, pop, pop" },
    { label: "Duplicates", text: "push 3, push 3, push 1, push 3, pop, pop" },
    { label: "Sorted backwards", text: "push 9, push 8, push 7, push 6, push 5, push 4, push 3" }
  ],
  parse: parseHeap,
  generate: generateHeap,

  Scene: TreeScene,
  legend: [{ cls: "s-active", label: "moving item" }, { cls: "s-compare", label: "compared with" }, { cls: "s-found", label: "popped minimum" }],
  metrics: ({ state: s }) => [
    { label: "Size", value: s.size },
    { label: "Min", value: s.size ? s.a[0] : "-" },
    { label: "Levels", value: s.nodes.length ? Math.max(...s.nodes.map((n) => n.depth)) + 1 : 0 },
    { label: "Popped", value: s.popped.length ? s.popped.join(" ") : "-" }
  ],
  memory: ({ state: s }): MemoryView => ({
    title: "In memory: int[] a",
    note: "The tree is only a picture: the heap is this array. Children of a[i] are a[2i + 1] and a[2i + 2], its parent is a[(i - 1) / 2].",
    cells: (s.strip?.tiles ?? []).map((t, k) => ({
      v: t.v, live: t.v !== null, act: t.state === "active" || toneOf(t.state) !== undefined, tone: toneOf(t.state),
      marks: (s.strip?.ptrs ?? []).filter((p) => p.at === k).map((p) => p.label)
    }))
  }),
  vars: ({ state: s }) => `a = [${s.a.join(", ")}]   size = ${s.size}`,
  costs: [["push", "O(log n)"], ["pop", "O(log n)"], ["peek the minimum", "O(1)"]],
  learn: [
    ["push sifts the new item up past larger parents", (s) => s.anchors.includes("up.swap")],
    ["pop moves the last item to the root", (s) => s.anchors.includes("pop.last")],
    ["sift-down swaps with the smaller child", (s) => s.anchors.includes("down.swap")],
    ["pop on an empty heap returns null", (s) => s.anchors.includes("pop.empty")]
  ],

  theory,

  code: { java, python, cpp }
});

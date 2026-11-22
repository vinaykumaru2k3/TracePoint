import { defineLesson, toneOf, type MemoryView } from "../../engine/types";
import { parseNums, type NumsInput } from "../parseOps";
import TreeScene from "../TreeScene";
import { HS_MAX, generateHeapSort, type HsState } from "./generate";
import java from "./code/Main.java?raw";
import python from "./code/main.py?raw";
import cpp from "./code/main.cpp?raw";
import theory from "./theory";

const PHASE = { build: "build heap", sort: "extract", done: "done" } as const;

export default defineLesson<NumsInput, HsState>({
  id: "heap-sort",
  title: "Heap sort",
  subtitle: "Build a max-heap inside the array, then swap the largest item to the end and repair the heap, again and again.",
  minutes: 8,
  level: "intermediate",
  section: "trees",

  inputLabel: "Array",
  inputHint: `2 to ${HS_MAX} numbers from 0 to 99.`,
  defaultText: "5 1 4 2 8 3",
  presets: [
    { label: "Already sorted", text: "1 2 3 4 5 6" },
    { label: "Duplicates", text: "4 2 4 1 2" },
    { label: "Reversed", text: "8 7 6 5 4 3 2 1" }
  ],
  parse: (text) => parseNums(text, { minLen: 2, maxLen: HS_MAX }),
  generate: generateHeapSort,

  Scene: TreeScene,
  legend: [{ cls: "s-active", label: "sifting item" }, { cls: "s-compare", label: "compared with" }, { cls: "s-found", label: "sorted tail" }],
  metrics: ({ state: s }) => [
    { label: "Phase", value: s.phase ? PHASE[s.phase] : "-" },
    { label: "Heap", value: `a[0..${s.heap})` },
    { label: "Sorted", value: s.a.length - s.heap },
    { label: "Swaps", value: s.swaps }
  ],
  memory: ({ state: s }): MemoryView => ({
    title: "In memory: int[] a",
    note: "One array holds both parts: the heap on the left, the sorted tail on the right.",
    cells: (s.strip?.tiles ?? []).map((t, k) => ({
      v: t.v, live: true, act: t.state === "active" || toneOf(t.state) !== undefined, tone: toneOf(t.state),
      marks: (s.strip?.ptrs ?? []).filter((p) => p.at === k).map((p) => p.label)
    }))
  }),
  vars: ({ state: s }) => `a = [${s.a.join(", ")}]   heap = a[0..${s.heap})`,
  costs: [["time, every case", "O(n log n)"], ["build the heap", "O(n)"], ["extra space", "O(1)"]],
  learn: [
    ["building the heap sifts down every parent, last first", (s) => s.anchors.includes("build.loop")],
    ["the root swaps to the end of the heap", (s) => s.anchors.includes("out.swap")],
    ["sift-down swaps with the larger child", (s) => s.anchors.includes("sift.swap")],
    ["sift-down stops when the parent is largest", (s) => s.anchors.includes("sift.stop")]
  ],

  theory,

  code: { java, python, cpp }
});

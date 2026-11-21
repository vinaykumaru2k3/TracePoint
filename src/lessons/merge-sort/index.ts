import { defineLesson } from "../../engine/types";
import type { NumsInput } from "../parseOps";
import SortScene from "../SortScene";
import { parseSort, sortMemory, sortMetrics, type SortState } from "../sortkit";
import { generateMerge } from "./generate";
import java from "./code/Main.java?raw";
import python from "./code/main.py?raw";
import cpp from "./code/main.cpp?raw";

export default defineLesson<NumsInput, SortState>({
  id: "merge-sort",
  title: "Merge sort",
  subtitle: "Split in half until one value is left, then merge sorted halves back together.",
  minutes: 7,
  level: "intermediate",
  section: "sorting",

  inputLabel: "Array",
  inputHint: "2 to 8 numbers from 0 to 99.",
  defaultText: "5 1 4 2 8 3",
  presets: [
    { label: "Duplicates", text: "3 1 3 2" },
    { label: "Reversed", text: "8 7 6 5 4 3 2 1" }
  ],
  parse: (text) => parseSort(text),
  generate: generateMerge,

  Scene: SortScene,
  legend: [{ cls: "s-visited", label: "range" }, { cls: "s-compare", label: "heads" }, { cls: "s-active", label: "taken" }, { cls: "s-found", label: "sorted" }],
  metrics: ({ state }) => sortMetrics(state, "Writes"),
  memory: ({ state }) => sortMemory("In memory: int[] a", state, "Each merge needs a buffer as long as its range: O(n) extra memory, plus O(log n) for the call stack."),
  vars: ({ state: s }) => `tmp = ${s.aux ? `[${s.aux.map((v) => v ?? "_").join(", ")}]` : "-"}`,
  costs: [["time", "O(n log n)"], ["extra space", "O(n)"]],
  learn: [
    ["split until one element", (s) => !!s.op?.startsWith("split")],
    ["merge takes the smaller head", (s) => s.kind === "check"],
    ["<= keeps equal values in order (stable)", (s) => s.kind === "check" && /^(\d+) = \1:/.test(s.title)]
  ],

  code: { java, python, cpp }
});

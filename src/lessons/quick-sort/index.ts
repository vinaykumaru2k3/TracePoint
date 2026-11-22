import { defineLesson } from "../../engine/types";
import type { NumsInput } from "../parseOps";
import SortScene from "../SortScene";
import { parseSort, sortMemory, sortMetrics, type SortState } from "../sortkit";
import { generateQuick } from "./generate";
import java from "./code/Main.java?raw";
import python from "./code/main.py?raw";
import cpp from "./code/main.cpp?raw";
import theory from "./theory";

export default defineLesson<NumsInput, SortState>({
  id: "quick-sort",
  title: "Quick sort",
  subtitle: "Partition around a pivot, then sort each side the same way.",
  minutes: 7,
  level: "intermediate",
  section: "sorting",

  inputLabel: "Array",
  inputHint: "2 to 8 numbers from 0 to 99.",
  defaultText: "5 1 4 2 8 3",
  presets: [
    { label: "Sorted input (worst case)", text: "1 2 3 4 5" },
    { label: "Duplicates", text: "3 1 3 2" }
  ],
  parse: (text) => parseSort(text),
  generate: generateQuick,

  Scene: SortScene,
  legend: [{ cls: "s-swap", label: "pivot" }, { cls: "s-visited", label: "< pivot" }, { cls: "s-compare", label: "comparing" }, { cls: "s-found", label: "in place" }],
  metrics: ({ state }) => sortMetrics(state),
  memory: ({ state }) => sortMemory("In memory: int[] a", state, "Partitioning swaps inside the array. The recursion uses O(log n) stack on average, O(n) in the worst case."),
  vars: ({ state: s }) => `compares = ${s.compares}   swaps = ${s.swaps}`,
  costs: [["time", "O(n log n) avg, O(n^2) worst"], ["extra space", "O(log n) stack avg, O(n) worst"]],
  learn: [
    ["smaller values move left of the pivot", (s) => s.kind === "move"],
    ["the pivot lands in its final place", (s) => !!s.op?.startsWith("pivot at")],
    ["sorted input is the worst case", (s) => s.op === "sorted" && s.state.compares === (s.state.a.length * (s.state.a.length - 1)) / 2]
  ],

  theory,

  code: { java, python, cpp }
});

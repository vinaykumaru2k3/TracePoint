import { defineLesson } from "../../engine/types";
import type { NumsInput } from "../parseOps";
import SortScene from "../SortScene";
import { parseSort, sortMemory, sortMetrics, type SortState } from "../sortkit";
import { generateSelection } from "./generate";
import java from "./code/Main.java?raw";
import python from "./code/main.py?raw";
import cpp from "./code/main.cpp?raw";

export default defineLesson<NumsInput, SortState>({
  id: "selection-sort",
  title: "Selection sort",
  subtitle: "Find the smallest remaining value and swap it to the front.",
  minutes: 5,
  level: "beginner",
  section: "sorting",

  inputLabel: "Array",
  inputHint: "2 to 8 numbers from 0 to 99.",
  defaultText: "5 1 4 2 8",
  presets: [
    { label: "Reversed", text: "6 5 4 3 2 1" },
    { label: "Duplicates", text: "3 1 3 2" }
  ],
  parse: (text) => parseSort(text),
  generate: generateSelection,

  Scene: SortScene,
  legend: [{ cls: "s-active", label: "position i" }, { cls: "s-compare", label: "comparing" }, { cls: "s-visited", label: "minimum" }, { cls: "s-found", label: "in place" }],
  metrics: ({ state }) => sortMetrics(state),
  memory: ({ state }) => sortMemory("In memory: int[] a", state, "Swaps happen inside the array. Two indices are the only extra memory: O(1)."),
  vars: ({ state: s }) => `compares = ${s.compares}   swaps = ${s.swaps}`,
  costs: [["time", "O(n^2)"], ["extra space", "O(1)"], ["swaps", "at most n - 1"]],
  learn: [
    ["scan the rest for the smallest", (s) => s.kind === "check"],
    ["swap it into the front", (s) => s.kind === "add"],
    ["at most n - 1 swaps", (s) => s.op === "sorted" && s.state.swaps <= s.state.a.length - 1]
  ],

  code: { java, python, cpp }
});

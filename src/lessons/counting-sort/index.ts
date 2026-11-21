import { defineLesson } from "../../engine/types";
import type { NumsInput } from "../parseOps";
import SortScene from "../SortScene";
import { parseSort, sortMemory, sortMetrics, type SortState } from "../sortkit";
import { generateCounting } from "./generate";
import java from "./code/Main.java?raw";
import python from "./code/main.py?raw";
import cpp from "./code/main.cpp?raw";
import theory from "./theory";

export default defineLesson<NumsInput, SortState>({
  id: "counting-sort",
  title: "Counting sort",
  subtitle: "Count how often each small value appears, then write them back in order.",
  minutes: 5,
  level: "intermediate",
  section: "sorting",

  inputLabel: "Array",
  inputHint: "2 to 8 whole numbers from 0 to 9.",
  defaultText: "3 1 2 3 0",
  presets: [
    { label: "Many repeats", text: "2 0 2 1 2 0 1 2" },
    { label: "Wide range", text: "9 0 5" }
  ],
  parse: (text) => parseSort(text, 9),
  generate: generateCounting,

  Scene: SortScene,
  legend: [{ cls: "s-active", label: "counting" }, { cls: "s-found", label: "written" }],
  metrics: ({ state }) => sortMetrics(state, "Writes"),
  memory: ({ state }) => sortMemory("In memory: int[] a", state, `The count array has one slot per value from 0 to the max: O(k) extra memory.`),
  vars: ({ state: s }) => `count = ${s.aux ? `[${s.aux.join(", ")}]` : "-"}`,
  costs: [["time", "O(n + k)"], ["extra space", "O(k)"]],
  learn: [
    ["each value bumps its counter", (s) => s.kind === "add"],
    ["counters are read back in order", (s) => s.kind === "move"],
    ["no comparisons: O(n + k)", (s) => s.op === "sorted" && s.state.compares === 0]
  ],

  theory,

  code: { java, python, cpp }
});

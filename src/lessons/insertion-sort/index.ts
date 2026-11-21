import { defineLesson } from "../../engine/types";
import type { NumsInput } from "../parseOps";
import SortScene from "../SortScene";
import { parseSort, sortMemory, sortMetrics, type SortState } from "../sortkit";
import { generateInsertion } from "./generate";
import java from "./code/Main.java?raw";
import python from "./code/main.py?raw";
import cpp from "./code/main.cpp?raw";

export default defineLesson<NumsInput, SortState>({
  id: "insertion-sort",
  title: "Insertion sort",
  subtitle: "Lift each value out and slide it left into a growing sorted prefix.",
  minutes: 5,
  level: "beginner",
  section: "sorting",

  inputLabel: "Array",
  inputHint: "2 to 8 numbers from 0 to 99.",
  defaultText: "5 1 4 2 8",
  presets: [
    { label: "Already sorted", text: "1 2 3 4 5" },
    { label: "Reversed", text: "6 5 4 3 2 1" }
  ],
  parse: (text) => parseSort(text),
  generate: generateInsertion,

  Scene: SortScene,
  legend: [{ cls: "s-compare", label: "comparing" }, { cls: "s-active", label: "moved" }, { cls: "s-stale", label: "gap" }, { cls: "s-found", label: "sorted" }],
  metrics: ({ state }) => sortMetrics(state, "Writes"),
  memory: ({ state }) => sortMemory("In memory: int[] a", state, "The key waits in one variable while values shift. Extra memory: O(1)."),
  vars: ({ state: s }) => `key = ${s.aux?.[0] ?? "-"}   compares = ${s.compares}`,
  costs: [["time", "O(n^2), O(n) if sorted"], ["extra space", "O(1)"]],
  learn: [
    ["bigger values shift right", (s) => s.kind === "move"],
    ["the key drops into the gap", (s) => s.kind === "add"],
    ["sorted input needs one compare per item", (s) => s.op === "sorted" && s.state.compares === s.state.a.length - 1]
  ],

  code: { java, python, cpp }
});

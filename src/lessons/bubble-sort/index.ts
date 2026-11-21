import { defineLesson } from "../../engine/types";
import type { NumsInput } from "../parseOps";
import SortScene from "../SortScene";
import { parseSort, sortMemory, sortMetrics, type SortState } from "../sortkit";
import { generateBubble } from "./generate";
import java from "./code/Main.java?raw";
import python from "./code/main.py?raw";
import cpp from "./code/main.cpp?raw";

export default defineLesson<NumsInput, SortState>({
  id: "bubble-sort",
  title: "Bubble sort",
  subtitle: "Swap neighbours that are out of order until a pass makes no swaps.",
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
  generate: generateBubble,

  Scene: SortScene,
  legend: [{ cls: "s-compare", label: "comparing" }, { cls: "s-swap", label: "swapping" }, { cls: "s-found", label: "in place" }],
  metrics: ({ state }) => sortMetrics(state),
  memory: ({ state }) => sortMemory("In memory: int[] a", state, "Swaps happen inside the array. One temporary and a flag are the only extra memory: O(1)."),
  vars: ({ state: s }) => `compares = ${s.compares}   swaps = ${s.swaps}`,
  costs: [["time", "O(n^2), O(n) if sorted"], ["extra space", "O(1)"]],
  learn: [
    ["a bigger left neighbour swaps right", (s) => s.kind === "move"],
    ["each pass parks the largest at the end", (s) => s.kind === "found" && !!s.op?.endsWith("done")],
    ["a pass with no swaps stops early", (s) => s.op === "no swaps"]
  ],

  code: { java, python, cpp }
});

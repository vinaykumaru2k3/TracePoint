import { defineLesson, type MemoryView } from "../../engine/types";
import type { NumsInput } from "../parseOps";
import Scene from "./Scene";
import { generateWindow, parseWindow, type WindowState } from "./generate";
import java from "./code/Main.java?raw";
import python from "./code/main.py?raw";
import cpp from "./code/main.cpp?raw";

export default defineLesson<NumsInput, WindowState>({
  id: "sliding-window",
  title: "Sliding window",
  subtitle: "Find the best sum of k items in a row by sliding a window instead of re-adding.",
  minutes: 5,
  level: "beginner",
  section: "foundations",

  inputLabel: "Array and k",
  inputHint: "2 to 9 numbers, then k N (smaller than the array).",
  defaultText: "2 1 5 1 3 2 k 3",
  presets: [
    { label: "Best window last", text: "1 2 1 3 6 8 k 2" },
    { label: "Window of one", text: "4 9 2 7 k 1" },
    { label: "Wide window", text: "3 8 1 6 2 9 4 7 k 5" }
  ],
  parse: parseWindow,
  generate: generateWindow,

  Scene,
  legend: [{ cls: "s-active", label: "entering" }, { cls: "s-swap", label: "leaving" }, { cls: "s-found", label: "best so far" }],
  metrics: ({ state: s }) => [
    { label: "k", value: s.k },
    { label: "Window sum", value: s.sum },
    { label: "Best", value: s.best ?? "-" },
    { label: "Best starts", value: s.best === null ? "-" : s.bestLo }
  ],
  memory: ({ state: s }): MemoryView => ({
    title: "In memory: int[] a",
    note: "The window is just two indexes and a running sum. No sub-array is ever copied.",
    cells: s.nums.map((v, k) => ({ v, live: k >= s.lo && k <= s.hi, act: k === s.hi, marks: [k === s.lo && s.hi >= 0 ? "lo" : "", k === s.hi ? "hi" : ""].filter(Boolean) }))
  }),
  vars: ({ state: s }) => `sum = ${s.sum}   best = ${s.best ?? "-"}`,
  costs: [["time", "O(n)"], ["extra space", "O(1)"]],
  learn: [
    ["the first window is summed once", (s) => s.kind === "add"],
    ["sliding adds one item and drops one", (s) => s.kind === "move"],
    ["keep the best as you go", (s) => s.kind === "move" && s.state.improved],
    ["one pass finds the answer", (s) => s.kind === "found"]
  ],

  code: { java, python, cpp }
});

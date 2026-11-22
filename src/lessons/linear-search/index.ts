import { defineLesson, type MemoryView } from "../../engine/types";
import { parseNums, type NumsInput } from "../parseOps";
import Scene from "./Scene";
import { generateLinear, type LinearState } from "./generate";
import java from "./code/Main.java?raw";
import python from "./code/main.py?raw";
import cpp from "./code/main.cpp?raw";
import theory from "./theory";

export default defineLesson<NumsInput, LinearState>({
  id: "linear-search",
  title: "Linear search",
  subtitle: "Check every cell from the left until the target turns up.",
  minutes: 3,
  level: "beginner",
  section: "sorting",

  inputLabel: "Array and target",
  inputHint: "1 to 8 numbers, then target N.",
  defaultText: "7 3 9 4 1 8 target 4",
  presets: [
    { label: "Not there", text: "7 3 9 4 1 target 5" },
    { label: "First match wins", text: "2 8 4 5 5 1 target 5" }
  ],
  parse: (text) => parseNums(text, { minLen: 1, maxLen: 8, key: "target", keyMin: 0, keyMax: 99, keyRequired: true }),
  generate: generateLinear,

  Scene,
  legend: [{ cls: "s-compare", label: "checking" }, { cls: "s-found", label: "match" }, { cls: "s-stale", label: "checked" }],
  metrics: ({ state: s }) => [
    { label: "Target", value: s.target },
    { label: "i", value: s.i < s.nums.length ? s.i : "-" },
    { label: "Checks", value: Math.min(s.i + 1, s.nums.length) }
  ],
  memory: ({ state: s }): MemoryView => ({
    title: "In memory: int[] a",
    note: "The array is read, never changed. One index is all the extra memory: O(1).",
    cells: s.nums.map((v, k) => ({ v, live: k >= s.i, act: k === s.i, tone: s.hit ? "found" : "compare", marks: k === s.i ? ["i"] : [] }))
  }),
  vars: ({ state: s }) => `i = ${s.i}   target = ${s.target}`,
  costs: [["time", "O(n)"], ["extra space", "O(1)"]],
  learn: [
    ["a miss moves on to the next cell", (s) => s.kind === "check"],
    ["the first match returns its index", (s) => s.kind === "found"],
    ["no match anywhere returns -1", (s) => s.kind === "empty"]
  ],

  theory,

  code: { java, python, cpp }
});

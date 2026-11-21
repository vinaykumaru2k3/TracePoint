import { defineLesson, type MemoryView } from "../../engine/types";
import { parseNums, type NumsInput } from "../parseOps";
import Scene from "./Scene";
import { generateBigO, type BigOState } from "./generate";
import java from "./code/Main.java?raw";
import python from "./code/main.py?raw";
import cpp from "./code/main.cpp?raw";

export default defineLesson<NumsInput, BigOState>({
  id: "big-o-by-counting",
  title: "Big-O by counting",
  subtitle: "Count loop steps in a sum and in an all-pairs check, and see linear and quadratic growth.",
  minutes: 5,
  level: "beginner",
  section: "foundations",

  inputLabel: "Array",
  inputHint: "2 to 6 whole numbers, 0 to 99.",
  defaultText: "4 8 1 9",
  presets: [
    { label: "Five numbers", text: "3 7 2 9 5" },
    { label: "A duplicate stops early", text: "6 2 6 5" },
    { label: "Six numbers", text: "1 2 3 4 5 6" }
  ],
  parse: (text) => parseNums(text, { minLen: 2, maxLen: 6 }),
  generate: generateBigO,

  Scene,
  legend: [{ cls: "s-active", label: "sum step" }, { cls: "s-compare", label: "pair checked" }, { cls: "s-found", label: "match" }],
  metrics: ({ state: s }) => [
    { label: "n", value: s.nums.length },
    { label: "sum steps", value: s.sumOps },
    { label: "pair checks", value: s.dupOps },
    { label: "n(n-1)/2", value: (s.nums.length * (s.nums.length - 1)) / 2 }
  ],
  memory: ({ state: s }): MemoryView => ({
    title: "In memory: int[] a",
    note: "Both functions read the same array. Only the number of times they read it differs.",
    cells: s.nums.map((v, k) => ({ v, live: true, act: k === s.i || k === s.j, marks: [k === s.i ? "i" : "", k === s.j ? "j" : ""].filter(Boolean) }))
  }),
  vars: ({ state: s }) => (s.part === "dup" ? `i = ${s.i}   j = ${s.j}   checks = ${s.dupOps}` : `i = ${s.i}   total = ${s.total}`),
  costs: [["sum", "O(n)"], ["hasDuplicate", "O(n²)"]],
  learn: [
    ["one loop over n items takes n steps", (s) => s.state.part === "sum" && s.kind === "found"],
    ["a loop inside a loop checks every pair", (s) => s.kind === "check" && s.state.part === "dup"],
    ["n(n-1)/2 pairs grows like n²", (s) => s.op === "hasDuplicate(a)"],
    ["an early return helps, but Big-O counts the worst case", (s) => s.state.hit]
  ],

  code: { java, python, cpp }
});

import { defineLesson, type MemoryView } from "../../engine/types";
import { parseNums, type NumsInput } from "../parseOps";
import Scene from "./Scene";
import { generateTwoPointers, type TwoPtrState } from "./generate";
import java from "./code/Main.java?raw";
import python from "./code/main.py?raw";
import cpp from "./code/main.cpp?raw";
import theory from "./theory";

export default defineLesson<NumsInput, TwoPtrState>({
  id: "two-pointers",
  title: "Two pointers",
  subtitle: "Find a pair with a given sum by walking in from both ends of a sorted array.",
  minutes: 5,
  level: "beginner",
  section: "foundations",

  inputLabel: "Array and target",
  inputHint: "2 to 8 numbers, then target N. Unsorted input is sorted first.",
  defaultText: "1 3 4 6 8 11 target 10",
  presets: [
    { label: "No pair exists", text: "2 4 5 9 12 target 8" },
    { label: "Pair in the middle", text: "1 2 3 4 8 9 15 target 12" },
    { label: "Unsorted input", text: "9 2 14 5 7 1 target 12" }
  ],
  parse: (text) => parseNums(text, { minLen: 2, maxLen: 8, key: "target", keyMin: 0, keyMax: 198, keyRequired: true }),
  generate: generateTwoPointers,

  Scene,
  legend: [{ cls: "s-compare", label: "lo and hi" }, { cls: "s-found", label: "pair" }, { cls: "s-stale", label: "ruled out" }],
  metrics: ({ state: s }) => [
    { label: "Target", value: s.target },
    { label: "a[lo] + a[hi]", value: s.sum ?? (s.lo < s.hi ? s.nums[s.lo] + s.nums[s.hi] : "-") },
    { label: "lo", value: s.lo },
    { label: "hi", value: s.hi }
  ],
  memory: ({ state: s }): MemoryView => ({
    title: "In memory: int[] a (sorted)",
    note: "Nothing is copied or moved. Two integers, lo and hi, are all the extra memory: O(1).",
    cells: s.nums.map((v, k) => ({ v, live: k >= s.lo && k <= s.hi, act: k === s.lo || k === s.hi, tone: s.hit ? "found" : "compare", marks: [k === s.lo ? "lo" : "", k === s.hi ? "hi" : ""].filter(Boolean) }))
  }),
  vars: ({ state: s }) => `lo = ${s.lo}   hi = ${s.hi}`,
  costs: [["time", "O(n)"], ["extra space", "O(1)"]],
  learn: [
    ["a sum that is too small moves lo right", (s) => s.state.moved === "lo"],
    ["a sum that is too big moves hi left", (s) => s.state.moved === "hi"],
    ["a match returns both indexes", (s) => s.kind === "found"],
    ["when the pointers meet, there is no pair", (s) => s.kind === "empty"]
  ],

  theory,

  code: { java, python, cpp }
});

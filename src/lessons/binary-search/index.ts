import { defineLesson, type MemoryView } from "../../engine/types";
import { parseNums, type NumsInput } from "../parseOps";
import Scene from "./Scene";
import { generateBinary, type BinaryState } from "./generate";
import java from "./code/Main.java?raw";
import python from "./code/main.py?raw";
import cpp from "./code/main.cpp?raw";
import theory from "./theory";

export default defineLesson<NumsInput, BinaryState>({
  id: "binary-search",
  title: "Binary search",
  subtitle: "Halve a sorted range around its middle until the target turns up.",
  minutes: 5,
  level: "beginner",
  section: "sorting",

  inputLabel: "Array and target",
  inputHint: "1 to 8 numbers, then target N. Unsorted input is sorted first.",
  defaultText: "1 3 4 6 8 11 14 17 target 14",
  presets: [
    { label: "Not there", text: "1 3 4 6 8 11 14 17 target 5" },
    { label: "Unsorted input", text: "9 2 14 5 7 1 target 7" }
  ],
  parse: (text) => parseNums(text, { minLen: 1, maxLen: 8, key: "target", keyMin: 0, keyMax: 99, keyRequired: true }),
  generate: generateBinary,

  Scene,
  legend: [{ cls: "s-compare", label: "mid" }, { cls: "s-found", label: "match" }, { cls: "s-stale", label: "ruled out" }],
  metrics: ({ state: s }) => [
    { label: "Target", value: s.target },
    { label: "lo", value: s.lo },
    { label: "hi", value: s.hi },
    { label: "a[mid]", value: s.mid !== null ? s.nums[s.mid] : "-" }
  ],
  memory: ({ state: s }): MemoryView => ({
    title: "In memory: int[] a (sorted)",
    note: "Three integers, lo, mid and hi, are the only extra memory: O(1).",
    cells: s.nums.map((v, k) => ({
      v, live: k >= s.lo && k <= s.hi, act: k === s.mid, tone: s.hit ? "found" : "compare",
      marks: [k === s.lo ? "lo" : "", k === s.mid ? "mid" : "", k === s.hi ? "hi" : ""].filter(Boolean)
    }))
  }),
  vars: ({ state: s }) => `lo = ${s.lo}   mid = ${s.mid ?? "-"}   hi = ${s.hi}`,
  costs: [["time", "O(log n)"], ["extra space", "O(1)"]],
  learn: [
    ["a[mid] too small: drop the left half", (s) => s.state.moved === "lo"],
    ["a[mid] too big: drop the right half", (s) => s.state.moved === "hi"],
    ["a match returns mid", (s) => s.kind === "found"],
    ["an empty range means not found", (s) => s.kind === "empty"]
  ],

  theory,

  code: { java, python, cpp }
});

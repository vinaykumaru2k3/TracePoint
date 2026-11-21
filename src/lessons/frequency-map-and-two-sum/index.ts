import { defineLesson, type MemoryView } from "../../engine/types";
import { parseNums, type NumsInput } from "../parseOps";
import Scene from "./Scene";
import { FM_MAX, generateFm, type FmState } from "./generate";
import java from "./code/Main.java?raw";
import python from "./code/main.py?raw";
import cpp from "./code/main.cpp?raw";

export default defineLesson<NumsInput, FmState>({
  id: "frequency-map-and-two-sum",
  title: "Frequency map and two-sum",
  subtitle: "Count values with a hash map, then find a pair summing to a target in one pass.",
  minutes: 6,
  level: "beginner",
  section: "hashing",

  inputLabel: "Numbers and target",
  inputHint: `2 to ${FM_MAX} numbers, then "target N".`,
  defaultText: "3 5 1 5 8 4 target 9",
  presets: [
    { label: "No pair", text: "1 2 4 8 target 20" },
    { label: "Pair uses a repeat", text: "6 3 6 target 12" },
    { label: "Pair at the start", text: "4 5 1 1 target 9" }
  ],
  parse: (text) => parseNums(text, { minLen: 2, maxLen: FM_MAX, key: "target", keyMin: 0, keyMax: 198, keyRequired: true }),
  generate: generateFm,

  Scene,
  legend: [{ cls: "s-active", label: "current" }, { cls: "s-visited", label: "done" }, { cls: "s-found", label: "pair" }],
  metrics: ({ state: s }) => [
    { label: "Phase", value: s.phase ?? "-" },
    { label: "i", value: s.i ?? "-" },
    { label: "need", value: s.need ?? "-" },
    { label: "Map keys", value: (s.phase === "two" ? s.seen : s.count).length }
  ],
  memory: ({ state: s }): MemoryView => {
    const map = s.phase === "two" ? s.seen : s.count;
    return {
      title: `In memory: HashMap ${s.phase === "two" ? "seen (value → index)" : "count (value → times)"}`,
      note: "Each key is hashed to a bucket, so get and put stay O(1) on average no matter how many keys there are.",
      cells: map.map(([key, val]) => ({ v: val, tag: `${key}`, live: true, act: key === s.key, tone: s.pair ? "found" : undefined, marks: [] }))
    };
  },
  vars: ({ state: s }) => `target = ${s.target}` + (s.i !== null ? `   i = ${s.i}   x = ${s.nums[s.i]}` : ""),
  costs: [["count", "O(n)"], ["twoSum", "O(n)"], ["extra space", "O(n)"], ["brute force", "O(n²)"]],
  learn: [
    ["a new key starts at 1, a repeat adds 1", (s) => s.anchors.includes("count.bump") && s.state.count.some(([, c]) => c > 1)],
    ["counting is one pass", (s) => s.anchors.includes("count.return")],
    ["two-sum asks for target - x", (s) => s.anchors.includes("two.need")],
    ["store after checking, so x never pairs with itself", (s) => s.anchors.includes("two.store")],
    ["a map hit returns the pair", (s) => s.kind === "found"],
    ["no pair means one full pass", (s) => s.anchors.includes("two.none")]
  ],

  code: { java, python, cpp }
});

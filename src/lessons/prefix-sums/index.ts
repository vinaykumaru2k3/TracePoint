import { defineLesson, type MemoryView } from "../../engine/types";
import Scene from "./Scene";
import { generatePrefix, parsePrefix, type PrefixInput, type PrefixState } from "./generate";
import java from "./code/Main.java?raw";
import python from "./code/main.py?raw";
import cpp from "./code/main.cpp?raw";

export default defineLesson<PrefixInput, PrefixState>({
  id: "prefix-sums",
  title: "Prefix sums",
  subtitle: "Build running totals once, then answer any range sum with one subtraction.",
  minutes: 5,
  level: "beginner",
  section: "foundations",

  inputLabel: "Array and ranges",
  inputHint: "2 to 8 numbers (0 to 20), then up to 4 of query L R.",
  defaultText: "3 1 4 1 5 9 query 1 3 query 2 5",
  presets: [
    { label: "Range from the start", text: "2 7 1 8 2 query 0 3" },
    { label: "Four queries", text: "5 3 8 6 1 4 2 query 0 6 query 2 4 query 5 5 query 1 2" },
    { label: "Single item", text: "6 2 9 4 query 2 2" }
  ],
  parse: parsePrefix,
  generate: generatePrefix,

  Scene,
  legend: [{ cls: "s-active", label: "being written" }, { cls: "s-compare", label: "subtracted" }, { cls: "s-found", label: "range and total" }],
  metrics: ({ state: s }) => [
    { label: "n", value: s.nums.length },
    { label: "Built", value: `${s.p.filter((v) => v !== null).length} / ${s.p.length}` },
    { label: "Range", value: s.q ? `[${s.q[0]}, ${s.q[1]}]` : "-" },
    { label: "Answer", value: s.q ? s.p[s.q[1] + 1]! - s.p[s.q[0]]! : "-" }
  ],
  memory: ({ state: s }): MemoryView => ({
    title: "In memory: int[] p (length n + 1)",
    note: "p costs one extra array of n + 1 ints. That memory buys O(1) answers.",
    cells: s.p.map((v, k) => ({ v, live: v !== null, act: (s.i >= 0 && k === s.i + 1) || (!!s.q && (k === s.q[1] + 1 || k === s.q[0])), tone: s.q && k === s.q[1] + 1 ? "found" : s.q && k === s.q[0] ? "compare" : undefined, marks: s.q && k === s.q[1] + 1 ? ["r+1"] : s.q && k === s.q[0] ? ["l"] : [] }))
  }),
  vars: ({ state: s }) => (s.q ? `l = ${s.q[0]}   r = ${s.q[1]}` : `i = ${s.i}`),
  costs: [["build", "O(n)"], ["query", "O(1)"]],
  learn: [
    ["p[0] = 0 avoids a special case", (s) => s.op === "p[0] = 0"],
    ["each total reuses the one before it", (s) => s.kind === "add" && s.state.i >= 0],
    ["a range sum is p[r + 1] - p[l]", (s) => s.kind === "found"],
    ["a range starting at 0 subtracts p[0]", (s) => !!s.state.q && s.state.q[0] === 0]
  ],

  code: { java, python, cpp }
});

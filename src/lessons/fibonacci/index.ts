import { defineLesson } from "../../engine/types";
import DPScene from "../DPScene";
import { parseInts } from "../dpkit";
import { generateFibonacci, type FibState } from "./generate";
import java from "./code/Main.java?raw";
import python from "./code/main.py?raw";
import cpp from "./code/main.cpp?raw";
import theory from "./theory";

export default defineLesson<number, FibState>({
  id: "fibonacci",
  title: "Fibonacci",
  subtitle: "Top-down recursion with a memo: work each value out once, then read it back.",
  minutes: 6,
  level: "intermediate",
  section: "dp",

  inputLabel: "n",
  inputHint: "One whole number from 0 to 15.",
  defaultText: "6",
  presets: [
    { label: "n = 4", text: "4" },
    { label: "n = 10", text: "10" },
    { label: "n = 15", text: "15" }
  ],
  parse: (text) => {
    const r = parseInts(text, { min: 0, max: 15, maxCount: 1 });
    return r.ok ? { ok: true, input: r.input[0] } : r;
  },
  generate: generateFibonacci,

  Scene: DPScene,
  legend: [{ cls: "s-active", label: "memo cell being written" }, { cls: "s-compare", label: "memo hit" }, { cls: "s-found", label: "answer" }, { cls: "s-stale", label: "not computed yet" }],
  metrics: ({ state: s }) => [
    { label: "Calls", value: s.calls },
    { label: "Memo hits", value: s.hits },
    { label: "Stack depth", value: s.stack.length }
  ],
  memory: ({ state: s }) => ({
    title: "In memory: int[] memo",
    note: "One cell per value from 0 to n. A cell is empty (-1) until its value is worked out.",
    cells: s.memo.map((v, i) => {
      const st = s.kind === "row" ? s.cells[i].state : undefined;
      return {
        v: v === null ? "-1" : v, tag: `memo[${i}]`, live: v !== null,
        act: st === "active" || st === "compare",
        tone: st === "compare" ? ("compare" as const) : undefined, marks: []
      };
    })
  }),
  vars: ({ state: s }) => `stack = [${s.stack.map((k) => `fib(${k})`).join(", ")}]   memo = [${s.memo.map((v) => v ?? "-").join(" ")}]`,
  costs: [["time with the memo", "O(n)"], ["memo", "O(n)"], ["call stack", "O(n)"]],
  learn: [
    ["fib(0) and fib(1) return at once, before the memo", (s) => s.anchors.includes("fib.base")],
    ["a value is stored in the memo once both children return", (s) => s.anchors.includes("fib.store")],
    ["a stored value is read back instead of recomputed", (s) => s.anchors.includes("fib.hit")]
  ],

  theory,

  code: { java, python, cpp }
});

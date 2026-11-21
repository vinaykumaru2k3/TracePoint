import { defineLesson, type MemoryView } from "../../engine/types";
import { parseNums, type NumsInput } from "../parseOps";
import Scene from "./Scene";
import { generateQueens, type QueensState } from "./generate";
import java from "./code/Main.java?raw";
import python from "./code/main.py?raw";
import cpp from "./code/main.cpp?raw";
import theory from "./theory";

export default defineLesson<NumsInput, QueensState>({
  id: "n-queens",
  title: "N-Queens",
  subtitle: "Place queens row by row and lift the last one at a dead end.",
  minutes: 8,
  level: "intermediate",
  section: "recursion",

  inputLabel: "Board size n",
  inputHint: "One whole number from 2 to 5.",
  defaultText: "4",
  presets: [
    { label: "5×5 board", text: "5" },
    { label: "No solution", text: "3" }
  ],
  parse: (text) => parseNums(text, { min: 2, max: 5, minLen: 1, maxLen: 1 }),
  generate: generateQueens,

  Scene,
  legend: [{ cls: "s-active", label: "queen" }, { cls: "s-compare", label: "square tried" }, { cls: "s-swap", label: "attacker" }, { cls: "s-found", label: "solution" }],
  metrics: ({ state: s }) => [
    { label: "Row", value: s.row < s.n ? s.row : "-" },
    { label: "Column", value: s.col ?? "-" },
    { label: "Queens placed", value: `${s.cols.length} / ${s.n}` }
  ],
  memory: ({ state: s }): MemoryView => ({
    title: "In memory: int[] cols (queen column per row)",
    note: "One number per row is the whole board. A queen's row is its index, so two queens can never share a row.",
    cells: Array.from({ length: s.n }, (_, r) => ({
      v: r < s.cols.length ? s.cols[r] : null, live: r < s.cols.length,
      act: s.solved ? r < s.cols.length : s.attacker ? r === s.attacker[0] : r === s.cols.length - 1 && s.col !== null && s.lifted === null,
      tone: s.solved ? "found" : s.attacker ? "compare" : undefined, marks: r === s.row && !s.solved ? ["row"] : []
    }))
  }),
  vars: ({ state: s }) => `row = ${s.row}   col = ${s.col ?? "-"}`,
  costs: [["time", "O(n!) worst case"], ["space", "O(n)"]],
  learn: [
    ["a safe square gets a queen and we move to the next row", (s) => s.kind === "add"],
    ["an attacked square is skipped", (s) => s.kind === "check"],
    ["a dead end lifts the last queen", (s) => s.kind === "remove"],
    ["some boards have no solution", (s) => s.kind === "empty"]
  ],

  theory,

  code: { java, python, cpp }
});

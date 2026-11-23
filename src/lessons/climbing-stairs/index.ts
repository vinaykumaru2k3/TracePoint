import { defineLesson } from "../../engine/types";
import DPScene from "../DPScene";
import { parseInts } from "../dpkit";
import { generateClimbingStairs, type StairsState } from "./generate";
import java from "./code/Main.java?raw";
import python from "./code/main.py?raw";
import cpp from "./code/main.cpp?raw";
import theory from "./theory";

export default defineLesson<number, StairsState>({
  id: "climbing-stairs",
  title: "Climbing stairs",
  subtitle: "Bottom-up table: each stair's count is the sum of the two stairs below it.",
  minutes: 5,
  level: "intermediate",
  section: "dp",

  inputLabel: "n",
  inputHint: "One whole number from 1 to 20.",
  defaultText: "6",
  presets: [
    { label: "n = 3", text: "3" },
    { label: "n = 10", text: "10" },
    { label: "n = 20", text: "20" }
  ],
  parse: (text) => {
    const r = parseInts(text, { min: 1, max: 20, maxCount: 1 });
    return r.ok ? { ok: true, input: r.input[0] } : r;
  },
  generate: generateClimbingStairs,

  Scene: DPScene,
  legend: [{ cls: "s-active", label: "cell being written" }, { cls: "s-compare", label: "cells read" }, { cls: "s-found", label: "answer" }, { cls: "s-stale", label: "not computed yet" }],
  metrics: ({ state: s }) => [
    { label: "i", value: s.i ?? "-" },
    { label: "Cells filled", value: s.filled },
    { label: "Table size", value: s.ways.length }
  ],
  memory: ({ state: s }) => ({
    title: "In memory: int[] ways",
    note: "One cell per stair from 0 to n. A cell stays 0 until the loop reaches it.",
    cells: s.ways.map((v, i) => {
      const st = s.kind === "row" ? s.cells[i].state : undefined;
      return {
        v: v === null ? "0" : v, tag: `ways[${i}]`, live: v !== null,
        act: st === "active" || st === "compare",
        tone: st === "compare" ? ("compare" as const) : undefined, marks: []
      };
    })
  }),
  vars: ({ state: s }) => `i = ${s.i ?? "-"}   ways = [${s.ways.map((v) => v ?? "-").join(" ")}]`,
  costs: [["time", "O(n)"], ["table", "O(n)"], ["recursion", "none"]],
  learn: [
    ["the two base cells are set by hand", (s) => s.anchors.includes("stairs.base")],
    ["each i reads the two cells just below it", (s) => s.anchors.includes("stairs.loop")],
    ["each i writes one sum into the table", (s) => s.anchors.includes("stairs.fill")]
  ],

  theory,

  code: { java, python, cpp }
});

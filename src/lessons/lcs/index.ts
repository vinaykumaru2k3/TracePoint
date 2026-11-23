import { defineLesson } from "../../engine/types";
import DPScene from "../DPScene";
import { parseWords, tableMemory } from "../dpkit";
import { generateLcs, type LcsInput, type LcsState } from "./generate";
import java from "./code/Main.java?raw";
import python from "./code/main.py?raw";
import cpp from "./code/main.cpp?raw";
import theory from "./theory";

const FORMAT = 'Type two words of letters separated by a comma, like "AGCAT, GAC". Use - for an empty word.';

export default defineLesson<LcsInput, LcsState>({
  id: "lcs",
  title: "Longest common subsequence",
  subtitle: "A 2D table over two words: matching letters grow the diagonal, other cells take the larger neighbour.",
  minutes: 9,
  level: "intermediate",
  section: "dp",

  inputLabel: "two words",
  inputHint: "Two words of letters, up to 6 letters each, separated by a comma. Use - for an empty word. Example: AGCAT, GAC.",
  defaultText: "AGCAT GAC",
  presets: [
    { label: "AGCAT, GAC", text: "AGCAT GAC" },
    { label: "all match", text: "ABCDEF ABCDEF" },
    { label: "no match", text: "ABC XYZ" },
    { label: "swapped words", text: "GAC AGCAT" }
  ],
  parse: (text) => {
    const toks = text.split(/[\s,;]+/).filter(Boolean);
    if (toks.length !== 2) return { ok: false, error: FORMAT };
    const typed = toks.filter((t) => t !== "-");
    const r = parseWords(typed.join(" "), { maxLen: 6, count: typed.length });
    if (!r.ok) return { ok: false, error: r.error };
    let k = 0;
    const [a, b] = toks.map((t) => (t === "-" ? "" : r.input[k++]));
    return { ok: true, input: { a, b } };
  },
  generate: generateLcs,

  Scene: DPScene,
  legend: [{ cls: "s-active", label: "cell being written" }, { cls: "s-compare", label: "cells read" }, { cls: "s-found", label: "answer and path back" }],
  metrics: ({ state: s }) => [
    { label: "Row", value: s.i ?? "-" },
    { label: "Column", value: s.j ?? "-" },
    { label: "Cells done", value: s.filled }
  ],
  memory: ({ state: s }) => s.kind === "grid"
    ? tableMemory("In memory: int[][] dp", s.grid, s.rowHead, s.colHead,
        "One row per letter of the first word and one column per letter of the second. A cell holds the longest shared subsequence of those prefixes. _ means not computed yet.")
    : { title: "In memory: int[][] dp", note: "", cells: [] },
  vars: ({ state: s }) => `i = ${s.i ?? "-"}   j = ${s.j ?? "-"}   common = "${s.common}"`,
  costs: [["time", "O(n × m)"], ["table", "O(n × m)"], ["recursion", "none"]],
  learn: [
    ["row 0 and column 0 start at 0", (s) => s.anchors.includes("lc.init")],
    ["a matching letter adds 1 to the diagonal", (s) => s.kind === "add" && s.anchors.includes("lc.match")],
    ["a mismatch takes the larger of up and left", (s) => s.anchors.includes("lc.max")],
    ["the traceback spells the subsequence", (s) => s.kind === "found"]
  ],

  theory,

  code: { java, python, cpp }
});

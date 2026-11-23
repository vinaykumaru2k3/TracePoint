import { defineLesson } from "../../engine/types";
import DPScene from "../DPScene";
import { parseWords, tableMemory } from "../dpkit";
import { generateEdit, type EditInput, type EditState } from "./generate";
import java from "./code/Main.java?raw";
import python from "./code/main.py?raw";
import cpp from "./code/main.cpp?raw";
import theory from "./theory";

const FORMAT = 'Type two words of letters separated by a comma, like "HORSE, ROS". Use - for an empty word.';

export default defineLesson<EditInput, EditState>({
  id: "edit-distance",
  title: "Edit distance",
  subtitle: "A 2D table over two words: the fewest inserts, deletes and replaces that turn one word into the other.",
  minutes: 9,
  level: "intermediate",
  section: "dp",

  inputLabel: "two words",
  inputHint: "Two words of letters, up to 6 letters each, separated by a comma. Use - for an empty word. Example: HORSE, ROS.",
  defaultText: "horse ros",
  presets: [
    { label: "HORSE, ROS", text: "horse ros" },
    { label: "same word", text: "abc abc" },
    { label: "ROS, HORSE", text: "ros horse" },
    { label: "no match", text: "abc xyz" },
    { label: "empty word", text: "- abc" }
  ],
  parse: (text) => {
    const toks = text.split(/[\s,;]+/).filter(Boolean);
    if (toks.length !== 2) return { ok: false, error: FORMAT };
    const typed = toks.filter((t) => t !== "-");
    if (typed.length === 0) return { ok: true, input: { a: "", b: "" } };
    const r = parseWords(typed.join(" "), { maxLen: 6, count: typed.length });
    if (!r.ok) return { ok: false, error: r.error };
    let k = 0;
    const [a, b] = toks.map((t) => (t === "-" ? "" : r.input[k++]));
    return { ok: true, input: { a, b } };
  },
  generate: generateEdit,

  Scene: DPScene,
  legend: [{ cls: "s-active", label: "cell being written" }, { cls: "s-compare", label: "cells read" }, { cls: "s-found", label: "answer and path back" }],
  metrics: ({ state: s }) => [
    { label: "Row", value: s.i ?? "-" },
    { label: "Column", value: s.j ?? "-" },
    { label: "Cells done", value: s.filled }
  ],
  memory: ({ state: s }) => s.kind === "grid"
    ? tableMemory("In memory: int[][] dp", s.grid, s.rowHead, s.colHead,
        "One row per letter of the first word and one column per letter of the second. A cell holds the fewest edits for those prefixes. _ means not computed yet.")
    : { title: "In memory: int[][] dp", note: "", cells: [] },
  vars: ({ state: s }) => `i = ${s.i ?? "-"}   j = ${s.j ?? "-"}   edits = ${s.edits.length}`,
  costs: [["time", "O(n × m)"], ["table", "O(n × m)"], ["recursion", "none"]],
  learn: [
    ["row 0 and column 0 count 0, 1, 2, ...", (s) => s.anchors.includes("ed.init")],
    ["a matching letter copies the diagonal", (s) => s.kind === "check" && s.anchors.includes("ed.match")],
    ["a mismatch takes 1 + the smallest of three neighbours", (s) => s.anchors.includes("ed.min")],
    ["the traceback names each edit", (s) => s.kind === "found"]
  ],

  theory,

  code: { java, python, cpp }
});

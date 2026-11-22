import { defineLesson, type MemoryView } from "../../engine/types";
import { parseNums, type NumsInput } from "../parseOps";
import Scene from "./Scene";
import { generateSubsets, type SubsetsState } from "./generate";
import java from "./code/Main.java?raw";
import python from "./code/main.py?raw";
import cpp from "./code/main.cpp?raw";
import theory from "./theory";

export default defineLesson<NumsInput, SubsetsState>({
  id: "backtracking",
  title: "Backtracking",
  subtitle: "List every subset by taking an item, undoing it, then skipping it.",
  minutes: 7,
  level: "intermediate",
  section: "recursion",

  inputLabel: "Items",
  inputHint: "1 to 3 different numbers.",
  defaultText: "1 2 3",
  presets: [
    { label: "Two items", text: "4 7" },
    { label: "One item", text: "5" }
  ],
  parse: (text) => {
    const r = parseNums(text, { minLen: 1, maxLen: 3 });
    if (r.ok && new Set(r.input.nums).size !== r.input.nums.length) return { ok: false, error: "Use different numbers so every subset is distinct." };
    return r;
  },
  generate: generateSubsets,

  Scene,
  legend: [{ cls: "s-active", label: "taken" }, { cls: "s-compare", label: "skipped" }, { cls: "s-found", label: "recorded subset" }],
  metrics: ({ state: s }) => [
    { label: "Deciding item", value: s.depth < s.items.length ? s.depth : "-" },
    { label: "Path", value: `[${s.path.join(", ")}]` },
    { label: "Subsets found", value: `${s.found.length} / ${2 ** s.items.length}` }
  ],
  memory: ({ state: s }): MemoryView => ({
    title: "In memory: path (one list, changed in place)",
    note: "Only one path list exists. Each record copies it, which is why found subsets don't change when the path does.",
    cells: s.items.map((_, i) => ({
      v: i < s.path.length ? s.path[i] : null, live: i < s.path.length,
      act: i < s.path.length && (s.choice === "record" || (s.choice === "take" && i === s.path.length - 1)),
      tone: s.choice === "record" ? "found" : undefined, marks: []
    }))
  }),
  vars: ({ state: s }) => `i = ${s.depth}   path = [${s.path.join(", ")}]`,
  costs: [["time", "O(n · 2^n)"], ["stack depth", "O(n)"]],
  learn: [
    ["take: add the item and go deeper", (s) => s.state.choice === "take"],
    ["undo: remove it on the way back", (s) => s.state.choice === "undo"],
    ["skip: go deeper without it", (s) => s.state.choice === "skip"],
    ["a full path records one subset", (s) => s.state.choice === "record"]
  ],

  theory,

  code: { java, python, cpp }
});

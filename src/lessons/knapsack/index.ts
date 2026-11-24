import { defineLesson } from "../../engine/types";
import DPScene from "../DPScene";
import { parseInts, tableMemory } from "../dpkit";
import { generateKnapsack, type KnapInput, type KnapState } from "./generate";
import java from "./code/Main.java?raw";
import python from "./code/main.py?raw";
import cpp from "./code/main.cpp?raw";
import theory from "./theory";

const FORMAT = 'Type the items as weight:value pairs and then the capacity, like "items 2:3, 3:4 cap 5".';

export default defineLesson<KnapInput, KnapState>({
  id: "knapsack",
  title: "0/1 knapsack",
  subtitle: "A 2D table: for each item and each capacity, take the item or skip it, and keep the better value.",
  minutes: 9,
  level: "intermediate",
  section: "dp",

  inputLabel: "items w:v, capacity",
  inputHint: "Up to 4 items written weight:value (weight 1 to 8, value 1 to 20), then a capacity from 1 to 8. Example: items 2:3, 3:4 cap 5.",
  defaultText: "items 2:3, 3:4, 4:5, 5:6 cap 5",
  presets: [
    { label: "4 items, cap 5", text: "items 2:3, 3:4, 4:5, 5:6 cap 5" },
    { label: "heavy item skipped", text: "items 2:3, 7:9, 3:4 cap 5" },
    { label: "cap 8", text: "items 3:4, 4:5, 5:8, 2:3 cap 8" }
  ],
  parse: (text) => {
    const m = /^\s*(?:items?\s*[:=]?\s*)?([^]*?)[\s,;]+cap(?:acity)?\s*[:=]?\s*([^]*)$/i.exec(text);
    if (!m) return { ok: false, error: FORMAT };
    const toks = m[1].split(/[\s,;]+/).filter(Boolean);
    if (!toks.length) return { ok: false, error: FORMAT };
    const ws: string[] = [], vs: string[] = [];
    for (const t of toks) {
      const p = /^(\d+):(\d+)$/.exec(t);
      if (!p) return { ok: false, error: `Could not read "${t}". Write each item as weight:value, like 2:3.` };
      ws.push(p[1]); vs.push(p[2]);
    }
    const w = parseInts(ws.join(" "), { min: 1, max: 8, maxCount: 4 });
    if (!w.ok) return { ok: false, error: `Weights: ${w.error}` };
    const v = parseInts(vs.join(" "), { min: 1, max: 20, maxCount: 4 });
    if (!v.ok) return { ok: false, error: `Values: ${v.error}` };
    const c = parseInts(m[2], { min: 1, max: 8, maxCount: 1 });
    if (!c.ok) return { ok: false, error: `Capacity: ${c.error}` };
    return { ok: true, input: { items: w.input.map((x, k) => ({ w: x, v: v.input[k] })), cap: c.input[0] } };
  },
  generate: generateKnapsack,

  Scene: DPScene,
  legend: [{ cls: "s-active", label: "cell being written" }, { cls: "s-compare", label: "cells read" }, { cls: "s-found", label: "answer and items taken" }],
  metrics: ({ state: s }) => [
    { label: "Item", value: s.i ?? "-" },
    /* Names the row headers (2:3, 3:4, ...) on the stage: each is an item's weight:value. */
    { label: "weight:value", value: s.kind === "grid" && s.i ? s.rowHead[s.i] ?? "-" : "-" },
    { label: "Room", value: s.w ?? "-" },
    { label: "Cells done", value: s.filled }
  ],
  memory: ({ state: s }) => s.kind === "grid"
    ? tableMemory("In memory: int[][] dp", s.grid, s.rowHead, s.colHead,
        "One row per item count and one column per capacity. A cell holds the best value for that many items and that much room. _ means not computed yet.")
    : { title: "In memory: int[][] dp", note: "", cells: [] },
  vars: ({ state: s }) => `i = ${s.i ?? "-"}   w = ${s.w ?? "-"}   taken = [${s.taken.join(" ")}]`,
  costs: [["time", "O(n × W)"], ["table", "O(n × W)"], ["recursion", "none"]],
  learn: [
    ["row 0 and column 0 start at 0", (s) => s.anchors.includes("kn.init")],
    ["an item heavier than the room is skipped", (s) => s.kind === "check" && s.title.includes("too heavy")],
    ["taking an item can beat skipping it", (s) => s.anchors.includes("kn.take")],
    ["the traceback names the items taken", (s) => s.anchors.includes("kn.trace")]
  ],

  theory,

  code: { java, python, cpp }
});

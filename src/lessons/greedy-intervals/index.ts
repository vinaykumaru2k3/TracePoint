import { defineLesson, type ParseResult } from "../../engine/types";
import DPScene from "../DPScene";
import { tableMemory } from "../dpkit";
import { generateGreedy, MAX_END, type GreedyInput, type GreedyState } from "./generate";
import java from "./code/Main.java?raw";
import python from "./code/main.py?raw";
import cpp from "./code/main.cpp?raw";
import theory from "./theory";

const FORMAT = `Type up to 7 intervals as start-end separated by commas, like "1-3, 2-5, 4-7". Each number is 0 to ${MAX_END}.`;
const MAX_COUNT = 7;

function parseIntervals(text: string): ParseResult<GreedyInput> {
  const items = text.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);
  if (!items.length) return { ok: false, error: `Type at least one interval. ${FORMAT}` };
  if (items.length > MAX_COUNT) return { ok: false, error: `Keep it to ${MAX_COUNT} intervals or fewer so the steps stay readable.` };
  const out: GreedyInput = [];
  for (const it of items) {
    const m = it.match(/^(\d+)\s*-\s*(\d+)$/);
    if (!m) return { ok: false, error: `Could not read "${it}". ${FORMAT}` };
    const s = Number(m[1]), e = Number(m[2]);
    for (const v of [s, e]) if (v > MAX_END) return { ok: false, error: `${v} is out of range. Use numbers from 0 to ${MAX_END}, so the number line fits.` };
    if (s >= e) return { ok: false, error: `"${it}" ends at ${e}, which is not after its start ${s}. The start must come before the end, like ${Math.min(s, MAX_END - 1)}-${Math.min(s, MAX_END - 1) + 1}.` };
    out.push({ s, e });
  }
  return { ok: true, input: out };
}

export default defineLesson<GreedyInput, GreedyState>({
  id: "greedy-intervals",
  title: "Greedy intervals",
  subtitle: "Activity selection: sort by end time, then keep every interval that starts at or after the last one taken.",
  minutes: 7,
  level: "intermediate",
  section: "advanced",

  inputLabel: "intervals",
  inputHint: `Up to 7 intervals as start-end, separated by commas. Numbers 0 to ${MAX_END}, and the start must come before the end.`,
  defaultText: "1-3, 2-5, 4-7, 1-8, 5-9, 8-10",
  presets: [
    { label: "default", text: "1-3, 2-5, 4-7, 1-8, 5-9, 8-10" },
    { label: "touching", text: "1-3, 3-5" },
    { label: "all overlap", text: "1-5, 2-6, 3-7, 4-8" },
    { label: "one big one", text: "0-12, 1-3, 4-6, 7-9" },
    { label: "same end", text: "3-5, 1-5, 5-8, 2-8" }
  ],
  parse: parseIntervals,
  generate: generateGreedy,

  Scene: DPScene,
  legend: [
    { cls: "s-default", label: "interval, not decided" },
    { cls: "s-active", label: "interval taken now" },
    { cls: "s-found", label: "interval taken earlier" },
    { cls: "s-stale", label: "empty plate, or a skipped interval marked x" }
  ],
  metrics: ({ state: s }) => [
    { label: "Taken", value: s.taken },
    { label: "Last end", value: s.lastEnd },
    { label: "Looked at", value: s.seen }
  ],
  memory: ({ state: s }) => s.kind === "grid"
    ? tableMemory("In memory: sorted intervals", s.grid, s.rowHead, s.colHead,
        "Each row is one interval, drawn over the plates for times 0 to 12. A gap is _, a covered plate is # when the interval is kept and x when it is skipped.")
    : { title: "In memory: sorted intervals", note: "", cells: [] },
  vars: ({ state: s }) => `last_end = ${s.lastEnd}   count = ${s.taken}`,
  costs: [["sort by end", "O(n log n)"], ["scan", "O(n)"], ["whole method", "O(n log n)"]],
  learn: [
    ["sort by end first", (s) => s.anchors.includes("greedy.sort")],
    ["take when start >= last end", (s) => s.anchors.includes("greedy.take")],
    ["skip an overlap", (s) => s.kind === "check" && /overlap/.test(s.text)],
    ["touching intervals both fit", (s) => s.anchors.includes("greedy.take") && /touch/.test(s.text)]
  ],

  theory,

  code: { java, python, cpp }
});

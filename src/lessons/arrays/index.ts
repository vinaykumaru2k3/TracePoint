import { defineLesson, type MemoryView } from "../../engine/types";
import Scene from "./Scene";
import { generateArray, parseArrayOps, type ArrayOp, type ArrayState } from "./generate";
import java from "./code/Main.java?raw";
import python from "./code/main.py?raw";
import cpp from "./code/main.cpp?raw";
import theory from "./theory";

export default defineLesson<ArrayOp[], ArrayState>({
  id: "arrays",
  title: "Arrays",
  subtitle: "Read any slot at once, append at the end, and watch inserts and removes shift items.",
  minutes: 5,
  level: "beginner",
  section: "foundations",

  inputLabel: "Operations",
  inputHint: "append V, get I, insert I V, remove I. Up to 12.",
  defaultText: "append 3, append 8, append 5, get 2, insert 1 7, remove 0",
  presets: [
    { label: "Insert at the front", text: "append 1, append 2, append 3, append 4, insert 0 9" },
    { label: "Out of range", text: "append 4, append 6, get 3, remove 2, get 1" },
    { label: "Fill it up", text: "append 1, append 2, append 3, append 4, append 5, append 6, append 7, append 8" }
  ],
  parse: parseArrayOps,
  generate: generateArray,

  Scene,
  legend: [{ cls: "s-active", label: "written" }, { cls: "s-compare", label: "copied from" }, { cls: "s-found", label: "read" }, { cls: "s-stale", label: "past size" }],
  metrics: ({ state: s }) => [
    { label: "Size", value: s.size },
    { label: "Capacity", value: s.cap },
    { label: "Free", value: s.cap - s.size },
    { label: "Touched", value: s.at >= 0 ? `data[${s.at}]` : "none" }
  ],
  memory: ({ state: s }): MemoryView => ({
    title: "In memory: int[] data",
    note: "One contiguous block. Slot i lives at start + i × 4 bytes, which is why indexing is O(1).",
    cells: s.data.map((v, k) => ({ v, live: k < s.size, act: k === s.at, tone: s.mode === "read" ? "found" : undefined, marks: k === s.size ? ["size"] : [] }))
  }),
  vars: ({ state: s }) => `size = ${s.size}`,
  costs: [["get", "O(1)"], ["append", "O(1)"], ["insert", "O(n)"], ["remove", "O(n)"]],
  learn: [
    ["indexing jumps straight to a slot", (s) => s.kind === "peek"],
    ["append writes one slot at the end", (s) => s.kind === "add" && !!s.op?.startsWith("append")],
    ["insert shifts later items right", (s) => s.kind === "move" && !!s.op?.endsWith("right")],
    ["remove shifts later items left", (s) => s.kind === "move" && !!s.op?.endsWith("left")],
    ["a fixed array cannot grow past capacity", (s) => s.kind === "empty" && s.retNote === "array is full"]
  ],

  theory,

  code: { java, python, cpp }
});

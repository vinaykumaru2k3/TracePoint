import { defineLesson, toneOf, type MemoryView } from "../../engine/types";
import { parseNums, type NumsInput } from "../parseOps";
import Scene from "./Scene";
import { FS_MAX, generateFs, type FsState } from "./generate";
import java from "./code/Main.java?raw";
import python from "./code/main.py?raw";
import cpp from "./code/main.cpp?raw";

export default defineLesson<NumsInput, FsState>({
  id: "fast-and-slow-pointers",
  title: "Fast and slow pointers",
  subtitle: "Detect a cycle with two pointers moving at different speeds, in O(1) memory.",
  minutes: 6,
  level: "intermediate",
  section: "linear",

  inputLabel: "List values",
  inputHint: `2 to ${FS_MAX} numbers. End with "cycle I" to link the last node back to index I.`,
  defaultText: "1 2 3 4 5 6 cycle 2",
  presets: [
    { label: "No cycle", text: "3 1 4 1 5" },
    { label: "Tail points to head", text: "1 2 3 4 cycle 0" },
    { label: "Loop on the last node", text: "5 6 7 8 cycle 3" }
  ],
  parse: (text) => {
    const r = parseNums(text, { minLen: 2, maxLen: FS_MAX, key: "cycle", keyMin: 0, keyMax: FS_MAX - 1 });
    if (r.ok && r.input.k !== undefined && r.input.k >= r.input.nums.length)
      return { ok: false, error: `cycle must name an index from 0 to ${r.input.nums.length - 1}.` };
    return r;
  },
  generate: generateFs,

  Scene,
  legend: [{ cls: "s-visited", label: "slow moved" }, { cls: "s-compare", label: "fast moved" }, { cls: "s-found", label: "they met" }],
  metrics: ({ state: s }) => [
    { label: "Rounds", value: s.hops },
    { label: "slow", value: s.slow === null ? "-" : s.vals[s.slow] },
    { label: "fast", value: s.fast === null ? "null" : s.vals[s.fast] },
    { label: "Cycle", value: s.met ? "yes" : "?" }
  ],
  memory: ({ state: s }): MemoryView => ({
    title: "In memory: Node objects",
    note: "The code only sees the next pointers. The loop is invisible until two pointers land on the same address.",
    cells: s.vals.map((v, i) => {
      const marks: string[] = [];
      if (i === s.slow) marks.push("slow");
      if (i === s.fast) marks.push("fast");
      /* Same colour as the drawing: only the pointer that just moved, or the meeting node, is lit. */
      const tone = s.met && i === s.slow ? "found" : s.moved === "fast" && i === s.fast ? "compare" : s.moved === "slow" && i === s.slow ? "visited" : undefined;
      return { v: `${v}→${s.next[i] === null ? "null" : `@${s.next[i]}`}`, tag: `@${i}`, live: true, act: !!tone, tone, marks };
    })
  }),
  vars: ({ state: s }) => {
    const at = (i: number | null) => (i === null ? "null" : `@${i}`);
    return `slow = ${at(s.slow)}   fast = ${at(s.fast)}`;
  },
  costs: [["time", "O(n)"], ["extra space", "O(1)"]],
  learn: [
    ["slow moves one node per round", (s) => s.anchors.includes("fs.slow")],
    ["fast moves two nodes per round", (s) => s.anchors.includes("fs.fast")],
    ["in a cycle, fast catches up and they meet", (s) => s.kind === "found"],
    ["without a cycle, fast reaches null", (s) => s.anchors.includes("fs.none")]
  ],

  code: { java, python, cpp }
});

import { defineLesson, type MemoryView } from "../../engine/types";
import { parseOps, type Op } from "../parseOps";
import Scene from "./Scene";
import { generateStack, type StackState } from "./generate";
import java from "./code/Main.java?raw";
import python from "./code/main.py?raw";
import cpp from "./code/main.cpp?raw";

export default defineLesson<Op[], StackState>({
  id: "stack",
  title: "Stack",
  subtitle: "Push, peek and pop on an array, and watch the top index move.",
  minutes: 4,
  level: "beginner",
  section: "linear",

  inputLabel: "Operations",
  inputHint: "push N, pop, peek. Up to 16.",
  defaultText: "push 4, push 9, push 2, peek, pop, pop, push 7, pop, pop, pop",
  presets: [
    { label: "Overwrite a stale slot", text: "push 4, push 9, pop, push 7" },
    { label: "Pop an empty stack", text: "pop, push 3, pop, pop" },
    { label: "Fill it up", text: "push 1, push 2, push 3, push 4, push 5, push 6, push 7" }
  ],
  parse: (text) => parseOps(text, "push", ["pop", "peek"]),
  generate: generateStack,

  Scene,
  legend: [{ cls: "s-active", label: "pushed or popped" }, { cls: "s-found", label: "peeked" }, { cls: "s-default", label: "waiting" }],
  metrics: ({ state: s }) => [
    { label: "Size", value: s.items.length },
    { label: "Top", value: s.top },
    { label: "Next write", value: s.top + 1 < s.cap ? `data[${s.top + 1}]` : "full" },
    { label: "Free", value: s.cap - s.items.length }
  ],
  memory: ({ state: s }): MemoryView => ({
    title: "In memory: int[] data",
    note: "Dashed cells are not part of the stack. Popped values stay behind until overwritten.",
    cells: s.arr.map((v, i) => ({ v, live: i <= s.top, act: i === s.cell, tone: s.mode === "peek" ? "found" : undefined, marks: i === s.top ? ["top"] : [] }))
  }),
  vars: ({ state: s }) => `top = ${s.top}`,
  costs: [["push", "O(1)"], ["pop", "O(1)"], ["peek", "O(1)"]],
  learn: [
    ["push adds to the top and nothing else moves", (s) => s.kind === "add"],
    ["peek reads the top without removing it", (s) => s.kind === "peek"],
    ["pop returns the newest item first", (s) => s.kind === "remove"],
    ["a later push overwrites a stale slot", (s) => !!s.state.overwrote],
    ["popping an empty stack throws an exception", (s) => s.kind === "empty" && s.op === "pop()"]
  ],

  code: { java, python, cpp }
});

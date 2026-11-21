import { defineLesson, type MemoryView } from "../../engine/types";
import { parseNums, type NumsInput } from "../parseOps";
import Scene from "./Scene";
import { generateCallStack, type CallStackState } from "./generate";
import java from "./code/Main.java?raw";
import python from "./code/main.py?raw";
import cpp from "./code/main.cpp?raw";

export default defineLesson<NumsInput, CallStackState>({
  id: "call-stack",
  title: "Call stack",
  subtitle: "Watch fact(n) push a frame per call and pop one per return.",
  minutes: 5,
  level: "beginner",
  section: "recursion",

  inputLabel: "n",
  inputHint: "One whole number from 0 to 7.",
  defaultText: "4",
  presets: [
    { label: "Base case only", text: "0" },
    { label: "One call deep", text: "1" },
    { label: "Deeper stack", text: "6" }
  ],
  parse: (text) => parseNums(text, { min: 0, max: 7, minLen: 1, maxLen: 1 }),
  generate: generateCallStack,

  Scene,
  legend: [{ cls: "s-active", label: "running frame" }, { cls: "s-found", label: "returning" }],
  metrics: ({ state: s }) => [
    { label: "n", value: s.n },
    { label: "Stack depth", value: s.frames.length },
    { label: "Calls made", value: s.calls },
    { label: "Result", value: s.result ?? "-" }
  ],
  memory: ({ state: s }): MemoryView => ({
    title: "In memory: the call stack",
    note: "Each frame holds its own n and a return address. Deep recursion runs out of stack long before it runs out of heap.",
    cells: s.frames.map((f, i) => ({
      v: f.ret ?? `n=${f.k}`, live: true, act: i === s.active, tone: f.ret === null ? undefined : "found",
      tag: `fact(${f.k})`, marks: i === s.active ? ["top"] : []
    }))
  }),
  vars: ({ state: s }) => (s.frames.length ? `n = ${s.frames[s.frames.length - 1].k}   depth = ${s.frames.length}` : `result = ${s.result ?? "-"}`),
  costs: [["time", "O(n)"], ["stack space", "O(n)"]],
  learn: [
    ["each call pushes a new frame", (s) => s.kind === "add"],
    ["the base case stops the recursion", (s) => s.kind === "found"],
    ["returns pop frames in reverse order", (s) => s.kind === "remove"]
  ],

  code: { java, python, cpp }
});

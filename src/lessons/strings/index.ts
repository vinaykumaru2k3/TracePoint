import { defineLesson, type MemoryView } from "../../engine/types";
import Scene from "./Scene";
import { generateString, parseWord, type StringState } from "./generate";
import java from "./code/Main.java?raw";
import python from "./code/main.py?raw";
import cpp from "./code/main.cpp?raw";
import theory from "./theory";

export default defineLesson<string, StringState>({
  id: "strings",
  title: "Strings",
  subtitle: "Read characters by index, build a reversed copy, and check for a palindrome.",
  minutes: 4,
  level: "beginner",
  section: "foundations",

  inputLabel: "Word",
  inputHint: "3 to 9 letters.",
  defaultText: "level",
  presets: [
    { label: "Not a palindrome", text: "stack" },
    { label: "Longer palindrome", text: "racecar" },
    { label: "Even length", text: "noon" }
  ],
  parse: parseWord,
  generate: generateString,

  Scene,
  legend: [{ cls: "s-active", label: "being copied" }, { cls: "s-found", label: "matches" }, { cls: "s-swap", label: "mismatch" }],
  metrics: ({ state: s }) => [
    { label: "Length", value: s.s.length },
    { label: "i", value: s.i },
    { label: "Builder", value: `"${s.out.join("")}"` },
    { label: "Palindrome", value: s.same === null ? "?" : s.same ? "yes" : "no" }
  ],
  memory: ({ state: s }): MemoryView => ({
    title: "In memory: char[] behind the string",
    note: "The string's characters sit in one array. It is read-only, so reversing writes into a separate buffer.",
    cells: s.s.map((c, k) => ({ v: `'${c}'`, live: true, act: k === s.i, marks: k === s.i ? ["i"] : [] }))
  }),
  vars: ({ state: s }) => `i = ${s.i}   sb = "${s.out.join("")}"`,
  costs: [["s[i]", "O(1)"], ["append", "O(1)"], ["reverse", "O(n)"], ["equals", "O(n)"]],
  learn: [
    ["strings cannot change, so you build a new one", (s) => s.op === "new builder"],
    ["reading backwards visits characters in reverse", (s) => s.kind === "add" && !!s.op?.startsWith("append")],
    ["equals compares one character at a time", (s) => s.kind === "check"],
    ["a palindrome equals its own reverse", (s) => s.state.same === true],
    ["the first mismatch ends the comparison", (s) => s.state.same === false]
  ],

  theory,

  code: { java, python, cpp }
});

import { defineLesson, type MemoryView } from "../../engine/types";
import { parseOps, type Op } from "../parseOps";
import Scene from "./Scene";
import { generateDeque, type DequeState } from "./generate";
import java from "./code/Main.java?raw";
import python from "./code/main.py?raw";
import cpp from "./code/main.cpp?raw";

const ALIASES: Record<string, string> = {
  push_front: "pushfront", addfirst: "pushfront", appendleft: "pushfront", offerfirst: "pushfront",
  push_back: "pushback", addlast: "pushback", append: "pushback", offerlast: "pushback",
  pop_front: "popfront", pollfirst: "popfront", popleft: "popfront", removefirst: "popfront",
  pop_back: "popback", polllast: "popback", pop: "popback", removelast: "popback"
};

export default defineLesson<Op[], DequeState>({
  id: "deque",
  title: "Deque",
  subtitle: "Push and pop at both ends of a circular array, and watch head wrap around.",
  minutes: 5,
  level: "beginner",
  section: "linear",

  inputLabel: "Operations",
  inputHint: "pushfront N, pushback N, popfront, popback. Up to 16.",
  defaultText: "pushback 4, pushback 9, pushfront 2, pushfront 7, popback, popfront, pushback 5, popfront, popfront",
  presets: [
    { label: "Use it as a stack", text: "pushback 1, pushback 2, pushback 3, popback, popback, popback" },
    { label: "Pop an empty deque", text: "popfront, pushfront 3, popback, popback, pushback 1" },
    { label: "Fill it up", text: "pushback 1, pushfront 2, pushback 3, pushfront 4, pushback 5, pushfront 6, pushback 7" }
  ],
  parse: (text) => parseOps(text, ["pushfront", "pushback"], ["popfront", "popback"], ALIASES),
  generate: generateDeque,

  Scene,
  legend: [{ cls: "s-active", label: "just added" }, { cls: "s-visited", label: "slot touched" }, { cls: "s-default", label: "waiting" }],
  metrics: ({ state: s }) => [
    { label: "Size", value: s.size },
    { label: "Head", value: s.head },
    { label: "Back", value: s.size ? (s.head + s.size - 1) % s.cap : "-" },
    { label: "Free", value: s.cap - s.size }
  ],
  memory: ({ state: s }): MemoryView => ({
    title: "In memory: int[] data",
    note: "One array used as a ring. Front and back can both sit anywhere; the live items are the size slots from head onward.",
    cells: s.arr.map((v, i) => {
      const marks: string[] = [];
      if (s.size > 0 && i === s.head) marks.push("front");
      if (s.size > 0 && i === (s.head + s.size - 1) % s.cap) marks.push("back");
      return { v, live: (i - s.head + s.cap) % s.cap < s.size, act: i === s.cell, tone: s.hl === null && s.mode ? "visited" : undefined, marks };
    })
  }),
  vars: ({ state: s }) => `head = ${s.head}   size = ${s.size}`,
  costs: [["pushFront", "O(1)"], ["pushBack", "O(1)"], ["popFront", "O(1)"], ["popBack", "O(1)"]],
  learn: [
    ["pushFront steps head backwards", (s) => s.kind === "add" && s.state.mode === "front"],
    ["pushBack writes after the back", (s) => s.kind === "add" && s.state.mode === "back"],
    ["both ends can be removed in O(1)", (s) => s.kind === "remove" && s.state.mode === "back"],
    ["head wraps from slot 0 to the last slot", (s) => !!s.state.wrapped && s.state.mode === "front"],
    ["removing from an empty deque throws", (s) => s.kind === "empty" && s.retNote === "deque is empty"]
  ],

  code: { java, python, cpp }
});

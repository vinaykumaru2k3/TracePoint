import { defineLesson, type MemoryView } from "../../engine/types";
import { parseOps, type Op } from "../parseOps";
import Scene from "./Scene";
import { generateQueue, type QueueState } from "./generate";
import java from "./code/Main.java?raw";
import python from "./code/main.py?raw";
import cpp from "./code/main.cpp?raw";

export default defineLesson<Op[], QueueState>({
  id: "queue",
  title: "Queue",
  subtitle: "Offer, peek and poll on a circular array, and watch head and size move.",
  minutes: 5,
  level: "beginner",
  section: "linear",

  inputLabel: "Operations",
  inputHint: "offer N, poll, peek. Up to 16.",
  defaultText: "offer 4, offer 9, offer 2, peek, poll, offer 7, offer 5, poll, poll, poll, poll, poll",
  presets: [
    { label: "Wrap around", text: "offer 1, offer 2, offer 3, poll, poll, offer 4, offer 5, offer 6" },
    { label: "Poll an empty queue", text: "poll, offer 3, poll, poll" },
    { label: "Fill it up", text: "offer 1, offer 2, offer 3, offer 4, offer 5" }
  ],
  parse: (text) => parseOps(text, "offer", ["poll", "peek"], { enq: "offer", enqueue: "offer", deq: "poll", dequeue: "poll" }),
  generate: generateQueue,

  Scene,
  legend: [{ cls: "s-active", label: "just offered" }, { cls: "s-visited", label: "slot touched" }, { cls: "s-found", label: "peeked" }, { cls: "s-default", label: "waiting" }],
  metrics: ({ state: s }) => [
    { label: "Size", value: s.size },
    { label: "Head", value: s.head },
    { label: "Next write", value: s.size < s.cap ? `data[${(s.head + s.size) % s.cap}]` : "full" },
    { label: "Free", value: s.cap - s.size }
  ],
  memory: ({ state: s }): MemoryView => ({
    title: "In memory: int[] data",
    note: "The array is reused in a circle: after the last slot, the next write goes back to slot 0.",
    cells: s.arr.map((v, i) => {
      const marks: string[] = [];
      if (s.size > 0 && i === s.head) marks.push("head");
      if (s.size < s.cap && i === (s.head + s.size) % s.cap) marks.push("next");
      return { v, live: (i - s.head + s.cap) % s.cap < s.size, act: i === s.cell, tone: s.mode === "peek" ? "found" : s.mode === "out" ? "visited" : undefined, marks };
    })
  }),
  vars: ({ state: s }) => `head = ${s.head}   size = ${s.size}`,
  costs: [["offer", "O(1)"], ["poll", "O(1)"], ["peek", "O(1)"]],
  learn: [
    ["offer adds at the rear", (s) => s.kind === "add"],
    ["peek reads the front without removing it", (s) => s.kind === "peek"],
    ["poll serves the oldest item first", (s) => s.kind === "remove"],
    ["the rear index wraps around the array", (s) => !!s.state.wrapped],
    ["polling an empty queue returns null", (s) => s.kind === "empty" && s.op === "poll()"]
  ],

  code: { java, python, cpp }
});

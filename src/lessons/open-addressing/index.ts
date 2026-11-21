import { defineLesson, toneOf, type MemoryView } from "../../engine/types";
import { parseOps, type Op } from "../parseOps";
import Scene from "./Scene";
import { SLOTS, TOMB, generateOa, type OaState } from "./generate";
import java from "./code/Main.java?raw";
import python from "./code/main.py?raw";
import cpp from "./code/main.cpp?raw";

export default defineLesson<Op[], OaState>({
  id: "open-addressing",
  title: "Open addressing",
  subtitle: "Linear probing in one array, with tombstones so removals do not break lookups.",
  minutes: 7,
  level: "intermediate",
  section: "hashing",

  inputLabel: "Operations",
  inputHint: `add N, contains N, remove N. A key starts at slot N % ${SLOTS}.`,
  defaultText: "add 10, add 3, add 17, add 24, remove 17, contains 24, add 31",
  presets: [
    { label: "Wrap around", text: "add 6, add 13, add 20, contains 27" },
    { label: "Fill it up", text: "add 1, add 2, add 3, add 4, add 5, add 6, add 7, add 8" },
    { label: "Duplicate add", text: "add 9, add 16, add 9, contains 2" }
  ],
  parse: (text) => parseOps(text, ["add", "contains", "remove"], [], { insert: "add", put: "add", has: "contains", find: "contains", delete: "remove", del: "remove" }),
  generate: generateOa,

  Scene,
  legend: [{ cls: "s-compare", label: "probing" }, { cls: "s-found", label: "match" }, { cls: "s-active", label: "written" }, { cls: "s-stale", label: "tombstone" }],
  metrics: ({ state: s }) => [
    { label: "Size", value: s.size },
    { label: "Home", value: s.home ?? "-" },
    { label: "Probes", value: s.probes },
    { label: "Load", value: (s.size / SLOTS).toFixed(2) }
  ],
  memory: ({ state: s }): MemoryView => ({
    title: "In memory: int[] slots",
    note: "Keys sit directly in the array. -1 marks empty, -2 marks a tombstone.",
    cells: s.slots.map((v, i) => ({
      v: v === null ? -1 : v === TOMB ? -2 : v, live: v !== null && v !== TOMB, act: s.mark ? i === s.mark.at : i === s.probe, tone: s.mark ? toneOf(s.mark.state) : "compare", marks: i === s.home ? ["home"] : []
    }))
  }),
  vars: ({ state: s }) => `size = ${s.size}` + (s.probe !== null ? `   i = ${s.probe}` : ""),
  costs: [["add", "O(1) avg"], ["contains", "O(1) avg"], ["remove", "O(1) avg"], ["worst case", "O(n)"]],
  learn: [
    ["key % 7 picks the home slot", (s) => s.anchors.includes("hash")],
    ["a collision probes the next slot", (s) => s.anchors.includes("add.next")],
    ["remove leaves a tombstone, not a hole", (s) => s.anchors.includes("remove.hit")],
    ["searches walk past tombstones", (s) => s.anchors.includes("contains.next") && s.state.probe !== null && s.state.slots[s.state.probe] === TOMB],
    ["add reuses the first tombstone", (s) => !!s.state.reused],
    ["a full table rejects new keys", (s) => s.retNote === "table is full"]
  ],

  code: { java, python, cpp }
});

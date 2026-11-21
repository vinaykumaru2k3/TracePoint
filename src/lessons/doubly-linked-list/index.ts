import { defineLesson, type MemoryView } from "../../engine/types";
import { parseOps, type Op } from "../parseOps";
import Scene from "./Scene";
import { DLL_MAX, generateDll, type DllState } from "./generate";
import java from "./code/Main.java?raw";
import python from "./code/main.py?raw";
import cpp from "./code/main.cpp?raw";

const ALIASES: Record<string, string> = {
  add_first: "addfirst", pushfront: "addfirst", appendleft: "addfirst",
  add_last: "addlast", pushback: "addlast", append: "addlast",
  remove_first: "removefirst", popfront: "removefirst", popleft: "removefirst",
  remove_last: "removelast", popback: "removelast", pop: "removelast"
};

export default defineLesson<Op[], DllState>({
  id: "doubly-linked-list",
  title: "Doubly linked list",
  subtitle: "Every node points both ways, so both ends add and remove in O(1).",
  minutes: 6,
  level: "beginner",
  section: "linear",

  inputLabel: "Operations",
  inputHint: `addfirst N, addlast N, removefirst, removelast. Up to ${DLL_MAX} adds.`,
  defaultText: "addlast 5, addlast 8, addfirst 3, removelast, removefirst, addfirst 1",
  presets: [
    { label: "Build from both ends", text: "addfirst 2, addlast 4, addfirst 1, addlast 6" },
    { label: "Empty it out", text: "addlast 7, addlast 9, removefirst, removelast, removelast" },
    { label: "Use it as a queue", text: "addlast 1, addlast 2, removefirst, addlast 3, removefirst" }
  ],
  parse: (text) => {
    const r = parseOps(text, ["addfirst", "addlast"], ["removefirst", "removelast"], ALIASES);
    if (r.ok && r.input.filter((o) => o.name.startsWith("add")).length > DLL_MAX)
      return { ok: false, error: `Keep it to ${DLL_MAX} adds so every node fits on the stage.` };
    return r;
  },
  generate: generateDll,

  Scene,
  legend: [{ cls: "s-active", label: "new node" }, { cls: "s-stale", label: "leaving" }, { cls: "s-default", label: "in the list" }],
  metrics: ({ state: s }) => [
    { label: "Length", value: s.nodes.filter((n) => !n.lift).length },
    { label: "Head", value: s.nodes.find((n) => n.id === s.head)?.v ?? "null" },
    { label: "Tail", value: s.nodes.find((n) => n.id === s.tail)?.v ?? "null" },
    { label: "Links", value: s.nodes.filter((n) => !n.lift).length * 2 }
  ],
  memory: ({ state: s }): MemoryView => ({
    title: "In memory: Node objects on the heap",
    note: "Each node stores prev, value and next. A node is reachable while something still points at it.",
    cells: [...s.nodes].sort((a, b) => a.id - b.id).map((n) => {
      const marks: string[] = [];
      if (n.id === s.head) marks.push("head");
      if (n.id === s.tail) marks.push("tail");
      const at = (id: number | null) => (id === null ? "null" : `@${id}`);
      return {
        v: `${at(n.prev)}←${n.v}→${at(n.next)}`, tag: `@${n.id}`,
        live: n.id !== s.gone, act: n.state === "active" || n.state === "stale", marks
      };
    })
  }),
  vars: ({ state: s }) => {
    const v = (id: number | null) => (id === null ? "null" : `@${id}`);
    return `head = ${v(s.head)}   tail = ${v(s.tail)}`;
  },
  costs: [["addFirst", "O(1)"], ["addLast", "O(1)"], ["removeFirst", "O(1)"], ["removeLast", "O(1)"]],
  learn: [
    ["a new node needs two links: its own and its neighbour's", (s) => s.anchors.includes("addFirst.back") || s.anchors.includes("addLast.back")],
    ["removeLast uses prev instead of walking from head", (s) => s.anchors.includes("removeLast.move")],
    ["removeFirst clears the new head's prev", (s) => s.anchors.includes("removeFirst.cut") && s.state.nodes.some((n) => !n.lift)],
    ["removing the only node empties both ends", (s) => s.kind === "remove" && s.state.head === null],
    ["removing from an empty list throws", (s) => s.kind === "empty"]
  ],

  code: { java, python, cpp }
});

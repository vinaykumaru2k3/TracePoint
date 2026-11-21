import { defineLesson, toneOf, type MemoryView } from "../../engine/types";
import { parseOps, type Op } from "../parseOps";
import Scene from "./Scene";
import { SLL_MAX, generateSll, type SllState } from "./generate";
import java from "./code/Main.java?raw";
import python from "./code/main.py?raw";
import cpp from "./code/main.cpp?raw";
import theory from "./theory";

const ALIASES: Record<string, string> = {
  add_first: "addfirst", push: "addfirst", prepend: "addfirst",
  add_last: "addlast", add: "addlast", append: "addlast",
  find: "contains", search: "contains", remove: "delete", del: "delete"
};

export default defineLesson<Op[], SllState>({
  id: "singly-linked-list",
  title: "Singly linked list",
  subtitle: "Add at both ends, search hop by hop, and unlink a node with one pointer write.",
  minutes: 7,
  level: "beginner",
  section: "linear",

  inputLabel: "Operations",
  inputHint: `addfirst N, addlast N, contains N, delete N. Up to ${SLL_MAX} adds.`,
  defaultText: "addlast 4, addlast 9, addfirst 2, addlast 7, contains 9, delete 9, delete 2, contains 5",
  presets: [
    { label: "Delete the head", text: "addlast 3, addlast 8, delete 3, delete 8, addfirst 1" },
    { label: "Value not there", text: "addfirst 5, addfirst 6, contains 1, delete 4" },
    { label: "Delete the tail", text: "addlast 1, addlast 2, addlast 3, delete 3, addlast 4" }
  ],
  parse: (text) => {
    const r = parseOps(text, ["addfirst", "addlast", "contains", "delete"], [], ALIASES);
    if (r.ok && r.input.filter((o) => o.name.startsWith("add")).length > SLL_MAX)
      return { ok: false, error: `Keep it to ${SLL_MAX} adds so every node fits on the stage.` };
    return r;
  },
  generate: generateSll,

  Scene,
  legend: [{ cls: "s-active", label: "new node" }, { cls: "s-compare", label: "cur" }, { cls: "s-found", label: "match" }, { cls: "s-stale", label: "unlinked" }],
  metrics: ({ state: s }) => [
    { label: "Length", value: s.nodes.filter((n) => !n.lift).length },
    { label: "Head", value: s.nodes.find((n) => n.id === s.head)?.v ?? "null" },
    { label: "Tail", value: s.nodes.find((n) => n.id === s.tail)?.v ?? "null" },
    { label: "cur", value: s.nodes.find((n) => n.id === s.cur)?.v ?? "-" }
  ],
  memory: ({ state: s }): MemoryView => ({
    title: "In memory: Node objects on the heap",
    note: "Nodes live wherever they were allocated. Order comes only from next pointers, shown as @address.",
    cells: [...s.nodes].sort((a, b) => a.id - b.id).map((n) => {
      const marks: string[] = [];
      if (n.id === s.head) marks.push("head");
      if (n.id === s.tail) marks.push("tail");
      return {
        v: `${n.v}→${n.next === null ? "null" : `@${n.next}`}`, tag: `@${n.id}`,
        live: n.id !== s.gone, act: n.id === s.cur || n.state === "active", tone: toneOf(n.state), marks
      };
    })
  }),
  vars: ({ state: s }) => {
    const v = (id: number | null) => (id === null ? "null" : `@${id}`);
    return `head = ${v(s.head)}   tail = ${v(s.tail)}` + (s.cur !== null ? `   cur = ${v(s.cur)}` : "");
  },
  costs: [["addFirst", "O(1)"], ["addLast", "O(1)"], ["contains", "O(n)"], ["delete", "O(n)"]],
  learn: [
    ["addFirst links the new node before moving head", (s) => s.anchors.includes("addFirst.link")],
    ["addLast is O(1) thanks to the tail pointer", (s) => s.anchors.includes("addLast.tail")],
    ["contains walks one node per step", (s) => s.anchors.includes("contains.walk") && s.kind === "check"],
    ["delete rewires prev.next around the node", (s) => s.anchors.includes("delete.unlink")],
    ["deleting the head just moves head", (s) => s.anchors.includes("delete.head")]
  ],

  theory,

  code: { java, python, cpp }
});

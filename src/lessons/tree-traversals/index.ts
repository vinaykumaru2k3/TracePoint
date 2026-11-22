import { defineLesson, type MemoryView } from "../../engine/types";
import type { NumsInput } from "../parseOps";
import TreeScene from "../TreeScene";
import { parseKeys } from "../treekit";
import { TT_MAX, generateTraversals, type TravState } from "./generate";
import java from "./code/Main.java?raw";
import python from "./code/main.py?raw";
import cpp from "./code/main.cpp?raw";
import theory from "./theory";

const ORDER = { pre: "pre-order", in: "in-order", post: "post-order", level: "level order" } as const;

export default defineLesson<NumsInput, TravState>({
  id: "tree-traversals",
  title: "Tree traversals",
  subtitle: "Visit every node of a binary tree in pre-order, in-order, post-order and level order.",
  minutes: 8,
  level: "beginner",
  section: "trees",

  inputLabel: "Keys",
  inputHint: `1 to ${TT_MAX} distinct numbers from 0 to 99, inserted into a search tree to fix its shape.`,
  defaultText: "4 2 6 1 3 5 7",
  presets: [
    { label: "Lopsided", text: "5 3 8 1 4 2" },
    { label: "Sorted input", text: "1 2 3 4" },
    { label: "One node", text: "7" }
  ],
  parse: (text) => parseKeys(text, TT_MAX),
  generate: generateTraversals,

  Scene: TreeScene,
  legend: [{ cls: "s-active", label: "visiting" }, { cls: "s-visited", label: "on the call stack" }, { cls: "s-compare", label: "in the queue" }, { cls: "s-found", label: "written" }],
  metrics: ({ state: s }) => [
    { label: "Order", value: s.order ? ORDER[s.order] : "-" },
    { label: "Written", value: `${s.out.length}/${s.nodes.length}` },
    s.order === "level" ? { label: "Queue", value: s.queue.length } : { label: "Stack depth", value: s.stack.length }
  ],
  memory: ({ state: s, kind }): MemoryView => ({
    title: "In memory: List<Integer> out",
    note: s.order === "level" ? "Level order also keeps a queue, at most one level wide." : "The recursion keeps one frame per node on the path, so the stack is as deep as the tree.",
    cells: s.out.map((v, k) => ({ v, live: true, act: kind === "add" && k === s.out.length - 1, marks: [] }))
  }),
  vars: ({ state: s }) => `out = [${s.out.join(", ")}]` + (s.order === "level" ? `   queue = [${s.queue.join(", ")}]` : s.stack.length ? `   stack = ${s.stack.join(" → ")}` : ""),
  costs: [["time, every order", "O(n)"], ["stack, recursive", "O(h)"], ["queue, level order", "O(w)"]],
  learn: [
    ["pre-order writes a node before its children", (s) => s.anchors.includes("pre.visit")],
    ["in-order of a search tree comes out sorted", (s) => s.kind === "found" && s.state.order === "in"],
    ["post-order writes a node after both children", (s) => s.anchors.includes("post.visit")],
    ["level order uses a queue, not recursion", (s) => s.anchors.includes("lvl.push")]
  ],

  theory,

  code: { java, python, cpp }
});

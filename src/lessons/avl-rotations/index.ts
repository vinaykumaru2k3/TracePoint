import { defineLesson } from "../../engine/types";
import type { NumsInput } from "../parseOps";
import TreeScene from "../TreeScene";
import { nodeMemory } from "../treekit";
import { AVL_MAX, generateAvl, parseAvl, type AvlState } from "./generate";
import java from "./code/Main.java?raw";
import python from "./code/main.py?raw";
import cpp from "./code/main.cpp?raw";
import theory from "./theory";

export default defineLesson<NumsInput, AvlState>({
  id: "avl-rotations",
  title: "AVL rotations",
  subtitle: "Keep a search tree balanced by rotating at the first node whose subtrees differ in height by 2.",
  minutes: 10,
  level: "advanced",
  section: "trees",

  inputLabel: "Keys to insert",
  inputHint: `1 to ${AVL_MAX} numbers from 0 to 99, inserted in order.`,
  defaultText: "10 20 30 25 28 5 4",
  presets: [
    { label: "Right-left case", text: "10 30 20" },
    { label: "Sorted input", text: "1 2 3 4 5 6 7" },
    { label: "Duplicate key", text: "5 3 8 3" }
  ],
  parse: parseAvl,
  generate: generateAvl,

  Scene: TreeScene,
  legend: [{ cls: "s-active", label: "current or moving up" }, { cls: "s-visited", label: "path" }, { cls: "s-compare", label: "out of balance or moving down" }, { cls: "s-found", label: "new leaf" }],
  metrics: ({ state: s }) => [
    { label: "Keys", value: s.size },
    { label: "Height", value: s.height },
    { label: "Rotations", value: s.rotations },
    { label: "Cases", value: s.cases.length ? s.cases.join(" ") : "-" }
  ],
  memory: ({ state: s }) => nodeMemory("In memory: Node objects", s, "Each node also stores its height, so its balance factor costs O(1) to check.", (n) => n.tag ?? ""),
  vars: ({ state: s }) => `${s.op ?? "ready"}   height = ${s.height}`,
  costs: [["insert", "O(log n)"], ["search", "O(log n)"], ["one rotation", "O(1)"]],
  learn: [
    ["each node checks its balance factor on the way up", (s) => s.anchors.includes("fix.bf")],
    ["a straight line needs one rotation", (s) => s.anchors.includes("case.ll") || s.anchors.includes("case.rr")],
    ["a zig-zag needs two rotations", (s) => s.anchors.includes("case.lr") || s.anchors.includes("case.rl")],
    ["a duplicate key is ignored", (s) => s.anchors.includes("ins.dup")]
  ],

  theory,

  code: { java, python, cpp }
});

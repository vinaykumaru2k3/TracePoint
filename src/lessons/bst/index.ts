import { defineLesson } from "../../engine/types";
import type { Op } from "../parseOps";
import TreeScene from "../TreeScene";
import { nodeMemory } from "../treekit";
import { BST_MAX, generateBst, parseBst, type BstState } from "./generate";
import java from "./code/Main.java?raw";
import python from "./code/main.py?raw";
import cpp from "./code/main.cpp?raw";
import theory from "./theory";

export default defineLesson<Op[], BstState>({
  id: "bst",
  title: "Binary search tree",
  subtitle: "Insert, search and delete keys in a tree where smaller keys go left and larger keys go right.",
  minutes: 9,
  level: "intermediate",
  section: "trees",

  inputLabel: "Operations",
  inputHint: `insert N, search N, delete N. Up to 16 operations and ${BST_MAX} inserts.`,
  defaultText: "insert 50, insert 30, insert 70, insert 20, insert 40, insert 60, insert 80, search 60, search 65, delete 20, delete 30, delete 50",
  presets: [
    { label: "Sorted input", text: "insert 1, insert 2, insert 3, insert 4, insert 5, insert 6, search 6" },
    { label: "Duplicate key", text: "insert 5, insert 3, insert 5, search 3" },
    { label: "Delete the root", text: "insert 8, insert 4, insert 12, insert 10, delete 8, search 10" }
  ],
  parse: parseBst,
  generate: generateBst,

  Scene: TreeScene,
  legend: [{ cls: "s-active", label: "current node" }, { cls: "s-visited", label: "path so far" }, { cls: "s-compare", label: "equal or moving" }, { cls: "s-found", label: "found or placed" }, { cls: "s-stale", label: "removed" }],
  metrics: ({ state: s }) => [
    { label: "Op", value: s.op ?? "-" },
    { label: "Keys", value: s.size },
    { label: "Height", value: s.height }
  ],
  memory: ({ state: s }) => nodeMemory("In memory: Node objects", s, "Each node holds a key and two links. A null link is an empty spot where a new key can attach."),
  vars: ({ state: s }) => {
    const cur = s.ptrs.find((p) => p.label !== "root");
    const n = cur ? s.nodes.find((x) => x.id === cur.node) : undefined;
    return `${s.op ?? "ready"}${n ? `   ${cur!.label} = ${n.v}` : ""}`;
  },
  costs: [["search, insert, delete", "O(h)"], ["balanced tree", "O(log n)"], ["sorted input, a chain", "O(n)"]],
  learn: [
    ["insert walks down one compare per level", (s) => s.anchors.includes("ins.cmp")],
    ["a search miss ends at a missing child", (s) => s.anchors.includes("find.miss")],
    ["a duplicate insert changes nothing", (s) => s.anchors.includes("ins.dup")],
    ["two children: copy the successor, then remove it", (s) => s.anchors.includes("del.copy")]
  ],

  theory,

  code: { java, python, cpp }
});

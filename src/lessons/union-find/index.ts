import { defineLesson, toneOf } from "../../engine/types";
import GraphScene from "../GraphScene";
import { generateUf, parseUf, UF_OPS, type UfInput, type UfState } from "./generate";
import java from "./code/Main.java?raw";
import python from "./code/main.py?raw";
import cpp from "./code/main.cpp?raw";
import theory from "./theory";

export default defineLesson<UfInput, UfState>({
  id: "union-find",
  title: "Union-find",
  subtitle: "Disjoint sets: join groups and ask who belongs together, in close to one step each.",
  minutes: 8,
  level: "intermediate",
  section: "graphs",

  inputLabel: "Operations",
  inputHint: `Up to ${UF_OPS} operations: "union A B", "find A" or "connected A B", on nodes A to H.`,
  defaultText: "union A B, union C D, union B D, union E F, find D, connected A D, connected A F",
  presets: [
    { label: "Join twice", text: "union A B, union B C, union A C, connected A C, connected A D" },
    { label: "Build a chain", text: "union A B, union C D, union A C, union E F, union G H, union E G, union A E, find H" },
    { label: "Small under big", text: "union A B, union C A, connected A G, find G" }
  ],
  parse: parseUf,
  generate: generateUf,

  Scene: GraphScene,
  legend: [{ cls: "s-active", label: "current node" }, { cls: "s-visited", label: "on the walk" }, { cls: "s-found", label: "root" }],
  metrics: ({ state: s }) => [
    { label: "Groups", value: Object.entries(s.parent).filter(([x, p]) => x === p).length },
    { label: "Tallest", value: Math.max(0, ...s.nodes.map((n) => n.depth)) },
    { label: "Links followed", value: s.hops }
  ],
  memory: ({ state: s }) => ({
    title: "In memory: int[] parent, int[] size",
    note: "The whole structure is two arrays. A root is a node whose parent is itself, and only roots keep a meaningful size.",
    cells: s.nodes.map((n) => ({
      v: s.parent[n.v as string], tag: `parent[${n.v}]`, live: true,
      act: n.state === "active" || toneOf(n.state) !== undefined, tone: toneOf(n.state),
      marks: s.ptrs.filter((p) => p.node === n.id).map((p) => p.label)
    }))
  }),
  vars: ({ state: s }) => `parent = ${s.nodes.map((n) => `${n.v}:${s.parent[n.v as string]}`).join(" ")}   size = ${s.nodes.filter((n) => s.parent[n.v as string] === n.v).map((n) => `${n.v}:${s.size[n.v as string]}`).join(" ")}`,
  costs: [["find, union, connected", "O(α(n))"], ["without the two tricks", "O(n)"], ["parent and size", "O(n)"]],
  learn: [
    ["find climbs parent links to the root", (s) => s.anchors.includes("find.hop")],
    ["path compression points the walk at the root", (s) => s.anchors.includes("find.link")],
    ["union hangs the smaller tree under the larger root", (s) => s.anchors.includes("union.link")],
    ["union of two nodes in one group changes nothing", (s) => s.anchors.includes("union.same")],
    ["connected compares two roots", (s) => s.anchors.includes("conn.ret")]
  ],

  theory,

  code: { java, python, cpp }
});

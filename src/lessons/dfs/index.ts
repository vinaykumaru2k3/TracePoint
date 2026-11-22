import { defineLesson } from "../../engine/types";
import GraphScene from "../GraphScene";
import { G_EDGES, G_NODES, adjMemory, parseGraph, type GraphInput } from "../graphkit";
import { generateDfs, type DfsState } from "./generate";
import java from "./code/Main.java?raw";
import python from "./code/main.py?raw";
import cpp from "./code/main.cpp?raw";
import theory from "./theory";

export default defineLesson<GraphInput, DfsState>({
  id: "dfs",
  title: "DFS",
  subtitle: "Depth-first search: follow one path as deep as it goes, then back up and try the next.",
  minutes: 7,
  level: "intermediate",
  section: "graphs",

  inputLabel: "Edges",
  inputHint: `Up to ${G_EDGES} undirected edges like "A-B" between up to ${G_NODES} nodes A to H. Add "start C" to pick the start; otherwise it is the first letter.`,
  defaultText: "A-B, A-C, B-D, C-D, C-E, D-F, E-F",
  presets: [
    { label: "Two islands", text: "A-B, B-C, A-C, D-E" },
    { label: "A tree", text: "A-B, A-C, B-D, B-E, C-F" },
    { label: "One big cycle", text: "A-B, B-C, C-D, D-E, E-A" }
  ],
  parse: (text) => parseGraph(text),
  generate: generateDfs,

  Scene: GraphScene,
  legend: [{ cls: "s-active", label: "current call" }, { cls: "s-visited", label: "on the stack" }, { cls: "s-found", label: "finished" }],
  metrics: ({ state: s }) => [
    { label: "Op", value: s.op ?? "-" },
    { label: "Visited", value: `${s.order.length}/${s.nodes.length}` },
    { label: "Stack depth", value: s.stack.length }
  ],
  memory: ({ state: s }) => adjMemory("In memory: List<List<Integer>> adj", s, "DFS reads each list once. It also keeps seen[], and the call stack holds the current path."),
  vars: ({ state: s }) => `order = [${s.order.join(", ")}]   stack = ${s.stack.length ? s.stack.join(" → ") : "empty"}`,
  costs: [["time", "O(n + e)"], ["seen and order", "O(n)"], ["call stack, worst case", "O(n)"]],
  learn: [
    ["DFS dives into a new neighbour at once", (s) => s.anchors.includes("dfs.recurse")],
    ["the seen mark stops cycles", (s) => s.anchors.includes("dfs.seen")],
    ["a finished node's frame leaves the stack", (s) => s.anchors.includes("dfs.done")],
    ["only nodes with a path from the start are visited", (s) => s.anchors.includes("dfs.order") && s.state.order.length < s.state.nodes.length]
  ],

  theory,

  code: { java, python, cpp }
});

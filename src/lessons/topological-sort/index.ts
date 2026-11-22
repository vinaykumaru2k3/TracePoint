import { defineLesson } from "../../engine/types";
import GraphScene from "../GraphScene";
import { G_EDGES, G_NODES, adjMemory, parseGraph, type GraphInput } from "../graphkit";
import { generateTopo, type TopoState } from "./generate";
import java from "./code/Main.java?raw";
import python from "./code/main.py?raw";
import cpp from "./code/main.cpp?raw";
import theory from "./theory";

export default defineLesson<GraphInput, TopoState>({
  id: "topological-sort",
  title: "Topological sort",
  subtitle: "Kahn's algorithm: order tasks so each one comes after everything it depends on.",
  minutes: 7,
  level: "intermediate",
  section: "graphs",

  inputLabel: "Arrows",
  inputHint: `Up to ${G_EDGES} arrows like "A-B", meaning A must come before B, between up to ${G_NODES} nodes A to H.`,
  defaultText: "A-C, B-C, B-D, C-E, D-E, E-F",
  presets: [
    { label: "A cycle", text: "A-B, B-C, C-D, D-B, D-E" },
    { label: "Getting dressed", text: "A-C, B-C, C-D, B-E, E-D" },
    { label: "One long chain", text: "E-D, D-C, C-B, B-A" }
  ],
  parse: (text) => parseGraph(text, { directed: true }),
  generate: generateTopo,

  Scene: GraphScene,
  legend: [{ cls: "s-active", label: "being placed" }, { cls: "s-compare", label: "in the queue" }, { cls: "s-found", label: "placed" }, { cls: "s-swap", label: "stuck in a cycle" }],
  metrics: ({ state: s }) => [
    { label: "Placed", value: `${s.order.length}/${s.nodes.length}` },
    { label: "Queue", value: s.queue.length },
    { label: "Arrows left", value: s.edges.filter((e) => e.state !== "dim").length }
  ],
  memory: ({ state: s }) => adjMemory("In memory: List<List<Integer>> adj", s, "Each list holds the nodes this one points to. Kahn's algorithm also keeps indeg[] and a queue."),
  vars: ({ state: s }) => `queue = [${s.queue.join(", ")}]   indeg = ${s.nodes.map((n) => `${n.v}:${s.indeg[n.v as string]}`).join(" ")}`,
  costs: [["time", "O(n + e)"], ["indeg and queue", "O(n)"], ["detect a cycle", "O(n + e)"]],
  learn: [
    ["in-degree counts the arrows into a node", (s) => s.anchors.includes("topo.count")],
    ["a node with in-degree 0 can go next", (s) => s.anchors.includes("topo.init")],
    ["removing an arrow can free the node it points to", (s) => s.anchors.includes("topo.push")],
    ["a cycle leaves nodes that never reach 0", (s) => s.anchors.includes("topo.cycle")]
  ],

  theory,

  code: { java, python, cpp }
});

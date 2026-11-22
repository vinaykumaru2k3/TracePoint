import { defineLesson } from "../../engine/types";
import GraphScene from "../GraphScene";
import { G_EDGES, G_NODES, W_MAX, adjMemory, parseGraph, type GraphInput } from "../graphkit";
import { generateMst, type MstState } from "./generate";
import java from "./code/Main.java?raw";
import python from "./code/main.py?raw";
import cpp from "./code/main.cpp?raw";
import theory from "./theory";

export default defineLesson<GraphInput, MstState>({
  id: "kruskal-and-prim",
  title: "Kruskal and Prim",
  subtitle: "Two greedy ways to the minimum spanning tree: sort every edge, or grow from one node.",
  minutes: 10,
  level: "intermediate",
  section: "graphs",

  inputLabel: "Weighted edges",
  inputHint: `Up to ${G_EDGES} undirected edges like "A-B 4" with weights 0 to ${W_MAX}, between up to ${G_NODES} nodes A to H. Add "start C" to pick where Prim starts.`,
  defaultText: "A-B 4, A-C 1, B-C 2, B-D 5, C-D 8, C-E 9, D-E 3",
  presets: [
    { label: "Two pieces", text: "A-B 1, B-C 2, A-C 3, D-E 4" },
    { label: "A square", text: "A-B 1, B-C 2, C-D 3, D-A 4, A-C 5" },
    { label: "Prim from D", text: "A-B 2, B-C 3, C-D 1, D-A 6, B-D 4, start D" }
  ],
  parse: (text) => parseGraph(text, { weighted: true }),
  generate: generateMst,

  Scene: GraphScene,
  legend: [{ cls: "s-active", label: "edge being added" }, { cls: "s-visited", label: "in Prim's tree" }, { cls: "s-swap", label: "would close a loop" }, { cls: "s-stale", label: "skipped entry" }],
  metrics: ({ state: s }) => [
    { label: "Edges kept", value: `${s.kept.length}/${s.nodes.length - 1}` },
    { label: "Total", value: s.total },
    { label: "Pieces", value: s.op?.startsWith("kruskal") ? new Set(Object.values(s.root)).size : "-" }
  ],
  memory: ({ state: s }) => adjMemory("In memory: List<List<int[]>> adj", s, "Kruskal needs only the edge list and a union-find. Prim walks these lists with a heap of edges."),
  vars: ({ state: s }) => `kept = [${s.kept.join(", ")}]   total = ${s.total}`,
  costs: [["Kruskal", "O(e log e)"], ["Prim, binary heap", "O(e log n)"], ["the tree", "O(n)"]],
  learn: [
    ["Kruskal tries edges from cheapest to dearest", (s) => s.anchors.includes("kr.sort")],
    ["an edge inside one set would close a loop", (s) => s.anchors.includes("kr.skip")],
    ["Prim adds the cheapest edge leaving its tree", (s) => s.anchors.includes("pr.take")],
    ["a graph in pieces gives a forest, not a tree", (s) => s.anchors.includes("kr.done") && /forest/.test(s.ret ?? "")]
  ],

  theory,

  code: { java, python, cpp }
});

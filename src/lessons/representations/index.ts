import { defineLesson } from "../../engine/types";
import GraphScene from "../GraphScene";
import { G_EDGES, G_NODES, adjMemory, parseGraph } from "../graphkit";
import { generateRepresentations, type RepState } from "./generate";
import type { GraphInput } from "../graphkit";
import java from "./code/Main.java?raw";
import python from "./code/main.py?raw";
import cpp from "./code/main.cpp?raw";
import theory from "./theory";

export default defineLesson<GraphInput, RepState>({
  id: "representations",
  title: "Representations",
  subtitle: "Store a graph as an adjacency list or an adjacency matrix, and see what each one is fast at.",
  minutes: 6,
  level: "beginner",
  section: "graphs",

  inputLabel: "Edges",
  inputHint: `Up to ${G_EDGES} undirected edges like "A-B", between up to ${G_NODES} nodes named A to H. A lone letter adds a node with no edges.`,
  defaultText: "A-B, A-C, B-D, C-D, D-E",
  presets: [
    { label: "Sparse chain", text: "A-B, B-C, C-D, D-E, E-F" },
    { label: "Dense", text: "A-B, A-C, A-D, B-C, B-D, C-D" },
    { label: "A star", text: "A-B, A-C, A-D, A-E, A-F" }
  ],
  parse: (text) => parseGraph(text),
  generate: generateRepresentations,

  Scene: GraphScene,
  legend: [{ cls: "s-active", label: "being read or written" }, { cls: "s-visited", label: "list entry read" }, { cls: "s-found", label: "neighbour found" }, { cls: "s-compare", label: "the pair asked about" }],
  metrics: ({ state: s }) => [
    { label: "Op", value: s.op ?? "-" },
    { label: "Edges", value: s.edges.length },
    { label: "List entries", value: Object.values(s.lists).reduce((a, l) => a + l.length, 0) },
    { label: "Matrix cells", value: s.nodes.length ** 2 }
  ],
  memory: ({ state: s }) => adjMemory("In memory: List<List<Integer>> adj", s, "One list per node. An undirected edge appears in two lists. The matrix beside it would hold n × n cells."),
  vars: ({ state: s }) => {
    const r = s.strip;
    const busy = s.nodes.find((n) => n.state === "active");
    const list = busy ? `adj[${busy.v}] = [${s.lists[busy.v as string].join(", ")}]` : `nodes = ${s.nodes.length}   edges = ${s.edges.length}`;
    return r ? `${list}   ${r.name} = [${r.tiles.map((t) => t.v).join(" ")}]` : list;
  },
  costs: [["hasEdge, matrix", "O(1)"], ["hasEdge, list", "O(deg)"], ["neighbours, list", "O(deg)"], ["neighbours, matrix", "O(n)"], ["space, list", "O(n + e)"], ["space, matrix", "O(n²)"]],
  learn: [
    ["an undirected edge is stored at both ends", (s) => s.anchors.includes("add.vu")],
    ["a matrix answers one pair in one look", (s) => s.anchors.includes("has.mat")],
    ["a list walks the neighbours to find a pair", (s) => s.anchors.includes("has.step")],
    ["a matrix row must be read in full to list neighbours", (s) => s.anchors.includes("nbr.mat")]
  ],

  theory,

  code: { java, python, cpp }
});

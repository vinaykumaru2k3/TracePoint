import { defineLesson } from "../../engine/types";
import GraphScene from "../GraphScene";
import { G_EDGES, G_NODES, adjMemory, parseGraph, type GraphInput } from "../graphkit";
import { generateBfs, type BfsState } from "./generate";
import java from "./code/Main.java?raw";
import python from "./code/main.py?raw";
import cpp from "./code/main.cpp?raw";
import theory from "./theory";

export default defineLesson<GraphInput, BfsState>({
  id: "bfs",
  title: "BFS",
  subtitle: "Breadth-first search: visit a graph ring by ring and find the fewest edges to every node.",
  minutes: 7,
  level: "intermediate",
  section: "graphs",

  inputLabel: "Edges",
  inputHint: `Up to ${G_EDGES} undirected edges like "A-B" between up to ${G_NODES} nodes A to H. Add "start C" to pick the start; otherwise it is the first letter.`,
  defaultText: "A-B, A-C, B-D, C-D, C-E, D-F, E-F",
  presets: [
    { label: "Two islands", text: "A-B, B-C, A-C, D-E" },
    { label: "Long chain", text: "A-B, B-C, C-D, D-E, E-F" },
    { label: "Start in the middle", text: "A-B, B-C, C-D, D-E, start C" }
  ],
  parse: (text) => parseGraph(text),
  generate: generateBfs,

  Scene: GraphScene,
  legend: [{ cls: "s-active", label: "current node" }, { cls: "s-compare", label: "in the queue" }, { cls: "s-found", label: "just found" }, { cls: "s-visited", label: "done" }],
  metrics: ({ state: s }) => [
    { label: "Queue", value: s.queue.length },
    { label: "Seen", value: `${Object.values(s.dist).filter((d) => d >= 0).length}/${s.nodes.length}` },
    { label: "Deepest", value: Math.max(...Object.values(s.dist)) }
  ],
  memory: ({ state: s }) => adjMemory("In memory: List<List<Integer>> adj", s, "BFS reads each list once, when its node leaves the queue. It also keeps dist[] and the queue."),
  vars: ({ state: s }) => `queue = [${s.queue.join(", ")}]   dist = ${s.nodes.map((n) => `${n.v}:${s.dist[n.v as string] >= 0 ? s.dist[n.v as string] : "-"}`).join(" ")}`,
  costs: [["time", "O(n + e)"], ["queue and dist", "O(n)"], ["one shortest path, unweighted", "O(n + e)"]],
  learn: [
    ["the queue hands out the oldest node first", (s) => s.anchors.includes("bfs.poll")],
    ["a new node is one edge further than the node that found it", (s) => s.anchors.includes("bfs.new")],
    ["a node already seen is skipped", (s) => s.anchors.includes("bfs.seen")],
    ["a node with no path from the start is never reached", (s) => s.anchors.includes("bfs.done") && /∞/.test(s.ret ?? "")]
  ],

  theory,

  code: { java, python, cpp }
});

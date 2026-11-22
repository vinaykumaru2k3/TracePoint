import { defineLesson } from "../../engine/types";
import GraphScene from "../GraphScene";
import { G_EDGES, G_NODES, W_MAX, adjMemory, distText, parseGraph, type GraphInput } from "../graphkit";
import { generateDijkstra, type DijkstraState } from "./generate";
import java from "./code/Main.java?raw";
import python from "./code/main.py?raw";
import cpp from "./code/main.cpp?raw";
import theory from "./theory";

export default defineLesson<GraphInput, DijkstraState>({
  id: "dijkstra",
  title: "Dijkstra",
  subtitle: "Cheapest routes from one node, settling the closest node first with a priority queue.",
  minutes: 9,
  level: "intermediate",
  section: "graphs",

  inputLabel: "Weighted edges",
  inputHint: `Up to ${G_EDGES} undirected edges like "A-B 4" with weights 0 to ${W_MAX}, between up to ${G_NODES} nodes A to H. Add "start C" to pick the start.`,
  defaultText: "A-B 4, A-C 1, C-B 2, B-D 5, C-D 8, D-E 3, C-E 9",
  presets: [
    { label: "An island", text: "A-B 2, B-C 3, A-C 9, D-E 1" },
    { label: "Detour wins", text: "A-D 10, A-B 1, B-C 1, C-D 1" },
    { label: "Start in the middle", text: "A-B 3, B-C 1, C-D 4, D-E 2, B-E 7, start C" }
  ],
  parse: (text) => parseGraph(text, { weighted: true }),
  generate: generateDijkstra,

  Scene: GraphScene,
  legend: [{ cls: "s-active", label: "being settled" }, { cls: "s-compare", label: "route known" }, { cls: "s-found", label: "just improved" }, { cls: "s-visited", label: "settled" }, { cls: "s-stale", label: "out-of-date entry" }],
  metrics: ({ state: s }) => [
    { label: "Queue", value: s.pq.length },
    { label: "Reached", value: `${Object.values(s.dist).filter(Number.isFinite).length}/${s.nodes.length}` },
    { label: "Farthest", value: distText(Math.max(0, ...Object.values(s.dist).filter(Number.isFinite))) }
  ],
  memory: ({ state: s }) => adjMemory("In memory: List<List<int[]>> adj", s, "Each entry is a neighbour and the edge cost, as B:4. Dijkstra also keeps dist[] and the heap."),
  vars: ({ state: s }) => `pq = [${s.pq.map(([x, d]) => `${x}:${d}`).join(", ")}]   dist = ${s.nodes.map((n) => `${n.v}:${distText(s.dist[n.v as string])}`).join(" ")}`,
  costs: [["time, binary heap", "O(e log n)"], ["heap entries, lazy", "O(e)"], ["dist", "O(n)"]],
  learn: [
    ["the closest entry in the queue is settled for good", (s) => s.anchors.includes("dij.pop") && !s.anchors.includes("dij.stale")],
    ["relaxing an edge can lower a distance", (s) => s.anchors.includes("dij.push")],
    ["an out-of-date entry is skipped", (s) => s.anchors.includes("dij.stale")],
    ["a node with no route stays at ∞", (s) => s.anchors.includes("dij.done") && /∞/.test(s.ret ?? "")]
  ],

  theory,

  code: { java, python, cpp }
});

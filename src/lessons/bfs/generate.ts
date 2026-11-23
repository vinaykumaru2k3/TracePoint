import type { Step } from "../../engine/types";
import type { BlockState } from "../../iso/IsoBlock";
import type { TPointer } from "../../iso/TreeNodes";
import { adjacency, ekey, graphView, idOf, ringLayout, type GraphInput, type GraphState } from "../graphkit";

export interface BfsState extends GraphState {
  op: string | null;
  /** Distance from the start in edges; -1 until the node is seen. */
  dist: Record<string, number>;
  queue: string[];
}

export const distLine = (nodes: string[], dist: Record<string, number>) =>
  nodes.map((x) => `${x}${dist[x] >= 0 ? dist[x] : "∞"}`).join(" ");

/** Breadth-first search from the start: a queue hands out nodes in the order they were first seen. */
export function generateBfs(g: GraphInput): Step<BfsState>[] {
  const { pos, frame } = ringLayout(g.nodes);
  const adj = adjacency(g);
  const s = g.start;
  const dist: Record<string, number> = Object.fromEntries(g.nodes.map((x) => [x, -1]));
  const done = new Set<string>();
  const tree: Record<string, "tree"> = {};
  let queue: string[] = [];
  const op = `bfs(${s})`;
  const steps: Step<BfsState>[] = [];

  const snap = (st: Omit<Step<BfsState>, "state" | "op">, v: { cur?: string; look?: string; lookTone?: BlockState; ptrs?: TPointer[] } = {}) => {
    const states: Partial<Record<string, BlockState>> = {};
    for (const x of g.nodes) if (done.has(x)) states[x] = "visited"; else if (queue.includes(x)) states[x] = "compare";
    if (v.look) states[v.look] = v.lookTone ?? states[v.look];
    if (v.cur) states[v.cur] = "active";
    const edges: Record<string, "tree" | "active"> = { ...tree };
    if (v.cur && v.look) edges[ekey(v.cur, v.look, false)] = "active";
    const tags = Object.fromEntries(g.nodes.filter((x) => dist[x] >= 0).map((x) => [x, `d=${dist[x]}`]));
    const view = graphView(g, pos, { states, edges, tags });
    steps.push({
      ...st, op: st.kind === "problem" || st.kind === "recap" ? null : op,
      state: {
        ...view, ptrs: [{ node: idOf(s), label: "s" }, ...(v.ptrs ?? [])], frame,
        strip: st.kind === "problem" ? undefined : {
          name: "queue", slots: g.nodes.length,
          tiles: queue.map((x, k) => ({ v: x, state: k === 0 ? "active" : "compare" })),
          ptrs: queue.length ? [{ at: 0, label: "head" }] : []
        },
        op: st.kind === "problem" || st.kind === "recap" ? null : op,
        dist: { ...dist }, queue: queue.slice()
      }
    });
  };

  snap({
    kind: "problem", anchors: [], notes: {},
    title: "Spread out from one node, ring by ring",
    idea: "A queue serves nodes in the order they were found. So every node one edge away is handled before any node two edges away.",
    text: `Breadth-first search starts at ${s} and visits its neighbours first, then their neighbours, and so on. It finds the fewest edges from ${s} to every node it can reach. The queue under the graph holds the nodes waiting their turn.`
  });

  dist[s] = 0;
  queue = [s];
  snap({
    kind: "add", anchors: ["bfs.sig", "bfs.init"], notes: { "bfs.init": `dist[${s}] = 0, queue = [${s}]` },
    title: `Start at ${s}`, short: `start ${s}`,
    idea: "The start is 0 edges from itself. Every other distance stays unknown until the search reaches it.",
    text: `${s} gets distance 0 and goes into the queue. Every other node is unseen, with no distance yet.`
  }, { cur: s });

  while (queue.length) {
    const u = queue.shift()!;
    snap({
      kind: "remove", anchors: ["bfs.poll"], notes: { "bfs.poll": `u = ${u}, d = ${dist[u]}` },
      title: `Take ${u} from the front`, short: `take ${u}`,
      idea: "The front of the queue is always the oldest node found, so nodes come out in order of distance.",
      text: `${u} leaves the front of the queue. It is ${dist[u]} edge${dist[u] === 1 ? "" : "s"} from ${s}. Now each of its neighbours is checked.`
    }, { cur: u, ptrs: [{ node: idOf(u), label: "u" }] });
    for (const { to: x } of adj[u]) {
      if (dist[x] !== -1) {
        snap({
          kind: "check", anchors: ["bfs.seen"], notes: { "bfs.seen": `${x} already has d = ${dist[x]}` },
          title: `${x} was already seen`, short: `${x} seen`,
          idea: "A node is seen once. The first time is along a shortest path, so a later route can never be shorter.",
          text: `${x} already has distance ${dist[x]}, so it is skipped. It is ${done.has(x) ? "done" : "still in the queue"}.`
        }, { cur: u, look: x, ptrs: [{ node: idOf(u), label: "u" }, { node: idOf(x), label: "x" }] });
        continue;
      }
      dist[x] = dist[u] + 1;
      queue.push(x);
      tree[ekey(u, x, false)] = "tree";
      snap({
        kind: "add", anchors: ["bfs.new", "bfs.push"], notes: { "bfs.new": `dist[${x}] = ${dist[u]} + 1 = ${dist[x]}`, "bfs.push": `queue = [${queue.join(", ")}]` },
        title: `${x} is new: distance ${dist[x]}`, short: `dist ${x} = ${dist[x]}`,
        idea: "A new node is one edge further than the node that found it. It joins the back of the queue.",
        text: `${x} has not been seen, so its distance is ${dist[u]} + 1 = ${dist[x]}. It joins the back of the queue, and the edge ${u}-${x} becomes part of the search tree.`
      }, { cur: u, look: x, lookTone: "found", ptrs: [{ node: idOf(u), label: "u" }, { node: idOf(x), label: "x" }] });
    }
    done.add(u);
  }

  const missed = g.nodes.filter((x) => dist[x] === -1);
  snap({
    kind: "found", anchors: ["bfs.done"], notes: { "bfs.done": `return ${distLine(g.nodes, dist)}` }, ret: distLine(g.nodes, dist),
    title: "The queue is empty", short: "done",
    idea: missed.length ? "A node no path reaches never enters the queue. Its distance stays unknown." : "Every node was reached. Each distance is the fewest edges from the start.",
    text: missed.length
      ? `Every node reachable from ${s} has a distance. ${missed.join(", ")} ${missed.length === 1 ? "has" : "have"} no path from ${s}, so ${missed.length === 1 ? "it stays" : "they stay"} at ∞.`
      : `Every node has a distance: ${distLine(g.nodes, dist)}. The green edges form a tree of shortest paths from ${s}.`
  });

  snap({
    kind: "recap", anchors: [], notes: {},
    title: "Each node and edge, handled once",
    idea: "BFS finds the fewest edges from the start to every node. It costs O(n + e), because each node is queued once and each list is read once.",
    text: `Each node entered the queue at most once, and each adjacency list was read once. Follow the green edges back to ${s} to read off a shortest path. BFS counts edges, so it ignores weights. For weighted graphs, see Dijkstra.`
  });
  return steps;
}

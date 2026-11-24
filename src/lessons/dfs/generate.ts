import type { Step } from "../../engine/types";
import type { BlockState } from "../../iso/IsoBlock";
import type { TPointer } from "../../iso/TreeNodes";
import { adjacency, ekey, graphView, idOf, ringLayout, type GraphInput, type GraphState } from "../graphkit";

export interface DfsState extends GraphState {
  op: string | null;
  /** Nodes in the order they were first visited. */
  order: string[];
  /** The call stack, the start at the bottom. */
  stack: string[];
}

/** Recursive depth-first search: go as deep as possible along one path, then back up and try the next. */
export function generateDfs(g: GraphInput): Step<DfsState>[] {
  const { pos, frame } = ringLayout(g.nodes);
  const adj = adjacency(g);
  const order: string[] = [];
  const stack: string[] = [];
  const finished = new Set<string>();
  const tree: Record<string, "tree"> = {};
  const steps: Step<DfsState>[] = [];

  const snap = (st: Omit<Step<DfsState>, "state" | "op">, v: { look?: string; lookTone?: BlockState; ptrs?: TPointer[] } = {}) => {
    const cur = stack[stack.length - 1];
    const states: Partial<Record<string, BlockState>> = {};
    for (const x of g.nodes) if (finished.has(x)) states[x] = "found"; else if (stack.includes(x)) states[x] = "visited";
    if (v.look) states[v.look] = v.lookTone ?? states[v.look];
    if (cur) states[cur] = "active";
    const edges: Record<string, "tree" | "active"> = { ...tree };
    if (cur && v.look) edges[ekey(cur, v.look, false)] = "active";
    const tags = Object.fromEntries(order.map((x, k) => [x, `#${k + 1}`]));
    const view = graphView(g, pos, { states, edges, tags });
    const op = st.kind === "problem" || st.kind === "recap" ? null : cur ? `dfs(${cur})` : `dfs(${g.start})`;
    steps.push({
      ...st, op,
      state: {
        ...view, frame,
        ptrs: [...(cur ? [{ node: idOf(cur), label: "here" }] : []), ...(v.ptrs ?? [])],
        strip: st.kind === "problem" ? undefined : {
          name: "stack", slots: g.nodes.length,
          tiles: stack.map((x, k) => ({ v: x, state: k === stack.length - 1 ? "active" : "visited" })),
          ptrs: stack.length ? [{ at: stack.length - 1, label: "top" }] : []
        },
        op, order: order.slice(), stack: stack.slice()
      }
    });
  };

  snap({
    kind: "problem", anchors: [], notes: {},
    title: "Go deep first, then back up",
    idea: "Each call moves to an unvisited neighbour straight away. Only when a node has none left does the search back up.",
    text: `Depth-first search starts at ${g.start} and follows one path as far as it can go. When it gets stuck, it returns to the last node with an unvisited neighbour and tries that. The strip under the graph is the call stack, one frame per node on the current path.`
  });

  const visit = (u: string, from: string | null) => {
    stack.push(u);
    order.push(u);
    if (from) tree[ekey(from, u, false)] = "tree";
    snap(from === null ? {
      kind: "add", anchors: ["dfs.sig", "dfs.visit"], notes: { "dfs.visit": `order = [${order.join(", ")}]` },
      title: `Visit ${u}`,
      idea: "Visiting a node marks it seen, so the search never enters it twice, even when a cycle leads back.",
      text: `The first call is dfs(${u}). ${u} is marked as seen and written down as visit number 1.`
    } : {
      kind: "add", anchors: ["dfs.recurse", "dfs.sig", "dfs.visit"], notes: { "dfs.recurse": `dfs(${u})`, "dfs.visit": `order = [${order.join(", ")}]` },
      title: `Go deeper to ${u}`,
      idea: "The search does not finish the other neighbours first. It dives into the new node at once, and the rest wait on the stack.",
      text: `${u} has not been seen, so ${from} calls dfs(${u}) right away. ${u} is visit number ${order.length}. ${from}'s other neighbours wait in its frame on the stack.`
    });
    for (const { to: x } of adj[u]) {
      if (order.includes(x)) {
        snap({
          kind: "check", anchors: ["dfs.seen"], notes: { "dfs.seen": `${x} already seen` },
          title: `${x} was already seen`,
          idea: "The seen mark is what stops a cycle from sending the search round and round.",
          text: `${u}'s neighbour ${x} was visited before, so the search does not go back into it.`
        }, { look: x, ptrs: [{ node: idOf(x), label: "next" }] });
        continue;
      }
      visit(x, u);
    }
    stack.pop();
    finished.add(u);
    const back = stack[stack.length - 1];
    stack.push(u);
    snap({
      kind: "remove", anchors: ["dfs.done"], notes: { "dfs.done": back ? `return to ${back}` : "return to the caller" },
      title: `${u} is finished`,
      idea: "A node is finished when every neighbour has been tried. Its frame leaves the stack and the search backs up one step.",
      text: back
        ? `Every neighbour of ${u} has been tried. dfs(${u}) returns, and the search is back in ${back}, which goes on with its next neighbour.`
        : `Every neighbour of ${u} has been tried. dfs(${u}) returns, and the stack is empty.`
    });
    stack.pop();
  };
  visit(g.start, null);

  const missed = g.nodes.filter((x) => !order.includes(x));
  snap({
    kind: "found", anchors: ["dfs.order"], notes: { "dfs.order": `[${order.join(", ")}]` }, ret: `[${order.join(", ")}]`,
    title: missed.length ? `${missed.join(", ")} never visited` : "Every node visited",
    idea: missed.length ? "DFS only reaches what has a path from the start. Starting it again from an unvisited node finds the next piece." : "The green edges are the paths the search took. Together they form a tree.",
    text: missed.length
      ? `The visit order is ${order.join(", ")}. ${missed.join(", ")} ${missed.length === 1 ? "has" : "have"} no path from ${g.start}. Running dfs again from ${missed[0]} would visit ${missed.length === 1 ? "it" : "them"}, and counting those runs counts the connected pieces.`
      : `The visit order is ${order.join(", ")}. The green edges show the path each call took. They form a depth-first tree.`
  });

  snap({
    kind: "recap", anchors: [], notes: {},
    title: "One path at a time",
    idea: "DFS costs O(n + e) like BFS. It uses a stack instead of a queue, so it dives instead of spreading.",
    text: "Each node was entered once and each adjacency list read once. The stack holds the current path, so it can grow as deep as the graph is long. DFS is the base of cycle checks, topological sort and finding connected pieces."
  });
  return steps;
}

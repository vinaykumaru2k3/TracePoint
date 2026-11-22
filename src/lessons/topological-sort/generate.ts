import type { Step } from "../../engine/types";
import type { BlockState } from "../../iso/IsoBlock";
import type { TPointer } from "../../iso/TreeNodes";
import { adjacency, ekey, graphView, idOf, ringLayout, type GraphInput, type GraphState } from "../graphkit";

export interface TopoState extends GraphState {
  op: string | null;
  indeg: Record<string, number>;
  queue: string[];
  order: string[];
}

/** Kahn's algorithm: repeatedly output a node nothing points to, then delete its out-edges. */
export function generateTopo(g: GraphInput): Step<TopoState>[] {
  const { pos, frame } = ringLayout(g.nodes);
  const adj = adjacency(g);
  const indeg: Record<string, number> = Object.fromEntries(g.nodes.map((x) => [x, 0]));
  let counted = false;
  let queue: string[] = [];
  const order: string[] = [];
  const gone: Record<string, "dim"> = {};
  const op = "topoSort()";
  const steps: Step<TopoState>[] = [];

  const snap = (st: Omit<Step<TopoState>, "state" | "op">, v: { cur?: string; edge?: [string, string]; look?: string; lookTone?: BlockState; left?: string[]; ptrs?: TPointer[] } = {}) => {
    const states: Partial<Record<string, BlockState>> = {};
    for (const x of g.nodes) if (order.includes(x)) states[x] = "found"; else if (queue.includes(x)) states[x] = "compare";
    for (const x of v.left ?? []) states[x] = "swap";
    if (v.look) states[v.look] = v.lookTone ?? states[v.look];
    if (v.cur) states[v.cur] = "active";
    const edges: Record<string, "dim" | "active"> = { ...gone };
    if (v.edge) edges[ekey(v.edge[0], v.edge[1], true)] = "active";
    const tags = counted ? Object.fromEntries(g.nodes.filter((x) => !order.includes(x)).map((x) => [x, `in=${indeg[x]}`])) : {};
    const view = graphView(g, pos, { states, edges, tags });
    const live = st.kind === "problem" || st.kind === "recap" ? null : op;
    steps.push({
      ...st, op: live,
      state: {
        ...view, frame, ptrs: v.ptrs ?? [],
        strip: st.kind === "problem" ? undefined : {
          name: "order", slots: g.nodes.length,
          tiles: order.map((x, k) => ({ v: x, state: k === order.length - 1 && v.cur === x ? "active" : "found" }))
        },
        op: live, indeg: { ...indeg }, queue: queue.slice(), order: order.slice()
      }
    });
  };

  snap({
    kind: "problem", anchors: [], notes: {},
    title: "Put every task after the ones it needs",
    idea: "A node with no arrows coming in needs nothing first, so it can go next. Removing it may free the nodes it points to.",
    text: `Each arrow A → B means A must come before B, like a course that is needed for another. A topological order lists every node so that all arrows point forward. Kahn's algorithm builds one by always taking a node that nothing still points to.`
  });

  for (const e of g.edges) indeg[e.v]++;
  counted = true;
  snap({
    kind: "check", anchors: ["topo.sig", "topo.count"], notes: { "topo.count": g.nodes.map((x) => `${x}:${indeg[x]}`).join(" ") },
    title: "Count the arrows into each node",
    idea: "The in-degree of a node is how many arrows point into it. That is how many nodes must come before it.",
    text: `Every arrow adds 1 to the node it points at. The tags show the counts: ${g.nodes.map((x) => `${x} has ${indeg[x]}`).join(", ")}.`
  });

  queue = g.nodes.filter((x) => indeg[x] === 0);
  snap({
    kind: "add", anchors: ["topo.init"], notes: { "topo.init": `queue = [${queue.join(", ")}]` },
    title: queue.length ? `Queue the nodes nothing points to` : "No node is free to start",
    idea: "A node with in-degree 0 has nothing that must come first. Any of them can start the order.",
    text: queue.length
      ? `${queue.join(" and ")} ${queue.length === 1 ? "has" : "have"} in-degree 0, so ${queue.length === 1 ? "it goes" : "they go"} into the queue.`
      : "Every node has an arrow coming in, so none can go first. That only happens when the arrows form a cycle."
  });

  while (queue.length) {
    const u = queue.shift()!;
    order.push(u);
    snap({
      kind: "remove", anchors: ["topo.poll", "topo.out"], notes: { "topo.out": `order = [${order.join(", ")}]` },
      title: `${u} goes next`,
      idea: "Everything that had to come before this node is already in the order, so it is safe to place now.",
      text: `${u} leaves the queue and is added to the order in place ${order.length}. Now its arrows are removed, one by one.`
    }, { cur: u, ptrs: [{ node: idOf(u), label: "u" }] });
    for (const { to: x } of adj[u]) {
      indeg[x]--;
      const free = indeg[x] === 0;
      if (free) queue.push(x);
      snap({
        kind: free ? "add" : "check", anchors: free ? ["topo.dec", "topo.push"] : ["topo.dec"],
        notes: { "topo.dec": `indeg[${x}] = ${indeg[x]}`, ...(free ? { "topo.push": `queue = [${queue.join(", ")}]` } : {}) },
        title: free ? `${x} is free: in-degree 0` : `${x} still waits on ${indeg[x]}`,
        idea: free ? "The last arrow into this node is gone, so everything it needed is placed. It joins the queue." : "Removing an arrow lowers the count, but other nodes must still come before this one.",
        text: free
          ? `The arrow ${u} → ${x} is removed, and ${x}'s in-degree drops to 0. ${x} joins the queue.`
          : `The arrow ${u} → ${x} is removed. ${x}'s in-degree drops to ${indeg[x]}, so it is not ready yet.`
      }, { cur: u, edge: [u, x], look: x, lookTone: free ? "compare" : undefined, ptrs: [{ node: idOf(u), label: "u" }, { node: idOf(x), label: "x" }] });
      gone[ekey(u, x, true)] = "dim";
    }
  }

  const left = g.nodes.filter((x) => !order.includes(x));
  if (left.length) {
    snap({
      kind: "empty", anchors: ["topo.cycle"], notes: { "topo.cycle": `${order.length} of ${g.nodes.length} placed` }, ret: "cycle",
      title: "Stuck: a cycle blocks the rest",
      idea: "In a cycle every node waits on another in the same cycle. None ever reaches in-degree 0, so no order exists.",
      text: `The queue is empty but ${left.join(", ")} ${left.length === 1 ? "is" : "are"} still unplaced, each with arrows coming in. Those arrows form a cycle, so no topological order exists. The function reports failure.`
    }, { left });
  } else {
    snap({
      kind: "found", anchors: ["topo.done"], notes: { "topo.done": `return [${order.join(", ")}]` }, ret: `[${order.join(", ")}]`,
      title: "Every node is placed",
      idea: "Each node was placed only after every node pointing to it, so all arrows point forward in the order.",
      text: `The order is ${order.join(", ")}. Check any arrow: its start comes before its end. Other valid orders may exist. This one depends on the queue order.`
    });
  }

  snap({
    kind: "recap", anchors: [], notes: {},
    title: "Count, free, remove",
    idea: "Kahn's algorithm costs O(n + e): each node enters the queue once and each arrow is removed once.",
    text: "A topological order exists exactly when the graph has no cycle. Kahn's algorithm finds one, or proves there is none when nodes are left over. Build systems, course plans and spreadsheet formulas all use this order."
  });
  return steps;
}

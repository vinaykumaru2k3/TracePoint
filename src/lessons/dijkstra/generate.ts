import type { Step } from "../../engine/types";
import type { BlockState } from "../../iso/IsoBlock";
import type { TPointer } from "../../iso/TreeNodes";
import { adjacency, distText, ekey, graphView, idOf, ringLayout, type GraphInput, type GraphState } from "../graphkit";

export interface DijkstraState extends GraphState {
  op: string | null;
  dist: Record<string, number>;
  /** Queue entries as [node, distance], smallest first. */
  pq: [string, number][];
}

export const distLine = (nodes: string[], dist: Record<string, number>) => nodes.map((x) => `${x}${distText(dist[x])}`).join(" ");

/** Dijkstra with a lazy priority queue: pop the closest entry, skip it if stale, relax its edges. */
export function generateDijkstra(g: GraphInput): Step<DijkstraState>[] {
  const { pos, frame } = ringLayout(g.nodes);
  const adj = adjacency(g);
  const s = g.start;
  const dist: Record<string, number> = Object.fromEntries(g.nodes.map((x) => [x, Infinity]));
  const via: Record<string, string> = {};
  const done = new Set<string>();
  /** Entries as [node, distance, push number]; ties pop in push order. */
  const pq: [string, number, number][] = [];
  let seq = 0;
  const push = (x: string, d: number) => {
    pq.push([x, d, seq++]);
    pq.sort((a, b) => a[1] - b[1] || a[2] - b[2]);
  };
  const op = `dijkstra(${s})`;
  const steps: Step<DijkstraState>[] = [];

  const snap = (st: Omit<Step<DijkstraState>, "state" | "op">, v: { cur?: string; look?: string; lookTone?: BlockState; stale?: string; ptrs?: TPointer[] } = {}) => {
    const states: Partial<Record<string, BlockState>> = {};
    for (const x of g.nodes) if (done.has(x)) states[x] = "visited"; else if (Number.isFinite(dist[x])) states[x] = "compare";
    if (v.look) states[v.look] = v.lookTone ?? states[v.look];
    if (v.cur) states[v.cur] = "active";
    const edges: Record<string, "tree" | "active"> = {};
    for (const [x, p] of Object.entries(via)) edges[ekey(p, x, false)] = "tree";
    if (v.cur && v.look) edges[ekey(v.cur, v.look, false)] = "active";
    const tags = Object.fromEntries(g.nodes.map((x) => [x, `d=${distText(dist[x])}`]));
    const view = graphView(g, pos, { states, edges, tags, weighted: true });
    const live = st.kind === "problem" || st.kind === "recap" ? null : op;
    steps.push({
      ...st, op: live,
      state: {
        ...view, frame, ptrs: [{ node: idOf(s), label: "s" }, ...(v.ptrs ?? [])],
        strip: st.kind === "problem" ? undefined : {
          name: "pq",
          tiles: [
            ...(v.stale ? [{ v: v.stale, state: "stale" as const }] : []),
            ...pq.map(([x, d], k) => ({ v: `${x}:${d}`, state: d > dist[x] ? ("stale" as const) : k === 0 && !v.stale ? ("active" as const) : ("compare" as const) }))
          ],
          ptrs: pq.length && !v.stale ? [{ at: 0, label: "min" }] : []
        },
        op: live, dist: { ...dist }, pq: pq.map(([x, d]) => [x, d])
      }
    });
  };

  snap({
    kind: "problem", anchors: [], notes: {},
    title: "Cheapest route from one node to all others",
    idea: "Always settle the closest unsettled node next. With no negative weights, nothing found later can beat its distance.",
    text: `Each edge has a cost, like minutes on a road. Dijkstra's algorithm finds the cheapest total cost from ${s} to every node. A priority queue under the graph hands out the closest known node first. Three cheap edges can beat one expensive edge.`
  });

  dist[s] = 0;
  push(s, 0);
  snap({
    kind: "add", anchors: ["dij.sig", "dij.init"], notes: { "dij.init": `dist[${s}] = 0, pq = [${s}:0]` },
    title: `Start at ${s} with cost 0`, short: `start ${s}`,
    idea: "Every distance starts at ∞, meaning no route is known yet. The start costs nothing to reach.",
    text: `${s} gets distance 0 and goes into the queue as ${s}:0. Every other node shows d=∞.`
  }, { cur: s });

  while (pq.length) {
    const [u, d] = pq.shift()!;
    if (d > dist[u]) {
      snap({
        kind: "remove", anchors: ["dij.pop", "dij.stale"], notes: { "dij.pop": `${u}:${d}`, "dij.stale": `${d} > dist[${u}] = ${dist[u]}, skip` },
        title: `${u}:${d} is out of date`, short: `skip ${u}:${d}`,
        idea: "A lazy queue never edits an entry. It leaves the old one in and throws it away when it comes out.",
        text: `This entry says ${u} costs ${d}, but a cheaper route of ${dist[u]} was found after it was queued. ${u} is already settled, so the entry is skipped.`
      }, { stale: `${u}:${d}`, ptrs: [{ node: idOf(u), label: "u" }] });
      continue;
    }
    done.add(u);
    snap({
      kind: "remove", anchors: ["dij.pop"], notes: { "dij.pop": `${u}:${d}` },
      title: `Settle ${u} at cost ${d}`, short: `settle ${u}`,
      idea: "The smallest entry is final. Any other route to it would pass through a node that already costs at least as much.",
      text: `${u}:${d} is the cheapest entry in the queue, so ${d} is the true cost of ${u}. Now each edge out of ${u} is tried.`
    }, { cur: u, ptrs: [{ node: idOf(u), label: "u" }] });
    for (const { to: x, w } of adj[u]) {
      const nd = d + w;
      const ptrs: TPointer[] = [{ node: idOf(u), label: "u" }, { node: idOf(x), label: "x" }];
      if (nd < dist[x]) {
        const was = dist[x];
        dist[x] = nd;
        via[x] = u;
        push(x, nd);
        snap({
          kind: "add", anchors: ["dij.relax", "dij.push"], notes: { "dij.relax": `${d} + ${w} = ${nd} < ${distText(was)}`, "dij.push": `push ${x}:${nd}` },
          title: `Cheaper route to ${x}: ${nd}`, short: `${x} = ${nd}`,
          idea: "Relaxing an edge asks whether going through this node is cheaper. If so, the distance drops and a new entry is queued.",
          text: Number.isFinite(was)
            ? `Through ${u}, ${x} costs ${d} + ${w} = ${nd}, less than the ${was} known before. dist[${x}] drops to ${nd} and ${x}:${nd} is queued. The old entry ${x}:${was} stays in the queue, now out of date.`
            : `Through ${u}, ${x} costs ${d} + ${w} = ${nd}. That is the first route to ${x}, so dist[${x}] becomes ${nd} and ${x}:${nd} is queued.`
        }, { cur: u, look: x, lookTone: "found", ptrs });
      } else {
        snap({
          kind: "check", anchors: ["dij.relax", "dij.keep"], notes: { "dij.relax": `${d} + ${w} = ${nd}`, "dij.keep": `${nd} ≥ ${dist[x]}, keep` },
          title: `${x} keeps ${dist[x]}`, short: `${x} keeps`,
          idea: "A route that is not cheaper changes nothing. The known distance stays and nothing is queued.",
          text: `Through ${u}, ${x} would cost ${d} + ${w} = ${nd}. That is no better than ${dist[x]}, so ${x} keeps its distance.`
        }, { cur: u, look: x, ptrs });
      }
    }
  }

  const missed = g.nodes.filter((x) => !Number.isFinite(dist[x]));
  snap({
    kind: "found", anchors: ["dij.done"], notes: { "dij.done": `return ${distLine(g.nodes, dist)}` }, ret: distLine(g.nodes, dist),
    title: "The queue is empty", short: "done",
    idea: missed.length ? "A node with no route from the start is never queued, so its distance stays ∞." : "Every distance is final. The green edges form a tree of cheapest routes from the start.",
    text: missed.length
      ? `The cheapest costs are ${distLine(g.nodes, dist)}. ${missed.join(", ")} ${missed.length === 1 ? "has" : "have"} no route from ${s}, so ${missed.length === 1 ? "it stays" : "they stay"} at ∞.`
      : `The cheapest costs are ${distLine(g.nodes, dist)}. Follow the green edges back to ${s} to read off each cheapest route.`
  });

  snap({
    kind: "recap", anchors: [], notes: {},
    title: "Settle the closest, relax its edges",
    idea: "With a binary heap, Dijkstra costs O(e log n): every edge can push one entry, and each push or pop costs O(log n).",
    text: "Each node was settled once, at its true cost, and out-of-date entries were thrown away as they surfaced. The rule needs weights of 0 or more. One negative edge can make a settled node cheaper later, which breaks it."
  });
  return steps;
}

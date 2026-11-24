import type { ParseResult, Step } from "../../engine/types";
import type { GEdge } from "../../iso/GraphNodes";
import type { BlockState } from "../../iso/IsoBlock";
import type { TNode, TPointer } from "../../iso/TreeNodes";
import { LETTERS, forestLayout, idOf, type GraphState } from "../graphkit";

export type UfOp = { kind: "union" | "connected"; a: string; b: string } | { kind: "find"; a: string };
export interface UfInput { nodes: string[]; ops: UfOp[] }

export interface UfState extends GraphState {
  op: string | null;
  parent: Record<string, string>;
  size: Record<string, number>;
  /** Parent links followed so far in the whole run. */
  hops: number;
}

export const UF_OPS = 10;

/** Read "union A B, find D, connected A F". */
export function parseUf(text: string): ParseResult<UfInput> {
  const items = text.split(/[,;\n]+/).map((x) => x.trim()).filter(Boolean);
  if (!items.length) return { ok: false, error: 'Type at least one operation, like "union A B".' };
  if (items.length > UF_OPS) return { ok: false, error: `Keep it to ${UF_OPS} operations or fewer so the steps stay readable.` };
  const ops: UfOp[] = [];
  const nodes = new Set<string>();
  for (const it of items) {
    const m = /^(union|find|connected)\s*\(?\s*([a-z])\s*(?:[\s,]\s*([a-z]))?\s*\)?$/i.exec(it);
    if (!m) return { ok: false, error: `Could not read "${it}". Use "union A B", "find A" or "connected A B".` };
    const kind = m[1].toLowerCase() as UfOp["kind"];
    const a = m[2].toUpperCase(), b = m[3]?.toUpperCase();
    for (const x of [a, b]) if (x && !LETTERS.includes(x)) return { ok: false, error: `Nodes are single letters A to ${LETTERS[LETTERS.length - 1]}, so "${x}" is out of range.` };
    if (kind === "find") {
      if (b) return { ok: false, error: `find takes one node, like "find ${a}".` };
      ops.push({ kind, a });
      nodes.add(a);
    } else {
      if (!b) return { ok: false, error: `${kind} takes two nodes, like "${kind} ${a} B".` };
      if (a === b) return { ok: false, error: `${kind} ${a} ${a} names the same node twice. Pick two different nodes.` };
      ops.push({ kind, a, b });
      nodes.add(a); nodes.add(b);
    }
  }
  return { ok: true, input: { nodes: [...nodes].sort(), ops } };
}

/** Union by size and find with path compression, one step per link followed or changed. */
export function generateUf(inp: UfInput): Step<UfState>[] {
  const ids = inp.nodes;
  const parent: Record<string, string> = Object.fromEntries(ids.map((x) => [x, x]));
  const size: Record<string, number> = Object.fromEntries(ids.map((x) => [x, 1]));
  let hops = 0;
  let op: string | null = null;
  const steps: Step<UfState>[] = [];

  const snap = (st: Omit<Step<UfState>, "state" | "op">, v: {
    cur?: string; root?: string; path?: string[]; edge?: [string, string]; linked?: [string, string]; changed?: string; ptrs?: TPointer[];
  } = {}) => {
    const pos = forestLayout(ids, parent);
    const states: Partial<Record<string, BlockState>> = {};
    for (const x of v.path ?? []) states[x] = "visited";
    if (v.root) states[v.root] = "found";
    if (v.cur) states[v.cur] = "active";
    const nodes: TNode[] = ids.map((x) => ({
      id: idOf(x), v: x, col: pos[x].col, depth: pos[x].row, state: states[x],
      tag: parent[x] === x ? `size ${size[x]}` : undefined
    }));
    const edges: GEdge[] = ids.filter((x) => parent[x] !== x).map((x) => {
      const hot = v.edge && v.edge[0] === x && v.edge[1] === parent[x];
      const fresh = v.linked && v.linked[0] === x && v.linked[1] === parent[x];
      return { from: idOf(x), to: idOf(parent[x]), dir: true, state: hot ? "active" : fresh ? "tree" : "default" };
    });
    const live = st.kind === "problem" || st.kind === "recap" ? null : op;
    steps.push({
      ...st, op: live,
      state: {
        nodes, edges, ptrs: v.ptrs ?? [], frame: { c0: 0, c1: 0, rows: 0 },
        strip: st.kind === "problem" ? undefined : {
          name: "parent", labels: ids,
          tiles: ids.map((x) => ({ v: parent[x], state: x === v.changed ? "found" : x === v.cur ? "active" : undefined }))
        },
        op: live, parent: { ...parent }, size: { ...size }, hops
      }
    });
  };

  snap({
    kind: "problem", anchors: [], notes: {},
    title: "Which things are in the same group?",
    idea: "Each group is a tree, and its root names the group. Two nodes are together exactly when they reach the same root.",
    text: `Union-find keeps ${ids.length} nodes split into groups. union joins two groups, find names a node's group, and connected asks whether two nodes share one. Every node starts alone, as its own parent. The parent array below is the whole structure.`
  });

  /** Walk up to the root, then point every node on the path straight at it. `extra` anchors go on the first step. */
  const find = (x: string, extra: string[], top: boolean): string => {
    const path: string[] = [];
    let r = x;
    if (parent[r] === r) {
      snap({
        kind: top ? "found" : "check", anchors: [...extra, "find.sig", "find.root", "find.ret"], notes: { "find.root": `parent[${r}] = ${r}` },
        ...(top ? { ret: r } : {}),
        title: `${r} is a root`,
        idea: "A root is its own parent. It is the name of its group.",
        text: `find(${x}) looks at parent[${x}], which is ${x} itself. So ${x} is the root of its group and find returns ${x} at once.`
      }, { cur: r, root: r, ptrs: [{ node: idOf(r), label: "here" }] });
      return r;
    }
    let first = true;
    while (parent[r] !== r) {
      path.push(r);
      const p = parent[r];
      hops++;
      const atRoot = parent[p] === p;
      snap({
        kind: "move", anchors: [...(first ? [...extra, "find.sig"] : []), "find.hop", ...(atRoot ? ["find.root"] : [])],
        notes: { "find.hop": `${r} → ${p}`, ...(atRoot ? { "find.root": `parent[${p}] = ${p}` } : {}) },
        title: atRoot ? `${r} → ${p}, the root` : `${r} → ${p}`,
        idea: atRoot ? "The walk stops at a node that is its own parent. That root names the group." : "find climbs one parent link at a time. A tall tree means a long climb.",
        text: atRoot
          ? `parent[${r}] is ${p}, and ${p} is its own parent. So ${p} is the root of ${x}'s group.`
          : `parent[${r}] is ${p}, not ${r}, so ${r} is not a root. find climbs to ${p} and looks again.`
      }, { cur: p, root: atRoot ? p : undefined, path: [...path], edge: [r, p], ptrs: [{ node: idOf(p), label: "here" }] });
      first = false;
      r = p;
    }
    const fix = path.filter((y) => parent[y] !== r);
    if (!fix.length) {
      const last = steps[steps.length - 1];
      last.anchors.push("find.ret");
      if (top) last.ret = r;
      return r;
    }
    fix.forEach((y, k) => {
      const was = parent[y];
      parent[y] = r;
      const end = k === fix.length - 1;
      snap({
        kind: end && top ? "found" : "add", anchors: ["find.link", ...(end ? ["find.ret"] : [])], notes: { "find.link": `parent[${y}] = ${r}` },
        ...(end && top ? { ret: r } : {}),
        title: `Compress: ${y} now points at ${r}`,
        idea: "Path compression points every node on the walk straight at the root. The next find from it takes one step.",
        text: `${y} pointed at ${was}. It now points straight at the root ${r}, so the tree gets flatter and later finds get shorter.`
      }, { cur: y, root: r, linked: [y, r], changed: y, ptrs: [{ node: idOf(y), label: "moved" }] });
    });
    return r;
  };

  for (const o of inp.ops) {
    if (o.kind === "find") {
      op = `find(${o.a})`;
      find(o.a, [], true);
      continue;
    }
    op = `${o.kind}(${o.a},${o.b})`;
    const head = o.kind === "union" ? ["union.sig", "union.find"] : ["conn.sig"];
    const ra = find(o.a, head, false);
    const rb = find(o.b, o.kind === "union" ? ["union.find"] : [], false);
    if (o.kind === "connected") {
      const yes = ra === rb;
      snap({
        kind: yes ? "found" : "empty", anchors: ["conn.ret"], notes: { "conn.ret": `${ra} ${yes ? "==" : "!="} ${rb}` }, ret: String(yes),
        title: yes ? `${o.a} and ${o.b} are connected` : `${o.a} and ${o.b} are apart`,
        idea: yes ? "Same root, same group. The answer comes from the roots alone, never from the path between the nodes." : "Different roots mean different groups. No union has joined them yet.",
        text: yes
          ? `Both finds ended at ${ra}, so ${o.a} and ${o.b} are in one group. connected returns true.`
          : `${o.a}'s root is ${ra} and ${o.b}'s root is ${rb}. The roots differ, so connected returns false.`
      }, { root: ra, cur: yes ? undefined : rb });
      continue;
    }
    if (ra === rb) {
      snap({
        kind: "check", anchors: ["union.same"], notes: { "union.same": `root ${ra} for both` }, ret: "false", retNote: "already joined",
        title: `${o.a} and ${o.b} are already joined`,
        idea: "Joining a group with itself would change nothing, so union stops and reports it.",
        text: `Both finds ended at ${ra}. ${o.a} and ${o.b} are already in one group, so union links nothing and returns false.`
      }, { root: ra });
      continue;
    }
    const swap = size[ra] < size[rb];
    const [big, small] = swap ? [rb, ra] : [ra, rb];
    parent[small] = big;
    size[big] += size[small];
    snap({
      kind: "add", anchors: [...(swap ? ["union.swap"] : []), "union.link"], notes: { "union.link": `parent[${small}] = ${big}, size ${size[big]}` }, ret: "true",
      title: `Hang ${small} under ${big}`,
      idea: "Union by size hangs the smaller tree under the root of the larger one, so trees stay short.",
      text: size[big] - size[small] === size[small] && !swap
        ? `${ra} and ${rb} lead groups of the same size, so ${rb} goes under ${ra}. One parent link joins the groups. ${big}'s group now has ${size[big]} nodes.`
        : `${small}'s group is smaller, so its root goes under ${big}. One parent link joins the groups. ${big}'s group now has ${size[big]} nodes.`
    }, { cur: small, root: big, linked: [small, big], changed: small, ptrs: [{ node: idOf(small), label: "moved" }, { node: idOf(big), label: "root" }] });
  }

  op = null;
  const roots = ids.filter((x) => parent[x] === x);
  const rootOf = (x: string) => { while (parent[x] !== x) x = parent[x]; return x; };
  snap({
    kind: "recap", anchors: [], notes: {},
    title: `${roots.length} group${roots.length === 1 ? "" : "s"} left`,
    idea: "With union by size and path compression, each operation costs O(α(n)), which stays below 5 for any input that fits in memory.",
    text: `The groups are ${roots.map((r) => `{${ids.filter((x) => rootOf(x) === r).join(" ")}}`).join(", ")}. Only parent links were followed, and ${hops} were followed in all. Kruskal's algorithm uses this structure to test whether an edge would close a loop.`
  });

  /* every step frames the widest and tallest forest of the run */
  const all = steps.flatMap((s) => s.state.nodes);
  const frame = { c0: 0, c1: Math.max(0, ...all.map((n) => n.col)), rows: Math.max(0, ...all.map((n) => n.depth)) };
  for (const s of steps) s.state.frame = frame;
  return steps;
}

import type { Step } from "../../engine/types";
import type { BlockState } from "../../iso/IsoBlock";
import type { NumsInput } from "../parseOps";
import { bstLayout, depthOf, insertPlain, type BNode, type TreeState } from "../treekit";

export const TT_MAX = 9;

export type Order = "pre" | "in" | "post" | "level";

export interface TravState extends TreeState {
  order: Order | null;
  out: number[];
  /** Values on the call stack, root first (recursive orders). */
  stack: number[];
  /** Values waiting in the queue, front first (level order). */
  queue: number[];
}

const NAME: Record<Order, string> = { pre: "preorder", in: "inorder", post: "postorder", level: "levelOrder" };
const list = (a: number[]) => `[${a.join(", ")}]`;

/** Builds a BST from the keys to fix the shape, then walks it four ways. Every node visit is one step. */
export function generateTraversals({ nums }: NumsInput): Step<TravState>[] {
  let root: BNode | null = null;
  nums.forEach((v, i) => { root = insertPlain(root, { id: i + 1, v, left: null, right: null, h: 1 }); });
  const tree = root as BNode | null;
  const all = new Map<number, BNode>();
  const index = (n: BNode | null) => { if (n) { all.set(n.id, n); index(n.left); index(n.right); } };
  index(tree);
  const frame = { c0: 0, c1: Math.max(nums.length - 1, 0), depth: depthOf(tree) };
  const n = nums.length;

  let order: Order | null = null;
  let out: number[] = [];
  const steps: Step<TravState>[] = [];
  /** `path` is ids on the call stack, root first; `cur` is the node being visited; `queue` ids waiting. */
  const snap = (s: Omit<Step<TravState>, "state">, o: { path?: number[]; cur?: number | null; queue?: number[] } = {}) => {
    const path = o.path ?? [], queue = o.queue ?? [], cur = o.cur ?? null;
    const done = new Set(out.map((v) => [...all.values()].find((x) => x.v === v)!.id));
    const states: Partial<Record<number, BlockState>> = {};
    for (const id of done) states[id] = "found";
    for (const id of queue) states[id] = "compare";
    for (const id of path) states[id] = "visited";
    if (cur !== null) states[cur] = "active";
    const active = new Set(path.slice(1).map((id, k) => `${path[k]}-${id}`));
    const { nodes, edges } = bstLayout(tree, { states, active });
    const tiles = out.map((v, k) => ({ v, state: (k === out.length - 1 && cur !== null ? "active" : "found") as BlockState }));
    steps.push({
      ...s,
      state: {
        nodes, edges, frame, order, out: out.slice(),
        ptrs: tree ? [{ node: tree.id, label: "root" }] : [],
        strip: { name: "out", tiles, slots: n },
        stack: path.map((id) => all.get(id)!.v), queue: queue.map((id) => all.get(id)!.v)
      }
    });
  };

  snap({
    kind: "problem", op: null, anchors: [], notes: {},
    title: "Four ways to visit every node",
    idea: "A traversal visits every node once. The orders differ only in when a node is written out compared with its children.",
    text: `The keys ${nums.join(", ")} were inserted into a binary search tree to give it this shape. Each node has a left and a right child, either of which can be missing. We will walk it in pre-order, in-order, post-order and level order, writing each visited value to out.`
  });

  const recursive: { o: Exclude<Order, "level">; title: string; idea: string; head: string }[] = [
    { o: "pre", title: "Pre-order: the node, then its subtrees", idea: "Pre-order writes a node on the way down, before either child. It copies a tree in the order you would rebuild it.", head: "Pre-order writes the node first, then walks its left subtree, then its right subtree." },
    { o: "in", title: "In-order: left subtree, the node, right subtree", idea: "In-order visits a binary search tree in sorted order, because every left subtree holds the smaller keys.", head: "In-order walks the left subtree first, writes the node, then walks the right subtree." },
    { o: "post", title: "Post-order: both subtrees, then the node", idea: "Post-order writes a node only after both of its subtrees are finished, so children always come before parents.", head: "Post-order walks both subtrees first and writes the node last." }
  ];

  for (const { o, title, idea, head } of recursive) {
    order = o; out = [];
    const sig = `${o}.sig`, visit = `${o}.visit`, name = NAME[o];
    snap({ kind: "move", op: `${name}()`, anchors: [sig], notes: { [sig]: `${name}(root = ${tree?.v ?? "null"}), out = []` }, title, idea, text: `${head} The call stack, drawn as the path of nodes in progress, shows where the recursion is.` });
    const events: { id: number; path: number[] }[] = [];
    const walk = (x: BNode | null, path: number[]) => {
      if (!x) return;
      const p = [...path, x.id];
      if (o === "pre") events.push({ id: x.id, path: p });
      walk(x.left, p);
      if (o === "in") events.push({ id: x.id, path: p });
      walk(x.right, p);
      if (o === "post") events.push({ id: x.id, path: p });
    };
    walk(tree, []);
    for (const { id, path } of events) {
      const x = all.get(id)!;
      out.push(x.v);
      const stack = path.map((p) => all.get(p)!.v).join(" → ");
      const why = o === "pre"
        ? `${name}(${x.v}) writes ${x.v} before looking at its children.`
        : o === "in"
          ? x.left ? `The left subtree of ${x.v} is finished, so ${x.v} is written now.` : `${x.v} has no left child, so it is written at once.`
          : x.left || x.right ? `Both subtrees of ${x.v} are finished, so ${x.v} is written last.` : `${x.v} is a leaf: no children to wait for.`;
      snap({
        kind: "add", op: `${name}(${x.v})`, anchors: [visit], notes: { [visit]: `out.add(${x.v}), out = ${list(out)}` },
        title: `Write ${x.v}`, idea,
        text: `${why} Call stack: ${stack}. out = ${list(out)}.`
      }, { path, cur: id });
    }
    snap({
      kind: "found", op: `${name}()`, ret: list(out), anchors: [sig], notes: { [sig]: `returns out = ${list(out)}` },
      title: `${name[0].toUpperCase()}${name.slice(1)} is done`, idea,
      text: o === "in"
        ? `out = ${list(out)}. That is the keys in sorted order: in-order on a search tree always gives sorted output.`
        : `out = ${list(out)}. Every node was visited once, so the walk took O(n) time.`
    });
  }

  order = "level"; out = [];
  const q: BNode[] = tree ? [tree] : [];
  const ids = () => q.map((x) => x.id);
  snap({
    kind: "move", op: "levelOrder()", anchors: ["lvl.sig", "lvl.init"], notes: { "lvl.init": `q = [${tree?.v ?? ""}]` },
    title: "Level order: one level at a time",
    idea: "Level order uses a queue instead of recursion. Children join the back, so a whole level is finished before the next starts.",
    text: "Level order visits the root, then every node one level down, and so on. It starts with the root alone in a queue: first in, first out."
  }, { queue: ids() });
  while (q.length) {
    const x = q.shift()!;
    out.push(x.v);
    const kids = [x.left, x.right].filter((k): k is BNode => k !== null);
    q.push(...kids);
    const qs = list(q.map((k) => k.v));
    snap({
      kind: "add", op: `poll() = ${x.v}`, anchors: ["lvl.poll", "lvl.visit", ...(kids.length ? ["lvl.push"] : [])],
      notes: { "lvl.poll": `n = ${x.v}`, "lvl.visit": `out = ${list(out)}`, ...(kids.length ? { "lvl.push": `q = ${qs}` } : {}) },
      title: `Write ${x.v}`, idea: "The queue holds the next level waiting behind the rest of this one.",
      text: `${x.v} leaves the front of the queue and is written. ${kids.length ? `Its ${kids.length === 1 ? "child" : "children"} ${kids.map((k) => k.v).join(" and ")} join the back.` : "It has no children to add."} Queue: ${qs}.`
    }, { cur: x.id, queue: ids() });
  }
  snap({
    kind: "found", op: "levelOrder()", ret: list(out), anchors: ["lvl.done"], notes: { "lvl.done": `returns ${list(out)}` },
    title: "Level order is done", idea: "Level order is breadth-first search on a tree. It is how you find the shallowest node with some property.",
    text: `out = ${list(out)}: the root, then each level from left to right. The queue never held more than one level and a bit.`
  });

  const res = { pre: "", in: "", post: "", level: list(out) };
  for (const s of steps) if (s.kind === "found" && s.state.order) res[s.state.order] = s.ret ?? "";
  steps.push({
    kind: "recap", op: null, anchors: [], notes: {}, state: { ...steps[steps.length - 1].state, ptrs: [] },
    title: "What happened",
    idea: "Same tree, same O(n) cost, four orders. Pick the order by when you need a node compared with its children.",
    text: `Pre-order gave ${res.pre}, in-order ${res.in}, post-order ${res.post} and level order ${res.level}. Each visited all ${n} node${n === 1 ? "" : "s"} once. The recursive walks used a call stack as deep as the tree; level order used a queue as wide as a level.`
  });
  return steps;
}

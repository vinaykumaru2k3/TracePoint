import type { ParseResult, Step } from "../../engine/types";
import type { BlockState } from "../../iso/IsoBlock";
import type { TPointer } from "../../iso/TreeNodes";
import { parseOps, type Op } from "../parseOps";
import { bstLayout, depthOf, fixAll, inorder, type BNode, type TreeState } from "../treekit";

export const BST_MAX = 9;

export interface BstState extends TreeState {
  op: string | null;
  size: number;
  height: number;
}

export function parseBst(text: string): ParseResult<Op[]> {
  const r = parseOps(text, ["insert", "search", "delete"], [], { add: "insert", find: "search", remove: "delete", del: "delete" });
  if (!r.ok) return r;
  if (r.input.filter((o) => o.name === "insert").length > BST_MAX) return { ok: false, error: `Keep it to ${BST_MAX} inserts so the tree fits on the stage.` };
  return r;
}

type View = {
  /** Ids from the root down to the current node, which is drawn active. */
  path?: number[];
  states?: Partial<Record<number, BlockState>>;
  dim?: number[];
  flag?: string;
};

/** Insert, search and delete on a binary search tree. Every compare is one step, so the cost of an operation is the number of steps it takes. */
export function generateBst(ops: Op[]): Step<BstState>[] {
  let root: BNode | null = null;
  let nextId = 1;
  let op: string | null = null;
  let maxN = 1, maxD = 0;
  const steps: Step<BstState>[] = [];

  const snap = (s: Omit<Step<BstState>, "state">, v: View = {}) => {
    const path = v.path ?? [];
    const cur = path.length ? path[path.length - 1] : null;
    const states: Partial<Record<number, BlockState>> = {};
    for (const id of path) states[id] = "visited";
    if (cur !== null) states[cur] = "active";
    Object.assign(states, v.states);
    const active = new Set(path.slice(1).map((id, k) => `${path[k]}-${id}`));
    const { nodes, edges } = bstLayout(root, { states, active, dim: new Set(v.dim ?? []) });
    const ptrs: TPointer[] = root ? [{ node: root.id, label: "root" }] : [];
    if (cur !== null && cur !== root?.id) ptrs.push({ node: cur, label: v.flag ?? "cur" });
    const live = nodes.filter((n) => n.state !== "stale");
    maxN = Math.max(maxN, nodes.length);
    maxD = Math.max(maxD, depthOf(root));
    steps.push({
      ...s,
      state: {
        nodes, edges, ptrs, frame: { c0: 0, c1: 0, depth: 0 }, op,
        size: live.length, height: live.length ? Math.max(...live.map((n) => n.depth)) + 1 : 0
      }
    });
  };

  const sorted = () => inorder(root).map((n) => n.v).join(", ");

  snap({
    kind: "problem", op: null, anchors: [], notes: {},
    title: "A tree that keeps its keys in order",
    idea: "Every key in a node's left subtree is smaller than the node, and every key in its right subtree is larger. That one rule makes searching fast.",
    text: `A binary search tree is a tree where each node has at most two children. Smaller keys go left and larger keys go right, at every node. We will run: ${ops.map((o) => `${o.name} ${o.v}`).join(", ")}.`
  });

  for (const { name, v: raw } of ops) {
    const v = raw!;
    op = `${name}(${v})`;

    if (name === "insert") {
      const fresh = (): BNode => ({ id: nextId++, v, left: null, right: null, h: 1 });
      if (!root) {
        root = fresh();
        snap({
          kind: "add", op, ret: "true", anchors: ["ins.sig", "ins.root"], notes: { "ins.root": `root = Node(${v})` },
          title: `${v} becomes the root`, idea: "The first key has nothing to compare with, so it becomes the root.",
          text: `The tree is empty, so ${v} becomes the root. Every later key starts its walk here.`
        }, { path: [root.id] });
        continue;
      }
      let cur: BNode = root;
      const path: number[] = [];
      for (;;) {
        path.push(cur.id);
        if (v === cur.v) {
          snap({
            kind: "check", op, ret: "false", anchors: ["ins.dup"], notes: { "ins.dup": `${v} == ${cur.v}, return false` },
            title: `${v} is already in the tree`, idea: "A search tree holds each key once. A duplicate insert changes nothing.",
            text: `${v} equals ${cur.v}. The key is already here, so insert returns false and the tree stays as it is.`
          }, { path: [...path], states: { [cur.id]: "compare" } });
          break;
        }
        const side = v < cur.v ? "left" : "right";
        const next: BNode | null = cur[side];
        snap({
          kind: "check", op, anchors: ["ins.cmp"], notes: { "ins.cmp": `${v} ${v < cur.v ? "<" : ">"} ${cur.v}, go ${side}` },
          title: `Compare ${v} with ${cur.v}`, idea: "Each compare moves one level down and rules out a whole subtree.",
          text: `${v} is ${v < cur.v ? "smaller" : "larger"} than ${cur.v}, so it belongs in the ${side} subtree. ${next ? `Move down to ${next.v}.` : `${cur.v} has no ${side} child, so that empty spot is where ${v} goes.`}`
        }, { path: [...path] });
        if (!next) {
          const n = fresh();
          cur[side] = n;
          fixAll(root);
          path.push(n.id);
          snap({
            kind: "add", op, ret: "true", anchors: ["ins.attach"], notes: { "ins.attach": `${cur.v}.${side} = Node(${v})` },
            title: `Attach ${v}`, idea: "A new key always lands as a leaf. Nothing already in the tree moves.",
            text: `${v} becomes the ${side} child of ${cur.v} after ${path.length - 1} compare${path.length === 2 ? "" : "s"}. In order, the keys are now ${sorted()}.`
          }, { path, states: { [n.id]: "found" } });
          break;
        }
        cur = next;
      }
      continue;
    }

    if (name === "search") {
      if (!root) {
        snap({
          kind: "empty", op, ret: "false", anchors: ["find.sig", "find.miss"], notes: { "find.miss": "cur = null, return false" },
          title: `Search an empty tree`, idea: "An empty tree holds no keys, so every search fails at once.",
          text: `The tree is empty, so ${v} cannot be in it. search returns false.`
        });
        continue;
      }
      let cur: BNode | null = root;
      const path: number[] = [];
      while (cur) {
        path.push(cur.id);
        if (v === cur.v) {
          snap({
            kind: "found", op, ret: "true", anchors: ["find.hit"], notes: { "find.hit": `${v} == ${cur.v}, return true` },
            title: `Found ${v}`, idea: "A search costs one compare per level, so its cost is the height of the tree.",
            text: `${v} equals ${cur.v}. Found after ${path.length} compare${path.length === 1 ? "" : "s"}, out of ${inorder(root).length} keys.`
          }, { path: [...path], states: { [cur.id]: "found" } });
          break;
        }
        const side: "left" | "right" = v < cur.v ? "left" : "right";
        const next: BNode | null = cur[side];
        if (next) {
          snap({
            kind: "check", op, anchors: ["find.step"], notes: { "find.step": `${v} ${v < cur.v ? "<" : ">"} ${cur.v}, cur = cur.${side}` },
            title: `Compare ${v} with ${cur.v}`, idea: "Each compare discards the whole subtree on the other side.",
            text: `${v} is ${v < cur.v ? "smaller" : "larger"} than ${cur.v}, so if it is in the tree it must be in the ${side} subtree. Move down to ${next.v}.`
          }, { path: [...path] });
        } else {
          snap({
            kind: "empty", op, ret: "false", anchors: ["find.step", "find.miss"], notes: { "find.step": `cur = cur.${side} = null`, "find.miss": "return false" },
            title: `${v} is not in the tree`, idea: "A miss ends at a missing child: the one spot where the key would have to be.",
            text: `${v} is ${v < cur.v ? "smaller" : "larger"} than ${cur.v}, but ${cur.v} has no ${side} child. If ${v} were in the tree it would be right there, so search returns false.`
          }, { path: [...path] });
        }
        cur = next;
      }
      continue;
    }

    /* delete */
    let parent: BNode | null = null;
    let cur: BNode | null = root;
    const path: number[] = [];
    while (cur && cur.v !== v) {
      path.push(cur.id);
      const side: "left" | "right" = v < cur.v ? "left" : "right";
      const next: BNode | null = cur[side];
      snap({
        kind: next ? "check" : "empty", op, anchors: next ? ["del.step"] : ["del.step", "del.miss"],
        notes: next ? { "del.step": `${v} ${v < cur.v ? "<" : ">"} ${cur.v}, recurse ${side}` } : { "del.step": `recurse ${side} into null`, "del.miss": "return null" },
        title: next ? `Look for ${v}: compare with ${cur.v}` : `${v} is not in the tree`,
        idea: next ? "Delete first searches for the key, one compare per level." : "Deleting a missing key changes nothing.",
        text: next
          ? `${v} is ${v < cur.v ? "smaller" : "larger"} than ${cur.v}, so the search goes ${side} to ${next.v}.`
          : `${v} is ${v < cur.v ? "smaller" : "larger"} than ${cur.v}, and ${cur.v} has no ${side} child. ${v} is not here, so nothing is removed.`
      }, { path: [...path] });
      parent = cur;
      cur = next;
    }
    if (!cur) {
      if (!root) snap({
        kind: "empty", op, anchors: ["del.sig", "del.miss"], notes: { "del.miss": "n = null, return null" },
        title: "Delete from an empty tree", idea: "Deleting a missing key changes nothing.",
        text: `The tree is empty, so there is no ${v} to remove.`
      });
      continue;
    }
    const target: BNode = cur;
    path.push(target.id);
    const replace = (w: BNode | null) => {
      if (!parent) root = w;
      else if (parent.left === target) parent.left = w;
      else parent.right = w;
      fixAll(root);
    };
    const where = parent ? `${parent.v}'s ${parent.left === target ? "left" : "right"} link` : "the root link";

    if (!target.left && !target.right) {
      snap({
        kind: "remove", op, anchors: ["del.leaf"], notes: { "del.leaf": `${v} has no children, return null` },
        title: `Remove the leaf ${v}`, idea: "A leaf has nothing hanging below it, so it can go at once.",
        text: `${v} has no children. ${where[0].toUpperCase()}${where.slice(1)} becomes null and the node is gone.`
      }, { path, states: { [target.id]: "stale" }, dim: [target.id] });
      replace(null);
      continue;
    }

    if (!target.left || !target.right) {
      const child = (target.left ?? target.right)!;
      snap({
        kind: "remove", op, anchors: ["del.one"], notes: { "del.one": `return ${target.left ? "n.left" : "n.right"} (${child.v})` },
        title: `${child.v} takes ${v}'s place`, idea: "A node with one child is skipped over: its child moves up one level, with its whole subtree.",
        text: `${v} has one child, ${child.v}. ${where[0].toUpperCase()}${where.slice(1)} now points at ${child.v}. Everything under ${child.v} was already on the right side of ${parent ? parent.v : "nothing"}, so the order holds.`
      }, { path, states: { [target.id]: "stale", [child.id]: "compare" }, dim: [target.id] });
      replace(child);
      continue;
    }

    /* two children: the in-order successor is the leftmost node of the right subtree */
    let sParent: BNode = target;
    let s: BNode = target.right;
    const sPath = [s.id];
    while (s.left) { sParent = s; s = s.left; sPath.push(s.id); }
    snap({
      kind: "check", op, anchors: ["del.succ"], notes: { "del.succ": `s = ${s.v}` },
      title: `${v} has two children: find its successor`,
      idea: "The successor is the next key in sorted order: one step right, then left as far as possible.",
      text: `${v} has two children, so it cannot be skipped over. Its successor, the smallest key larger than ${v}, is one step right and then all the way left: ${s.v}.`
    }, { path: [...path, ...sPath], states: { [target.id]: "compare" }, flag: "s" });

    target.v = s.v;
    snap({
      kind: "move", op, anchors: ["del.copy"], notes: { "del.copy": `n.val = ${s.v}` },
      title: `Copy ${s.v} into the node`, idea: "Copying the successor keeps the order: it is larger than all of the left side and smaller than the rest of the right.",
      text: `${s.v} is copied into the node that held ${v}. The tree is still in order, but ${s.v} now appears twice, so the old copy below must go.`
    }, { path, states: { [target.id]: "found", [s.id]: "compare" } });

    snap({
      kind: "remove", op, anchors: ["del.drop"], notes: { "del.drop": `delete(n.right, ${s.v})` },
      title: `Remove the old ${s.v}`, idea: "The successor never has a left child, so removing it is always the easy case.",
      text: `The old ${s.v} had no left child: that is why it was the smallest. ${s.right ? `Its right child ${s.right.v} moves up into its place.` : "It is a leaf, so its link becomes null."} In order, the keys are now ${inorder(root).filter((n) => n !== s).map((n) => n.v).join(", ")}.`
    }, { path: [...path, ...sPath], states: { [target.id]: "found", [s.id]: "stale" }, dim: [s.id], flag: "s" });
    if (sParent === target) sParent.right = s.right;
    else sParent.left = s.right;
    fixAll(root);
  }

  op = null;
  const n = inorder(root).length;
  snap({
    kind: "recap", op: null, anchors: [], notes: {},
    title: "What happened",
    idea: "Every operation walks one path from the root, so its cost is the height of the tree: O(log n) when balanced, O(n) when it is a chain.",
    text: n
      ? `The tree ends with ${n} key${n === 1 ? "" : "s"}, ${sorted()} in order, and height ${depthOf(root) + 1}. Every insert, search and delete followed one path down, one compare per level.`
      : "The tree ends empty. Every insert, search and delete followed one path down, one compare per level."
  });

  const frame = { c0: 0, c1: Math.max(maxN - 1, 0), depth: maxD };
  for (const s of steps) s.state.frame = frame;
  return steps;
}

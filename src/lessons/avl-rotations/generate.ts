import type { ParseResult, Step } from "../../engine/types";
import type { BlockState } from "../../iso/IsoBlock";
import type { TPointer } from "../../iso/TreeNodes";
import { parseNums, type NumsInput } from "../parseOps";
import { bf, bstLayout, depthOf, fixAll, inorder, type BNode, type TreeState } from "../treekit";

export const AVL_MAX = 8;

export type Case = "LL" | "RR" | "LR" | "RL";

export interface AvlState extends TreeState {
  op: string | null;
  size: number;
  height: number;
  rotations: number;
  cases: Case[];
}

export const parseAvl = (text: string): ParseResult<NumsInput> => parseNums(text, { minLen: 1, maxLen: AVL_MAX });

const sign = (b: number) => (b > 0 ? `+${b}` : `${b}`);
const list = (ns: BNode[]) => ns.map((n) => n.v).join(", ");

/** AVL insert: a plain search-tree insert, then a walk back up that fixes heights and rotates at the first node out of balance. */
export function generateAvl({ nums }: NumsInput): Step<AvlState>[] {
  let root: BNode | null = null;
  let nextId = 1;
  let op: string | null = null;
  let rotations = 0;
  const cases: Case[] = [];
  let maxN = 1, maxD = 0;
  const steps: Step<AvlState>[] = [];

  const snap = (s: Omit<Step<AvlState>, "state">, v: { path?: number[]; states?: Partial<Record<number, BlockState>>; flags?: TPointer[] } = {}) => {
    const path = v.path ?? [];
    const states: Partial<Record<number, BlockState>> = {};
    for (const id of path) states[id] = "visited";
    if (path.length) states[path[path.length - 1]] = "active";
    Object.assign(states, v.states);
    const active = new Set(path.slice(1).map((id, k) => `${path[k]}-${id}`));
    const { nodes, edges } = bstLayout(root, { states, active, tag: (n) => `bf ${sign(bf(n))}` });
    const ptrs: TPointer[] = root ? [{ node: root.id, label: "root" }, ...(v.flags ?? [])] : [];
    maxN = Math.max(maxN, nodes.length);
    maxD = Math.max(maxD, depthOf(root));
    steps.push({
      ...s,
      state: {
        nodes, edges, ptrs, frame: { c0: 0, c1: 0, depth: 0 }, op,
        size: nodes.length, height: root ? root.h : 0, rotations, cases: cases.slice()
      }
    });
  };

  /** Point whatever held `z` (its parent's link, or the root) at `y`. */
  const relink = (parent: BNode | null, z: BNode, y: BNode) => {
    if (!parent) root = y;
    else if (parent.left === z) parent.left = y;
    else parent.right = y;
  };
  const rotR = (parent: BNode | null, z: BNode): BNode => {
    const y = z.left!;
    z.left = y.right; y.right = z;
    relink(parent, z, y); fixAll(root);
    return y;
  };
  const rotL = (parent: BNode | null, z: BNode): BNode => {
    const y = z.right!;
    z.right = y.left; y.left = z;
    relink(parent, z, y); fixAll(root);
    return y;
  };

  snap({
    kind: "problem", op: null, anchors: [], notes: {},
    title: "A search tree that keeps itself short",
    idea: "An AVL tree keeps the heights of every node's two subtrees within 1 of each other, so its height stays O(log n).",
    text: `A plain search tree fed sorted keys becomes a long chain. An AVL tree stores each node's height and checks its balance factor: left height minus right height. When it reaches +2 or -2, a rotation fixes it. We will insert ${nums.join(", ")}.`
  });

  for (const v of nums) {
    op = `insert(${v})`;
    if (!root) {
      root = { id: nextId++, v, left: null, right: null, h: 1 };
      snap({
        kind: "add", op, anchors: ["ins.sig", "ins.leaf"], notes: { "ins.leaf": `return new Node(${v})` },
        title: `${v} becomes the root`, idea: "A single node has two empty subtrees, so its balance factor is 0.",
        text: `The tree is empty, so ${v} becomes the root with height 1 and balance factor 0.`
      }, { path: [root.id] });
      continue;
    }

    /* walk down, one compare per level */
    const path: BNode[] = [];
    let cur: BNode | null = root;
    let dup = false;
    while (cur) {
      path.push(cur);
      if (v === cur.v) { dup = true; break; }
      const side: "left" | "right" = v < cur.v ? "left" : "right";
      const next: BNode | null = cur[side];
      snap({
        kind: "check", op, anchors: ["ins.cmp"], notes: { "ins.cmp": `${v} ${v < cur.v ? "<" : ">"} ${cur.v}, insert(${side})` },
        title: `Compare ${v} with ${cur.v}`, idea: "The way down is the same as in a plain search tree.",
        text: `${v} is ${v < cur.v ? "smaller" : "larger"} than ${cur.v}, so it goes ${side}. ${next ? `Move down to ${next.v}.` : `${cur.v} has no ${side} child: the new node goes there.`}`
      }, { path: path.map((n) => n.id) });
      if (!next) {
        const n: BNode = { id: nextId++, v, left: null, right: null, h: 1 };
        cur[side] = n;
        fixAll(root);
        snap({
          kind: "add", op, anchors: ["ins.leaf"], notes: { "ins.leaf": `return new Node(${v})` },
          title: `Attach ${v} as a leaf`, idea: "The new leaf can only make its ancestors taller, so only the path back up needs checking.",
          text: `${v} becomes the ${side} child of ${cur.v}. Now the recursion returns up the path, and each node on it updates its height and balance factor.`
        }, { path: [...path.map((x) => x.id), n.id], states: { [n.id]: "found" } });
        break;
      }
      cur = next;
    }
    if (dup) {
      const d = path[path.length - 1];
      snap({
        kind: "check", op, anchors: ["ins.dup"], notes: { "ins.dup": `${v} == ${d.v}, return n` },
        title: `${v} is already in the tree`, idea: "A duplicate is ignored, so no height changes and no rotation is needed.",
        text: `${v} equals ${d.v}. The key is already stored, so insert returns the node unchanged and the tree stays as it is.`
      }, { path: path.map((x) => x.id), states: { [d.id]: "compare" } });
      continue;
    }

    /* walk back up: the first node with |bf| > 1, from the bottom */
    let zi = -1;
    for (let i = path.length - 1; i >= 0; i--) if (Math.abs(bf(path[i])) > 1) { zi = i; break; }
    const ids = path.map((x) => x.id);
    if (zi < 0) {
      snap({
        kind: "check", op, anchors: ["fix.h", "fix.bf", "ins.ret"],
        notes: { "fix.h": path.slice().reverse().map((x) => `${x.v}.h = ${x.h}`).join(", "), "fix.bf": path.slice().reverse().map((x) => `bf(${x.v}) = ${sign(bf(x))}`).join(", ") },
        title: "Every balance factor is fine", idea: "A balance factor of -1, 0 or +1 is allowed. Nothing needs to move.",
        text: `Back up the path ${list(path.slice().reverse())}: each node's height is updated, and every balance factor stays between -1 and +1. No rotation is needed.`
      }, { path: ids, states: Object.fromEntries(ids.map((id) => [id, "visited" as BlockState])) });
      continue;
    }

    const z = path[zi], parent = zi > 0 ? path[zi - 1] : null;
    const b = bf(z);
    const child = (b > 0 ? z.left : z.right)!;
    const kase: Case = b > 0 ? (v < child.v ? "LL" : "LR") : (v > child.v ? "RR" : "RL");
    cases.push(kase);
    const heavy = b > 0 ? "left" : "right";
    const shape = kase === "LL" || kase === "RR"
      ? `${v} went ${heavy} of ${child.v}, which is ${heavy} of ${z.v}: a straight line, so one rotation fixes it.`
      : `${v} went ${heavy === "left" ? "right" : "left"} of ${child.v}, which is ${heavy} of ${z.v}: a zig-zag, so it takes two rotations.`;
    snap({
      kind: "check", op, anchors: ["fix.h", "fix.bf", `case.${kase.toLowerCase()}`],
      notes: { "fix.h": `${z.v}.h = ${z.h}`, "fix.bf": `bf(${z.v}) = ${sign(b)}`, [`case.${kase.toLowerCase()}`]: `${kase} case at ${z.v}` },
      title: `${z.v} is out of balance: the ${kase} case`,
      idea: "Only the lowest unbalanced node needs fixing. One rotation there brings the whole path back into balance.",
      text: `${z.v} has balance factor ${sign(b)}: its ${heavy} subtree is 2 taller than the other. ${shape}`
    }, { path: ids.slice(0, zi + 1), states: { [z.id]: "compare", [child.id]: "active" } });

    const rotateStep = (dir: "left" | "right", p: BNode | null, at: BNode, idea: string, why: string) => {
      const y = dir === "right" ? rotR(p, at) : rotL(p, at);
      rotations++;
      const name = dir === "right" ? "rotateRight" : "rotateLeft";
      snap({
        kind: "move", op: `${name}(${at.v})`, short: `rot${dir === "right" ? "R" : "L"}(${at.v})`,
        anchors: [dir === "right" ? "rot.r" : "rot.l"], notes: { [dir === "right" ? "rot.r" : "rot.l"]: `y = ${y.v}, ${y.v}.${dir} = ${at.v}` },
        title: `Rotate ${dir} at ${at.v}`, idea,
        text: `${y.v} moves up into ${at.v}'s place and ${at.v} becomes its ${dir} child. ${why} In order, the keys are still ${list(inorder(root))}.`
      }, { states: { [y.id]: "active", [at.id]: "compare" }, flags: [{ node: y.id, label: "y" }] });
      return y;
    };

    if (kase === "LL" || kase === "RR") {
      const dir = kase === "LL" ? "right" : "left";
      rotateStep(dir, parent, z, "A rotation moves a child up and its parent down, and keeps the keys in order.",
        `${child.v}'s ${dir} subtree, if any, crosses over to ${z.v}. ${z.v} now has balance factor ${sign(bf(z))}.`);
    } else {
      const first = kase === "LR" ? "left" : "right";
      const second = kase === "LR" ? "right" : "left";
      rotateStep(first, z, child, "The first rotation turns the zig-zag into a straight line.",
        `The zig-zag under ${z.v} is now a straight line, which is the case one more rotation fixes.`);
      rotateStep(second, parent, z, "The second rotation lifts the middle key to the top of this subtree.",
        `${z.v} is balanced again with factor ${sign(bf(z))}, and the subtree is as tall as it was before the insert.`);
    }
  }

  op = null;
  const n = inorder(root).length;
  snap({
    kind: "recap", op: null, anchors: [], notes: {},
    title: "What happened",
    idea: "Rotations cost O(1) each and at most two happen per insert, so insert stays O(log n) and the height stays near log n.",
    text: `${n} key${n === 1 ? "" : "s"} went in and the tree has height ${root ? (root as BNode).h : 0}. ${rotations ? `It took ${rotations} rotation${rotations === 1 ? "" : "s"} (${cases.join(", ")})` : "No rotation was needed"}. In order the keys are ${list(inorder(root))}, so the search tree rule held throughout.`
  });

  const frame = { c0: 0, c1: Math.max(maxN - 1, 0), depth: maxD };
  for (const s of steps) s.state.frame = frame;
  return steps;
}

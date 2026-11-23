import type { Step } from "../../engine/types";
import type { BlockState } from "../../iso/IsoBlock";
import type { TEdge, TNode, TilePointer } from "../../iso/TreeNodes";
import type { TreeState } from "../treekit";

export const SEG_MAX = 8;
export const SEG_OPS = 3;

export type SegOp = { kind: "query"; l: number; r: number } | { kind: "update"; i: number; v: number };
export interface SegInput { nums: number[]; ops: SegOp[] }

export interface SegState extends TreeState {
  a: number[];
  phase: "build" | "query" | "update" | "done" | null;
  /** Running total of the taken nodes in the current query. */
  acc: number;
  /** Nodes the current query or update has visited so far. */
  visits: number;
  /** The tree as an array t[1..]: null where a slot is unused or not built yet. */
  t: (number | null)[];
}

interface SNode { idx: number; l: number; r: number; depth: number; col: number; left?: number; right?: number; parent?: number }

const range = (n: SNode) => `${n.l}..${n.r}`;

/** The recursive segment tree over positions 0..n-1: mid = (l + r) / 2 rounded down, node idx has children 2idx and 2idx + 1. */
export function shapeOf(n: number): Map<number, SNode> {
  const m = new Map<number, SNode>();
  const mk = (idx: number, l: number, r: number, depth: number, parent?: number): number => {
    const node: SNode = { idx, l, r, depth, col: 2 * l, parent };
    m.set(idx, node);
    if (l < r) {
      const mid = (l + r) >> 1;
      node.left = 2 * idx;
      node.right = 2 * idx + 1;
      node.col = (mk(2 * idx, l, mid, depth + 1, idx) + mk(2 * idx + 1, mid + 1, r, depth + 1, idx)) / 2;
    }
    return node.col;
  };
  mk(1, 0, n - 1, 0);
  return m;
}

/** Segment tree: build the sums bottom-up, then answer range-sum queries and point updates by walking the tree. */
export function generateSegmentTree({ nums, ops }: SegInput): Step<SegState>[] {
  const n = nums.length;
  const a = [...nums];
  const shape = shapeOf(n);
  const all = [...shape.values()];
  const maxDepth = Math.max(...all.map((x) => x.depth));
  const maxIdx = Math.max(...all.map((x) => x.idx));
  const sum = new Map<number, number>();
  let phase: SegState["phase"] = null;
  let acc = 0, visits = 0;
  const steps: Step<SegState>[] = [];
  const list = () => `[${a.join(", ")}]`;

  const snap = (
    s: Omit<Step<SegState>, "state">,
    v: { states?: Map<number, BlockState>; edges?: number[]; tiles?: Partial<Record<number, BlockState>>; ptrs?: TilePointer[] } = {}
  ) => {
    const nodes: TNode[] = [], edges: TEdge[] = [];
    for (const x of all) {
      if (!sum.has(x.idx)) continue;
      nodes.push({ id: x.idx, v: sum.get(x.idx)!, col: x.col, depth: x.depth, state: v.states?.get(x.idx), tag: range(x) });
      if (x.parent !== undefined) edges.push({ from: x.parent, to: x.idx, state: v.edges?.includes(x.idx) ? "active" : "default" });
    }
    steps.push({
      ...s,
      state: {
        nodes, edges, ptrs: [], frame: { c0: 0, c1: 2 * (n - 1), depth: maxDepth },
        strip: { name: "a", tiles: a.map((x, k) => ({ v: x, state: v.tiles?.[k] })), slots: n, index: true, ptrs: v.ptrs ?? [] },
        a: [...a], phase, acc, visits,
        t: Array.from({ length: maxIdx }, (_, k) => sum.get(k + 1) ?? null)
      }
    });
  };

  snap({
    kind: "problem", op: null, anchors: [], notes: {},
    title: "Sums over ranges, with changes",
    idea: "A segment tree stores the sum of every range it splits the array into, so a range sum reads a few stored sums instead of every value.",
    text: `The array is ${list()}. A range is a run of positions side by side, and \`l..r\` counts both ends. We want sums of ranges, and the values may change between questions. The tree splits 0..${n - 1} in halves, again and again, down to single positions. Each node shows the sum of its range, and the label under it names the range.`
  });

  /* build: leaves first, then each internal node once its two children exist (post-order) */
  phase = "build";
  const leafStates = new Map<number, BlockState>();
  for (const x of all) if (x.l === x.r) { sum.set(x.idx, a[x.l]); leafStates.set(x.idx, "active"); }
  snap({
    kind: "add", op: "copy leaves", anchors: ["build", "build.leaf"], notes: { build: `build(1, 0, ${n - 1})`, "build.leaf": `${n} leaf${n === 1 ? "" : "s"} copy a[l]` },
    title: n === 1 ? "The one value is the whole tree" : "Copy the array into the leaves",
    idea: "A leaf is a range of one position, so its sum is just the value there.",
    text: n === 1
      ? `With one value, the range 0..0 is a single position. It is both the root and the only leaf, and its sum is ${a[0]}.`
      : `Splitting 0..${n - 1} down to single positions gives ${n} leaves, one per value. Each leaf copies its value from the array. The ${n - 1} nodes above them are still to be filled.`
  }, { states: leafStates });
  if (n === 1) {
    snap({
      kind: "check", op: "no halves", anchors: ["build.leaf"], notes: { "build.leaf": "l == r, so build returns at once" },
      title: "There is nothing to split",
      idea: "The recursion stops at a single position, so a one-value tree is only a leaf and has no sums to add.",
      text: "The range 0..0 has one position and cannot be halved. The build stops there: the tree is one node, and it already holds the sum of its range."
    });
  }

  const built = (idx: number): void => {
    const x = shape.get(idx)!;
    if (x.left === undefined) return;
    built(x.left);
    built(x.right!);
    const L = shape.get(x.left)!, R = shape.get(x.right!)!;
    sum.set(idx, sum.get(L.idx)! + sum.get(R.idx)!);
    snap({
      kind: "add", op: `sum ${range(x)}`, anchors: ["build.split", "build.sum"],
      notes: { "build.split": `mid = ${L.r}, halves ${range(L)} and ${range(R)}`, "build.sum": `t[${idx}] = ${sum.get(L.idx)} + ${sum.get(R.idx)}` },
      title: `Add the halves of ${range(x)}`,
      idea: "An internal node's sum is the sum of its two children, so building goes from the leaves up.",
      text: `${range(x)} splits at ${L.r} into ${range(L)} and ${range(R)}. Their sums are ${sum.get(L.idx)} and ${sum.get(R.idx)}, so this node stores ${sum.get(idx)}.`
    }, { states: new Map<number, BlockState>([[idx, "active"], [L.idx, "compare"], [R.idx, "compare"]]), edges: [L.idx, R.idx] });
  };
  built(1);

  /* queries and updates */
  ops.forEach((op, k) => {
    const tag = `Operation ${k + 1} of ${ops.length}. `;
    visits = 0;
    if (op.kind === "query") {
      phase = "query";
      acc = 0;
      const { l: ql, r: qr } = op;
      const inRange = (x: SNode) => ql <= x.l && x.r <= qr;
      const outside = (x: SNode) => qr < x.l || x.r < ql;
      const qs = new Map<number, BlockState>();
      const taken: number[] = [];
      const tiles: Partial<Record<number, BlockState>> = {};
      for (let p = ql; p <= qr; p++) tiles[p] = "compare";
      const ptrs: TilePointer[] = [{ at: ql, label: "l" }, { at: qr, label: "r" }];
      const visit = (idx: number, first: boolean) => {
        const x = shape.get(idx)!;
        visits++;
        const head = first ? tag : "";
        const anchor = first ? ["ask"] : [];
        const edge = x.parent === undefined ? [] : [idx];
        if (outside(x)) {
          qs.set(idx, "stale");
          snap({
            kind: "check", op: `visit ${range(x)}`, anchors: [...anchor, "query.out"], notes: { "query.out": `${range(x)} is outside ${ql}..${qr}, return 0` },
            title: `${range(x)} is outside the query`,
            idea: "A node whose range shares no position with the query adds nothing, so we stop there.",
            text: `${head}Query ${ql}..${qr}. The range ${range(x)} shares no position with it, so this node adds 0 and its children are not visited. Total so far: ${acc}.`
          }, { states: new Map(qs), edges: edge, tiles, ptrs });
        } else if (inRange(x)) {
          qs.set(idx, "found");
          acc += sum.get(idx)!;
          taken.push(sum.get(idx)!);
          snap({
            kind: "check", op: `visit ${range(x)}`, anchors: [...anchor, "query.in"], notes: { "query.in": `${range(x)} is inside ${ql}..${qr}, take t[${idx}] = ${sum.get(idx)}` },
            title: `${range(x)} is inside the query`,
            idea: "A node whose whole range lies inside the query hands over its stored sum. No need to look below it.",
            text: `${head}Query ${ql}..${qr}. Every position of ${range(x)} is inside it, so the stored sum ${sum.get(idx)} is taken whole and its children are not visited. Total so far: ${acc}.`
          }, { states: new Map(qs), edges: edge, tiles, ptrs });
        } else {
          const L = shape.get(x.left!)!, R = shape.get(x.right!)!;
          const here = new Map(qs);
          here.set(idx, "active");
          snap({
            kind: "move", op: `visit ${range(x)}`, anchors: [...anchor, "query.split"], notes: { "query.split": `${range(x)} overlaps ${ql}..${qr} in part, ask ${range(L)} and ${range(R)}` },
            title: `${range(x)} overlaps the query in part`,
            idea: "When a range sits partly inside and partly outside the query, its stored sum is no use. Ask both halves.",
            text: `${head}Query ${ql}..${qr}. The range ${range(x)} has some positions inside the query and some outside, so its sum cannot be used. Visit both halves, ${range(L)} first and then ${range(R)}. Total so far: ${acc}.`
          }, { states: here, edges: edge, tiles, ptrs });
          qs.set(idx, "visited");
          visit(L.idx, false);
          visit(R.idx, false);
        }
      };
      visit(1, true);
      snap({
        kind: "found", op: `query(${ql},${qr})`, ret: String(acc), anchors: ["ask"], notes: { ask: `return ${acc}` },
        title: `Sum of ${ql}..${qr} is ${acc}`,
        idea: "Only the nodes taken whole were added; everything else was split or skipped.",
        text: `The ${taken.length} node${taken.length === 1 ? "" : "s"} taken whole ${taken.length === 1 ? "gives" : "add up"}: ${taken.join(" + ") || "0"} = ${acc}. The query visited ${visits} node${visits === 1 ? "" : "s"} out of ${shape.size}.`
      }, { states: new Map(qs), tiles, ptrs });
    } else {
      phase = "update";
      acc = 0;
      const { i, v } = op;
      const path: SNode[] = [];
      for (let x = shape.get(1)!; ; x = shape.get(i <= (x.l + x.r) >> 1 ? x.left! : x.right!)!) {
        path.push(x);
        if (x.l === x.r) break;
      }
      const ptrs: TilePointer[] = [{ at: i, label: "i" }];
      const waiting = (upto: number) => new Map<number, BlockState>(path.slice(0, upto).map((x) => [x.idx, "visited" as BlockState]));
      path.forEach((x, d) => {
        visits++;
        const anchor = d === 0 ? ["tell"] : [];
        const edge = x.parent === undefined ? [] : [x.idx];
        if (x.left !== undefined) {
          const mid = (x.l + x.r) >> 1, goLeft = i <= mid, next = path[d + 1];
          const st = waiting(d); st.set(x.idx, "active");
          snap({
            kind: "move", op: `walk ${range(x)}`, anchors: [...anchor, "update.split"], notes: { "update.split": `i = ${i} ${goLeft ? "<=" : ">"} mid = ${mid}, go ${goLeft ? "left" : "right"}` },
            title: `Walk down through ${range(x)}`,
            idea: "An update follows one path from the root to the leaf that holds the position.",
            text: `${d === 0 ? tag : ""}Set position ${i} to ${v}. In ${range(x)} the split point is ${mid}, and ${i} is ${goLeft ? "at or before" : "after"} it, so the walk goes into the ${goLeft ? "left" : "right"} half, ${range(next)}.`
          }, { states: st, edges: edge, tiles: { [i]: "compare" }, ptrs });
        } else {
          const old = a[i];
          a[i] = v;
          sum.set(x.idx, v);
          const st = waiting(d); st.set(x.idx, "active");
          snap({
            kind: "add", op: `set a[${i}]=${v}`, short: `set a[${i}]=${v} #${k + 1}`, anchors: [...anchor, "update.leaf"], notes: { "update.leaf": `t[${x.idx}] = ${v}` },
            title: `Set the leaf for position ${i}`,
            idea: "The leaf holds the changed value. Every sum above it is stale until it is fixed.",
            text: `${d === 0 ? tag : ""}The leaf ${range(x)} is a single position. ${old === v ? `It already holds ${v}, so the value stays the same.` : `Its value changes from ${old} to ${v}.`}${d === 0 || old === v ? "" : ` The sums above it, ${path.slice(0, d).reverse().map(range).join(", ")}, still count the old ${old}.`}`
          }, { states: st, edges: edge, tiles: { [i]: "active" }, ptrs });
        }
      });
      for (let d = path.length - 2; d >= 0; d--) {
        const x = path[d];
        const L = shape.get(x.left!)!, R = shape.get(x.right!)!;
        const before = sum.get(x.idx)!;
        sum.set(x.idx, sum.get(L.idx)! + sum.get(R.idx)!);
        const st = waiting(d);
        st.set(x.idx, "active"); st.set(L.idx, "compare"); st.set(R.idx, "compare");
        snap({
          kind: "add", op: `fix ${range(x)}`, anchors: ["update.fix"], notes: { "update.fix": `t[${x.idx}] = ${sum.get(L.idx)} + ${sum.get(R.idx)}` },
          title: `Fix the sum of ${range(x)}`,
          idea: "Walking back up, each node on the path adds its two children again, so the sums stay true.",
          text: `${range(x)} adds its children again: ${sum.get(L.idx)} + ${sum.get(R.idx)} = ${sum.get(x.idx)}, where it held ${before}.${d === 0 ? ` That was the root, so every sum is correct and the array is ${list()}.` : ""}`
        }, { states: st, edges: [L.idx, R.idx], tiles: { [i]: "compare" }, ptrs });
      }
    }
  });

  phase = "done";
  acc = 0;
  const last = steps[steps.length - 1].state;
  const qn = ops.filter((o) => o.kind === "query").length;
  steps.push({
    kind: "recap", op: null, anchors: [], notes: {}, state: { ...last, phase },
    title: "What happened",
    idea: "A query or an update touches only a few nodes per level, so each costs O(log n) after an O(n) build.",
    text: `The build filled ${n - 1} internal node${n === 2 ? "" : "s"} once. ${qn} quer${qn === 1 ? "y" : "ies"} and ${ops.length - qn} update${ops.length - qn === 1 ? "" : "s"} followed. No operation went more than ${maxDepth + 1} level${maxDepth === 0 ? "" : "s"} deep in a tree of ${shape.size} node${shape.size === 1 ? "" : "s"}.`
  });
  return steps;
}

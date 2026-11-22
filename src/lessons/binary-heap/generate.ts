import type { ParseResult, Step } from "../../engine/types";
import type { BlockState } from "../../iso/IsoBlock";
import type { TilePointer } from "../../iso/TreeNodes";
import { parseOps, type Op } from "../parseOps";
import { heapFrame, heapView, levelsFor, type HItem, type TreeState } from "../treekit";

export const HEAP_MAX = 10;

export interface HeapState extends TreeState {
  op: string | null;
  a: number[];
  size: number;
  /** Values popped so far, in order. */
  popped: number[];
}

export function parseHeap(text: string): ParseResult<Op[]> {
  const r = parseOps(text, "push", ["pop"], { add: "push", insert: "push", poll: "pop", extract: "pop" });
  if (!r.ok) return r;
  let size = 0;
  for (const o of r.input) {
    size = o.name === "push" ? size + 1 : Math.max(size - 1, 0);
    if (size > HEAP_MAX) return { ok: false, error: `The heap holds up to ${HEAP_MAX} items here, so the tree fits on the stage.` };
  }
  return r;
}

/** A min-heap stored in an array. Push sifts the new item up, pop moves the last item to the root and sifts it down. */
export function generateHeap(ops: Op[]): Step<HeapState>[] {
  const a: HItem[] = [];
  let nextId = 1;
  let op: string | null = null;
  const popped: number[] = [];
  const steps: Step<HeapState>[] = [];

  let size = 0, peak = 0;
  for (const o of ops) { size = o.name === "push" ? size + 1 : Math.max(size - 1, 0); peak = Math.max(peak, size); }
  const levels = levelsFor(peak);
  const slots = Math.max(peak, 1);

  /** States and edges by array index; `i` puts a flag on that index in the array. */
  const snap = (s: Omit<Step<HeapState>, "state">, v: { states?: Partial<Record<number, BlockState>>; edges?: number[]; i?: number | null; extra?: { v: number; state: BlockState } } = {}) => {
    const states = v.states ?? {};
    const { nodes, edges } = heapView(a, a.length, levels, states, new Set(v.edges ?? []));
    const tiles = Array.from({ length: slots }, (_, k) => (k < a.length ? { v: a[k].v, state: states[k] } : { v: null }));
    const ptrs: TilePointer[] = v.i != null ? [{ at: v.i, label: "i" }] : [];
    steps.push({
      ...s,
      state: {
        nodes, edges, ptrs: [], frame: heapFrame(levels), op,
        strip: { name: "a", tiles, slots, index: true, ptrs },
        a: a.map((x) => x.v), size: a.length, popped: popped.slice()
      }
    });
  };
  const arr = () => `[${a.map((x) => x.v).join(", ")}]`;
  const swap = (i: number, j: number) => { const t = a[i]; a[i] = a[j]; a[j] = t; };

  snap({
    kind: "problem", op: null, anchors: [], notes: {},
    title: "The smallest item, always on top",
    idea: "A heap keeps every parent no larger than its children. The tree is complete, so it fits in an array with no gaps.",
    text: `A min-heap is a complete binary tree: every level is full except the last, which fills from the left. Each parent is no larger than its children, so the smallest item is at the root. It lives in an array: the children of index i are at 2i + 1 and 2i + 2. We will run: ${ops.map((o) => (o.v === undefined ? o.name : `${o.name} ${o.v}`)).join(", ")}.`
  });

  for (const o of ops) {
    if (o.name === "push") {
      const v = o.v!;
      op = `push(${v})`;
      a.push({ id: nextId++, v });
      let i = a.length - 1;
      snap({
        kind: "add", op, anchors: ["push.sig", "push.add"], notes: { "push.add": `a[${i}] = ${v}, size = ${a.length}` },
        title: `Put ${v} at the end`, idea: "A new item goes in the first free slot, which keeps the tree complete.",
        text: i === 0
          ? `The heap is empty, so ${v} goes into a[0] and becomes the root.`
          : `${v} goes into a[${i}], the next free slot: the leftmost gap on the bottom level. Its parent is a[${(i - 1) >> 1}] = ${a[(i - 1) >> 1].v}.`
      }, { states: { [i]: "active" }, i });
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (a[p].v <= a[i].v) {
          snap({
            kind: "check", op, anchors: ["up.cmp", "up.stop"], notes: { "up.cmp": `p = ${p}, a[p] = ${a[p].v}`, "up.stop": `${a[p].v} <= ${a[i].v}, stop` },
            title: `${a[i].v} stays below ${a[p].v}`, idea: "Sift-up stops as soon as the parent is no larger. Everything above was already in order.",
            text: `The parent a[${p}] = ${a[p].v} is no larger than ${a[i].v}, so the heap rule holds and ${a[i].v} stays at a[${i}]. Heap: ${arr()}.`
          }, { states: { [i]: "active", [p]: "compare" }, edges: [i], i });
          break;
        }
        swap(i, p);
        snap({
          kind: "move", op, anchors: ["up.cmp", "up.swap"], notes: { "up.cmp": `p = ${p}, a[p] = ${a[i].v}`, "up.swap": `swap a[${i}], a[${p}], i = ${p}` },
          title: `Swap ${a[p].v} up past ${a[i].v}`, idea: "Each swap moves the new item up one level, so push costs at most the height: O(log n).",
          text: `${a[p].v} is smaller than its parent ${a[i].v}, so they swap. ${a[p].v} is now at a[${p}].${p === 0 ? " It reached the root, so it is the new smallest item." : ""} Heap: ${arr()}.`
        }, { states: { [p]: "active", [i]: "compare" }, edges: [i], i: p });
        i = p;
      }
      continue;
    }

    /* pop */
    op = "pop()";
    if (!a.length) {
      snap({
        kind: "empty", op, ret: "null", anchors: ["pop.sig", "pop.empty"], notes: { "pop.empty": "size == 0, return null" },
        title: "Nothing to pop", idea: "Pop on an empty heap has no answer. Check the size first, or handle the null.",
        text: "The heap is empty, so pop returns null and nothing changes."
      });
      continue;
    }
    const top = a[0].v;
    popped.push(top);
    snap({
      kind: "peek", op, anchors: ["pop.sig", "pop.take"], notes: { "pop.take": `top = a[0] = ${top}` },
      title: `Take ${top} from the root`, idea: "The smallest item is always at a[0], so finding it costs O(1).",
      text: `${top} is at the root, so it is the smallest item. Taking it leaves a hole at the top, and the tree must stay complete.`
    }, { states: { 0: "found" }, i: 0 });

    const last = a.pop()!;
    if (!a.length) {
      snap({
        kind: "remove", op, ret: String(top), anchors: ["pop.last", "pop.ret"], notes: { "pop.last": "size = 0", "pop.ret": `return ${top}` },
        title: `${top} was the only item`, idea: "Removing the last item leaves an empty heap.",
        text: `${top} was the only item, so the heap is now empty. pop returns ${top}.`
      });
      continue;
    }
    a[0] = last;
    let i = 0;
    snap({
      kind: "move", op, anchors: ["pop.last"], notes: { "pop.last": `a[0] = a[${a.length}] = ${last.v}, size = ${a.length}` },
      title: `Move the last item, ${last.v}, to the root`, idea: "Filling the hole from the end keeps the tree complete. Only the order may now be broken.",
      text: `The last item, ${last.v}, moves from a[${a.length}] into a[0]. The tree is complete again, but ${last.v} may be larger than its children. Heap: ${arr()}.`
    }, { states: { 0: "active" }, i: 0 });

    for (;;) {
      const l = 2 * i + 1, r = l + 1;
      let m = i;
      if (l < a.length && a[l].v < a[m].v) m = l;
      if (r < a.length && a[r].v < a[m].v) m = r;
      const kids = [l, r].filter((k) => k < a.length);
      const atEnd = (k: number) => 2 * k + 1 >= a.length;
      if (m === i) {
        snap({
          kind: "check", op, ret: String(top), anchors: ["down.cmp", "down.stop", "pop.ret"],
          notes: { "down.cmp": kids.length ? `children ${kids.map((k) => a[k].v).join(", ")}` : "no children", "down.stop": `${a[i].v} is smallest, stop`, "pop.ret": `return ${top}` },
          title: kids.length ? `${a[i].v} is no larger than its children` : `${a[i].v} has no children`,
          idea: "Sift-down stops when the item is no larger than both children, or reaches the bottom.",
          text: `${kids.length ? `${a[i].v} is no larger than ${kids.map((k) => a[k].v).join(" or ")}, so the heap rule holds.` : `${a[i].v} is at the bottom.`} pop returns ${top}. Heap: ${arr()}.`
        }, { states: { [i]: "active", ...Object.fromEntries(kids.map((k) => [k, "compare" as BlockState])) }, edges: kids, i });
        break;
      }
      swap(i, m);
      const done = atEnd(m);
      snap({
        kind: "move", op, ...(done ? { ret: String(top) } : {}), anchors: ["down.cmp", "down.swap", ...(done ? ["pop.ret"] : [])],
        notes: { "down.cmp": `children ${kids.map((k) => (k === m ? a[i].v : a[k].v)).join(", ")}, smallest ${a[i].v}`, "down.swap": `swap a[${i}], a[${m}], i = ${m}`, ...(done ? { "pop.ret": `return ${top}` } : {}) },
        title: `Swap ${a[m].v} down past ${a[i].v}`, idea: "Swap with the smaller child, so the new parent is no larger than the other child either.",
        text: `The smaller child is ${a[i].v}, and it is smaller than ${a[m].v}, so they swap. ${done ? `${a[m].v} has reached the bottom, so pop returns ${top}.` : `${a[m].v} is now at a[${m}].`} Heap: ${arr()}.`
      }, { states: { [m]: "active", [i]: "compare" }, edges: [m], i: m });
      if (done) break;
      i = m;
    }
  }

  op = null;
  snap({
    kind: "recap", op: null, anchors: [], notes: {},
    title: "What happened",
    idea: "Push and pop each walk one path of a tree with log n levels, so both are O(log n). Peeking at the minimum is O(1).",
    text: `${popped.length ? `The pops came out as ${popped.join(", ")}: smallest first.` : "Nothing was popped."} ${a.length ? `The heap still holds ${arr()}. The array is not sorted, but every parent is no larger than its children.` : "The heap ends empty."}`
  });
  return steps;
}

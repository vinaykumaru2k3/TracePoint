import type { ParseResult, Step } from "../../engine/types";
import { MAX_VALUE } from "../parseOps";

export const ARRAY_CAP = 7;

export interface ArrayOp { name: "get" | "append" | "insert" | "remove"; i?: number; v?: number }

export interface ArrayState {
  cap: number;
  /** Raw slots: null was never written; slots at or past size are stale. */
  data: (number | null)[];
  size: number;
  /** Slot the step reads or writes, and the slot a shift copied from. */
  at: number;
  from: number;
  mode: "read" | "write" | "shift" | "gone" | null;
}

const ARGS: Record<ArrayOp["name"], number> = { get: 1, append: 1, insert: 2, remove: 1 };

/** "append 3, get 1, insert 1 7, remove 0". Indexes and values are whole numbers. */
export function parseArrayOps(text: string): ParseResult<ArrayOp[]> {
  const t = text.toLowerCase().replace(/[(),;]/g, " ").split(/\s+/).filter(Boolean);
  const ops: ArrayOp[] = [];
  for (let k = 0; k < t.length; k++) {
    const name = (t[k] === "add" || t[k] === "push" ? "append" : t[k] === "delete" ? "remove" : t[k]) as ArrayOp["name"];
    if (!(name in ARGS)) return { ok: false, error: `Unknown operation "${t[k]}". Use get, append, insert, remove.` };
    const nums: number[] = [];
    for (let a = 0; a < ARGS[name]; a++) {
      const raw = t[++k];
      if (raw === undefined || !/^\d{1,3}$/.test(raw) || Number(raw) > MAX_VALUE) {
        return { ok: false, error: name === "insert" ? `insert needs an index and a value, like "insert 1 7".` : name === "append" ? `append needs a value from 0 to ${MAX_VALUE}, like "append 5".` : `${name} needs an index, like "${name} 2".` };
      }
      nums.push(Number(raw));
    }
    ops.push(name === "append" ? { name, v: nums[0] } : name === "insert" ? { name, i: nums[0], v: nums[1] } : { name, i: nums[0] });
  }
  if (!ops.length) return { ok: false, error: "Type at least one operation." };
  if (ops.length > 12) return { ok: false, error: "Keep it to 12 operations or fewer so the steps stay readable." };
  return { ok: true, input: ops };
}

/** Simulates a fixed array plus a size counter. Inserts and removes show each shift as its own step. */
export function generateArray(ops: ArrayOp[]): Step<ArrayState>[] {
  const cap = ARRAY_CAP;
  const data: (number | null)[] = Array(cap).fill(null);
  let size = 0;
  const snap = (s: Omit<Step<ArrayState>, "state">, extra: Partial<ArrayState> = {}): Step<ArrayState> => ({
    ...s, state: { cap, data: data.slice(), size, at: -1, from: -1, mode: null, ...extra }
  });

  const steps: Step<ArrayState>[] = [snap({
    kind: "problem", op: null, anchors: [], notes: {},
    title: "A row of numbered slots",
    idea: "An array is one block of memory. Slot i sits at a fixed distance from slot 0.",
    text: `An array of ${cap} int slots, all unused. A size counter says how many slots hold real items. Reading any slot is instant. Inserting or removing in the middle means moving the items after it.`
  })];

  for (const op of ops) {
    if (op.name === "get") {
      const i = op.i!;
      if (i >= size) {
        steps.push(snap({
          kind: "empty", op: `get(${i})`, ret: "throws", retNote: "index out of range",
          anchors: ["get.sig", "get.check"], notes: { "get.check": `${i} >= size ${size}` },
          title: "Out of range", idea: "Valid indexes run from 0 to size - 1.",
          text: `get(${i}) fails: the array holds ${size} item${size === 1 ? "" : "s"}, so the last valid index is ${size - 1}.`
        }));
        continue;
      }
      steps.push(snap({
        kind: "peek", op: `get(${i})`, ret: String(data[i]),
        anchors: ["get.sig", "get.check", "get.return"], notes: { "get.return": `address = start + ${i} × 4 bytes, value ${data[i]}` },
        title: `Jump straight to slot ${i}`, idea: "Indexing is O(1). The address is computed, not searched for.",
        text: `get(${i}) returns ${data[i]}. The computer works out where slot ${i} lives from the start address and the slot size, so it costs the same for any index.`
      }, { at: i, mode: "read" }));
    } else if (op.name === "append") {
      const v = op.v!;
      if (size === cap) {
        steps.push(snap({
          kind: "empty", op: `append(${v})`, ret: "throws", retNote: "array is full",
          anchors: ["append.sig", "append.check"], notes: { "append.check": `size ${size} == capacity ${cap}` },
          title: "No room left", idea: "A fixed array cannot grow. Dynamic arrays copy into a bigger one.",
          text: `append(${v}) fails because all ${cap} slots are in use. An ArrayList or Python list would allocate a larger array and copy everything over.`
        }));
        continue;
      }
      data[size] = v;
      size++;
      steps.push(snap({
        kind: "add", op: `append(${v})`, ret: "void",
        anchors: ["append.sig", "append.check", "append.write"], notes: { "append.write": `data[${size - 1}] = ${v}, size becomes ${size}` },
        title: `Append ${v} at the end`, idea: "Appending writes one slot. Nothing else moves, so it is O(1).",
        text: `append(${v}) writes into slot ${size - 1}, the first unused one, and size goes up to ${size}.`
      }, { at: size - 1, mode: "write" }));
    } else if (op.name === "insert") {
      const { i, v } = op as Required<ArrayOp>;
      if (size === cap || i > size) {
        steps.push(snap({
          kind: "empty", op: `insert(${i}, ${v})`, ret: "throws", retNote: size === cap ? "array is full" : "index out of range",
          anchors: ["insert.sig", "insert.check"], notes: { "insert.check": size === cap ? `size ${size} == capacity` : `${i} > size ${size}` },
          title: size === cap ? "No room to insert" : "Out of range",
          idea: "Insert accepts indexes 0 to size. Index size is the same as append.",
          text: size === cap ? `insert(${i}, ${v}) fails: every slot is taken.` : `insert(${i}, ${v}) fails: with ${size} items the furthest insert point is ${size}.`
        }));
        continue;
      }
      for (let k = size; k > i; k--) {
        data[k] = data[k - 1];
        steps.push(snap({
          kind: "move", op: `shift ${data[k]} right`,
          anchors: ["insert.sig", "insert.check", "insert.shift"], notes: { "insert.shift": `data[${k}] = data[${k - 1}] = ${data[k]}` },
          title: k === size ? `Make room at slot ${i}` : `Keep shifting`,
          idea: "Every item after the insert point moves one slot right, starting from the end.",
          text: k === size
            ? `To put ${v} at slot ${i}, the ${size - i} item${size - i === 1 ? "" : "s"} from slot ${i} onward must move right. Start at the end so nothing is overwritten: ${data[k]} copies into slot ${k}.`
            : `${data[k]} copies from slot ${k - 1} into slot ${k}.`
        }, { at: k, from: k - 1, mode: "shift" }));
      }
      data[i] = v;
      size++;
      steps.push(snap({
        kind: "add", op: `insert(${i}, ${v})`, ret: "void",
        anchors: ["insert.sig", "insert.write"], notes: { "insert.write": `data[${i}] = ${v}, size becomes ${size}` },
        title: `Write ${v} into the gap`, idea: "Insert costs O(n): the shifts grow with the number of items after the slot.",
        text: `Slot ${i} is free to overwrite now, so ${v} goes in and size becomes ${size}.`
      }, { at: i, mode: "write" }));
    } else {
      const i = op.i!;
      if (i >= size) {
        steps.push(snap({
          kind: "empty", op: `remove(${i})`, ret: "throws", retNote: "index out of range",
          anchors: ["remove.sig", "remove.check"], notes: { "remove.check": `${i} >= size ${size}` },
          title: "Nothing there", idea: "Valid indexes run from 0 to size - 1.",
          text: `remove(${i}) fails: there is no item at slot ${i}.`
        }));
        continue;
      }
      const gone = data[i]!;
      for (let k = i; k < size - 1; k++) {
        data[k] = data[k + 1];
        steps.push(snap({
          kind: "move", op: `shift ${data[k]} left`,
          anchors: ["remove.sig", "remove.check", "remove.shift"], notes: { "remove.shift": `data[${k}] = data[${k + 1}] = ${data[k]}` },
          title: k === i ? `Close the gap at slot ${i}` : "Keep shifting",
          idea: "Every item after the removed one moves one slot left, starting from the gap.",
          text: k === i
            ? `remove(${i}) takes out ${gone}. The items after it slide left to close the gap: ${data[k]} copies into slot ${k}.`
            : `${data[k]} copies from slot ${k + 1} into slot ${k}.`
        }, { at: k, from: k + 1, mode: "shift" }));
      }
      size--;
      steps.push(snap({
        kind: "remove", op: `remove(${i})`, ret: String(gone),
        anchors: ["remove.sig", "remove.done"], notes: { "remove.done": `size becomes ${size}, returns ${gone}` },
        title: "Shrink by one", idea: "Removing from the end is O(1). Removing from the front is O(n).",
        text: `size drops to ${size}. ${size < cap && data[size] !== null ? `Slot ${size} still holds an old ${data[size]}, but it is past size, so it no longer counts.` : ""}`
      }, { at: size, mode: "gone" }));
    }
  }

  steps.push(snap({
    kind: "recap", op: null, anchors: [], notes: {},
    title: "What happened",
    idea: "Fast to read anywhere, fast to add at the end, slow to insert or remove in the middle.",
    text: `The array ends with ${size} item${size === 1 ? "" : "s"}. get and append never moved anything. insert and remove had to shift every item after the slot they touched.`
  }));
  return steps;
}

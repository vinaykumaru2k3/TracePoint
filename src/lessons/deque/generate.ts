import type { Item, Step } from "../../engine/types";
import type { Op } from "../parseOps";

export const DEQUE_CAP = 6;

export interface DequeState {
  cap: number;
  /** Front to back. */
  items: Item[];
  arr: (number | null)[];
  head: number;
  size: number;
  hl: number | null;
  mode: "front" | "back" | "peek" | null;
  /** Slot the step touched, or -1. */
  cell: number;
  /** The step's index moved past an end of the array and wrapped. */
  wrapped?: boolean;
}

const mod = (a: number, m: number) => ((a % m) + m) % m;

/** Simulates a circular-array deque: both ends grow and shrink in O(1). */
export function generateDeque(ops: Op[]): Step<DequeState>[] {
  const cap = DEQUE_CAP;
  let nextId = 1, items: Item[] = [], head = 0, size = 0;
  const arr: (number | null)[] = Array(cap).fill(null);
  const snap = (s: Omit<Step<DequeState>, "state">, extra: Partial<DequeState> = {}): Step<DequeState> => ({
    ...s, state: { cap, items: items.slice(), arr: arr.slice(), head, size, hl: null, mode: null, cell: -1, ...extra }
  });

  const steps: Step<DequeState>[] = [snap({
    kind: "problem", op: null, anchors: [], notes: {},
    title: "A queue with two doors",
    idea: "A deque adds and removes at both ends. A circular array makes all four O(1).",
    text: `An empty deque over ${cap} array slots. head marks the front item and size counts the items. The back is at (head + size - 1) mod ${cap}. Moving past either end of the array wraps around.`
  })];

  const full = (op: string, sig: string) => steps.push(snap({
    kind: "empty", op, ret: "throws", retNote: "deque is full",
    anchors: [sig, `${sig.split(".")[0]}.check`], notes: { [`${sig.split(".")[0]}.check`]: `size ${size} == capacity ${cap}` },
    title: "No room left", idea: "A fixed ring can fill up. Java's ArrayDeque doubles its array instead.",
    text: `${op} fails because all ${cap} slots hold items.`
  }));
  const empty = (op: string, sig: string) => steps.push(snap({
    kind: "empty", op, ret: "throws", retNote: "deque is empty",
    anchors: [sig, `${sig.split(".")[0]}.check`], notes: { [`${sig.split(".")[0]}.check`]: "size is 0" },
    title: "Nothing to remove", idea: "Check isEmpty() before removing from either end.",
    text: `${op} on an empty deque has nothing to return, so it throws.`
  }));

  for (const { name, v = 0 } of ops) {
    if (name === "pushfront") {
      if (size === cap) { full(`pushFront(${v})`, "pushFront.sig"); continue; }
      const old = head;
      head = mod(head - 1, cap);
      arr[head] = v;
      size++;
      const it = { id: nextId++, v };
      items = [it, ...items];
      steps.push(snap({
        kind: "add", op: `pushFront(${v})`, ret: "void",
        anchors: ["pushFront.sig", "pushFront.check", "pushFront.move", "pushFront.write"],
        notes: { "pushFront.move": `head = (${old} - 1) mod ${cap} = ${head}`, "pushFront.write": `data[${head}] = ${v}, size = ${size}` },
        title: `Add ${v} at the front`,
        idea: "The front grows by stepping head backwards. Nothing else moves.",
        text: `head steps back from ${old} to ${head}${old === 0 ? `, wrapping from slot 0 to the last slot` : ""}, and ${v} is written there. It is now the front item.`
      }, { hl: it.id, mode: "front", cell: head, wrapped: old === 0 }));
    } else if (name === "pushback") {
      if (size === cap) { full(`pushBack(${v})`, "pushBack.sig"); continue; }
      const at = (head + size) % cap;
      arr[at] = v;
      size++;
      const it = { id: nextId++, v };
      items = [...items, it];
      steps.push(snap({
        kind: "add", op: `pushBack(${v})`, ret: "void",
        anchors: ["pushBack.sig", "pushBack.check", "pushBack.write"],
        notes: { "pushBack.write": `data[(${head} + ${size - 1}) mod ${cap}] = data[${at}] = ${v}` },
        title: `Add ${v} at the back`,
        idea: "The back is computed from head and size, so pushBack only writes one slot.",
        text: `The slot after the back is (${head} + ${size - 1}) mod ${cap} = ${at}. ${v} goes there and size becomes ${size}.`
      }, { hl: it.id, mode: "back", cell: at, wrapped: head + size - 1 >= cap }));
    } else if (name === "popfront") {
      if (size === 0) { empty("popFront()", "popFront.sig"); continue; }
      const gone = items[0], was = head;
      items = items.slice(1);
      head = (head + 1) % cap;
      size--;
      steps.push(snap({
        kind: "remove", op: "popFront()", ret: String(gone.v),
        anchors: ["popFront.sig", "popFront.check", "popFront.move"],
        notes: { "popFront.move": `returns data[${was}] = ${gone.v}, head = ${head}` },
        title: "Take from the front",
        idea: "Removing at the front moves head forward. The old value is left behind.",
        text: `popFront() returns ${gone.v} and head moves from ${was} to ${head}${was === cap - 1 ? ", wrapping to slot 0" : ""}.` +
          (size ? ` ${items[0].v} is the new front.` : " The deque is empty again.")
      }, { mode: "front", cell: was, wrapped: was === cap - 1 }));
    } else if (name === "popback") {
      if (size === 0) { empty("popBack()", "popBack.sig"); continue; }
      const gone = items[items.length - 1], at = (head + size - 1) % cap;
      items = items.slice(0, -1);
      size--;
      steps.push(snap({
        kind: "remove", op: "popBack()", ret: String(gone.v),
        anchors: ["popBack.sig", "popBack.check", "popBack.read"],
        notes: { "popBack.read": `back = (${head} + ${size}) mod ${cap} = ${at}, returns ${gone.v}` },
        title: "Take from the back",
        idea: "Removing at the back only shrinks size. head stays put.",
        text: `popBack() returns ${gone.v} from slot ${at}. size drops to ${size}.` +
          (size ? ` ${items[items.length - 1].v} is the new back.` : " The deque is empty again.")
      }, { mode: "back", cell: at }));
    }
  }

  steps.push(snap({
    kind: "recap", op: null, anchors: [], notes: {},
    title: "What happened",
    idea: "A deque works as a stack, a queue, or both. Every end operation is O(1).",
    text: `The deque ended with ${size} item${size === 1 ? "" : "s"}. Pushing and popping at either end only moved head or changed size, so the cost never depended on how many items were stored.`
  }));
  return steps;
}

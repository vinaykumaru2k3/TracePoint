import type { Item, Step } from "../../engine/types";
import type { Op } from "../parseOps";

export const QUEUE_CAP = 4;

export interface QueueState {
  cap: number;
  items: Item[];
  arr: (number | null)[];
  head: number;
  size: number;
  hl: number | null;
  mode: "in" | "out" | "peek" | null;
  cell: number;
  wrapped?: boolean;
}

/** Simulates ArrayQueue (circular buffer) and returns one snapshot per operation, plus a problem and a recap step. */
export function generateQueue(ops: Op[]): Step<QueueState>[] {
  const cap = QUEUE_CAP;
  let nextId = 1;
  let items: Item[] = [];
  const arr: (number | null)[] = Array(cap).fill(null);
  let head = 0, size = 0;

  const snap = (s: Omit<Step<QueueState>, "state">, extra: Partial<QueueState> = {}): Step<QueueState> => ({
    ...s,
    state: { cap, items: items.slice(), arr: arr.slice(), head, size, hl: null, mode: null, cell: -1, ...extra }
  });

  const steps: Step<QueueState>[] = [snap({
    kind: "problem", op: null, anchors: [], notes: {},
    title: "Start empty",
    idea: "A queue is an array plus a head index and a size.",
    text: "An empty queue. Items join at the rear and leave from the front. The class keeps them in a small circular int array with a head index and a size."
  })];

  for (const { name, v = 0 } of ops) {
    if (name === "offer") {
      if (size === cap) {
        steps.push(snap({
          kind: "empty", op: `offer(${v})`, ret: "throws", retNote: "queue is full",
          anchors: ["offer.sig", "offer.check"], notes: { "offer.check": `size is ${size}, the array has ${cap} slots, so it is full` },
          title: "No room left", idea: "A fixed array can fill up. Poll something first, or grow the array.",
          text: `offer(${v}) fails because all ${cap} slots are in use. This code throws instead of overwriting.`
        }));
        continue;
      }
      const oldSize = size, idx = (head + size) % cap, wrapped = head + size >= cap;
      arr[idx] = v;
      size++;
      const it = { id: nextId++, v };
      items = items.concat([it]);
      steps.push(snap({
        kind: "add", op: `offer(${v})`, ret: "void",
        anchors: ["offer.sig", "offer.check", "offer.write", "offer.size"],
        notes: {
          "offer.check": `size is ${oldSize}, array is not full`,
          "offer.write": `slot = (head ${head} + size ${oldSize}) % ${cap} = ${idx}, data[${idx}] = ${v}`,
          "offer.size": `size becomes ${size}`
        },
        title: wrapped ? `Wrap around to slot ${idx}` : "Join at the rear",
        idea: wrapped
          ? "At the end of the array the next write goes back to slot 0, so the array is used as a circle."
          : "The next free slot is (head + size) % capacity. Nothing shifts.",
        text: `offer(${v}) adds ${v} at the rear. Everything already waiting stays ahead of it.` +
          (wrapped ? " The slot index wrapped back to the start of the array. That is why it is called a circular buffer." : "")
      }, { hl: it.id, mode: "in", cell: idx, wrapped }));
    } else if (name === "peek") {
      if (size === 0) {
        steps.push(snap({
          kind: "empty", op: "peek()", ret: "null",
          anchors: ["peek.sig", "peek.return"], notes: { "peek.return": "size is 0, so returns null" },
          title: "Nothing to read", idea: "peek() signals empty with null, so always check the result.",
          text: "peek() on an empty queue returns null. Nothing was changed."
        }));
        continue;
      }
      const f = items[0];
      steps.push(snap({
        kind: "peek", op: "peek()", ret: String(f.v),
        anchors: ["peek.sig", "peek.return"],
        notes: { "peek.return": `size is ${size}, so returns data[head] = data[${head}] = ${f.v}` },
        title: "Read without removing",
        idea: "Peeking is free. It reads a value and changes nothing.",
        text: `peek() reads the front value, ${f.v}, and leaves it in place. The queue is unchanged.`
      }, { hl: f.id, mode: "peek", cell: head }));
    } else if (name === "poll") {
      if (size === 0) {
        steps.push(snap({
          kind: "empty", op: "poll()", ret: "null",
          anchors: ["poll.sig", "poll.check"], notes: { "poll.check": "size is 0, so returns null" },
          title: "Nothing to serve", idea: "poll() signals empty with null, so always check the result.",
          text: "poll() on an empty queue returns null. The standard Queue.remove() throws NoSuchElementException instead. Pick the one that fits how you handle an empty queue."
        }));
        continue;
      }
      const first = items[0], oh = head;
      items = items.slice(1);
      head = (head + 1) % cap;
      size--;
      steps.push(snap({
        kind: "remove", op: "poll()", ret: String(first.v),
        anchors: ["poll.sig", "poll.check", "poll.read", "poll.head", "poll.size", "poll.return"],
        notes: {
          "poll.check": `size is ${size + 1}, not empty`,
          "poll.read": `x = data[${oh}] = ${first.v}`,
          "poll.head": `head = (${oh} + 1) % ${cap} = ${head}`,
          "poll.size": `size becomes ${size}`,
          "poll.return": `returns ${first.v}`
        },
        title: "Serve the oldest",
        idea: "Poll only moves head forward. Nothing shifts, so it stays O(1).",
        text: `poll() removes and returns ${first.v}, the item that has waited longest. ` +
          (items.length ? `${items[0].v} is now at the front.` : "The queue is empty again.")
      }, { mode: "out", cell: oh }));
    }
  }

  steps.push(snap({
    kind: "recap", op: null, anchors: [], notes: {},
    title: "What happened",
    idea: "First in, first out. Every operation was O(1).",
    text: `The queue ended with ${items.length} item${items.length === 1 ? "" : "s"}. offer, poll and peek only moved the head index or the size, and nothing was ever shifted along the array.`
  }));
  return steps;
}

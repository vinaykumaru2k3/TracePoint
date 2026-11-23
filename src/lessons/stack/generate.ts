import type { Item, Step } from "../../engine/types";
import type { Op } from "../parseOps";

export const STACK_CAP = 6;

export interface StackState {
  cap: number;
  items: Item[];
  arr: (number | null)[];
  top: number;
  hl: number | null;
  mode: "in" | "out" | "peek" | null;
  /** Array slot the step touched, or -1. */
  cell: number;
  overwrote?: boolean;
}

/** Simulates ArrayStack and returns one snapshot per operation, plus a problem and a recap step. */
export function generateStack(ops: Op[]): Step<StackState>[] {
  const cap = STACK_CAP;
  let nextId = 1;
  let items: Item[] = [];
  const arr: (number | null)[] = Array(cap).fill(null);
  let top = -1;

  const snap = (s: Omit<Step<StackState>, "state">, extra: Partial<StackState> = {}): Step<StackState> => ({
    ...s,
    state: { cap, items: items.slice(), arr: arr.slice(), top, hl: null, mode: null, cell: -1, ...extra }
  });

  const steps: Step<StackState>[] = [snap({
    kind: "problem", op: null, anchors: [], notes: {},
    title: "Last in, first out",
    idea: "A stack is an array plus one index called top.",
    text: `Goal: build a stack where push, pop and peek each cost O(1). Items go on and come off the same end, called the top. The class keeps them in an int array of ${cap} slots and tracks the top index. It starts empty.`
  })];

  for (const { name, v = 0 } of ops) {
    if (name === "push") {
      if (top === cap - 1) {
        steps.push(snap({
          kind: "empty", op: `push(${v})`, ret: "throws", retNote: "stack is full",
          anchors: ["push.sig", "push.check"], notes: { "push.check": `top is ${top}, the array has ${cap} slots, so it is full` },
          title: "No room left", idea: "A fixed array can fill up. Check first, or grow the array.",
          text: `push(${v}) fails because all ${cap} slots are in use. This code throws instead of overwriting.`
        }));
        continue;
      }
      const oldTop = top;
      top++;
      const prev = arr[top];
      arr[top] = v;
      const it = { id: nextId++, v };
      items = items.concat([it]);
      steps.push(snap({
        kind: "add", op: `push(${v})`, ret: "void",
        anchors: ["push.sig", "push.check", "push.write"],
        notes: { "push.check": `top is ${oldTop}, array is not full`, "push.write": `top becomes ${top}, data[${top}] = ${v}` },
        title: `Place ${v} on top`,
        idea: "Only the top index moves. Older items are never touched.",
        text: `push(${v}) places ${v} on top. Nothing underneath has to move.` +
          (prev !== null ? ` It overwrites the stale ${prev} that an earlier pop left behind.` : "")
      }, { hl: it.id, mode: "in", cell: top, overwrote: prev !== null }));
    } else if (name === "peek") {
      if (top === -1) {
        steps.push(snap({
          kind: "empty", op: "peek()", ret: "throws", retNote: "stack is empty",
          anchors: ["peek.sig", "peek.check"], notes: { "peek.check": "top is -1, the stack is empty, so it throws" },
          title: "Nothing to read", idea: "Peeking an empty stack is an error, so check first.",
          text: "peek() on an empty stack has nothing to return, so this code throws."
        }));
        continue;
      }
      const t = items[items.length - 1];
      steps.push(snap({
        kind: "peek", op: "peek()", ret: String(t.v),
        anchors: ["peek.sig", "peek.check", "peek.return"],
        notes: { "peek.check": `top is ${top}, not empty`, "peek.return": `returns data[${top}] = ${t.v}, top stays ${top}` },
        title: "Read without removing",
        idea: "Peeking is free. It reads a value and changes nothing.",
        text: `peek() reads the top value, ${t.v}, and leaves it in place. The stack is unchanged.`
      }, { hl: t.id, mode: "peek", cell: top }));
    } else if (name === "pop") {
      if (top === -1) {
        steps.push(snap({
          kind: "empty", op: "pop()", ret: "throws", retNote: "stack is empty",
          anchors: ["pop.sig", "pop.check"], notes: { "pop.check": "top is -1, the stack is empty, so it throws" },
          title: "Nothing to remove", idea: "Check for empty first, or be ready to catch the exception.",
          text: "pop() on an empty stack has nothing to return. This code throws an exception, as Java and Python do. C++ `std::stack` does not check, so popping an empty one is undefined behaviour."
        }));
        continue;
      }
      const gone = items[items.length - 1], was = top;
      items = items.slice(0, -1);
      top--;
      steps.push(snap({
        kind: "remove", op: "pop()", ret: String(gone.v),
        anchors: ["pop.sig", "pop.check", "pop.return"],
        notes: { "pop.check": `top is ${was}, not empty`, "pop.return": `returns data[${was}] = ${gone.v}, then top becomes ${top}` },
        title: "Take the newest",
        idea: "Pop only moves top down. The old value stays in the array, ignored.",
        text: `pop() removes and returns ${gone.v}, the most recent item. ` +
          (items.length ? `${items[items.length - 1].v} is now the top.` : "The stack is empty again.") +
          " The old value stays in the array until something overwrites it."
      }, { mode: "out", cell: was }));
    }
  }

  steps.push(snap({
    kind: "recap", op: null, anchors: [], notes: {},
    title: "What happened",
    idea: "Last in, first out. Every operation was O(1).",
    text: `The stack ended with ${items.length} item${items.length === 1 ? "" : "s"}. push, pop and peek only ever touched the top index, so none of them depended on how many items were stored.`
  }));
  return steps;
}

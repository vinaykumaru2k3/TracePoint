import type { Step } from "../../engine/types";
import type { NumsInput } from "../parseOps";

export interface CallFrame { k: number; ret: number | null }
export interface CallStackState {
  n: number;
  frames: CallFrame[];
  /** Index of the frame that is running, or -1 when only main is left. */
  active: number;
  /** How many calls have been made so far. */
  calls: number;
  /** Value main received, once the stack is empty. */
  result: number | null;
}

const fact = (k: number): number => (k <= 1 ? 1 : k * fact(k - 1));

/** fact(n) the recursive way: every call pushes a frame, the base case turns around, every return pops one. */
export function generateCallStack({ nums }: NumsInput): Step<CallStackState>[] {
  const n = nums[0];
  let frames: CallFrame[] = [];
  let calls = 0;
  const snap = (s: Omit<Step<CallStackState>, "state">, extra: Partial<CallStackState> = {}): Step<CallStackState> => ({
    ...s, state: { n, frames: frames.map((f) => ({ ...f })), active: frames.length - 1, calls, result: null, ...extra }
  });

  const steps: Step<CallStackState>[] = [snap({
    kind: "problem", op: null, anchors: [], notes: {},
    title: `Compute fact(${n}) by calling itself`,
    idea: "A recursive call is an ordinary call: it gets its own frame on the call stack.",
    text: `fact(n) = n × fact(n - 1), and fact(0) = 1. main calls fact(${n}). Watch the frames pile up until the base case, then come off one by one.`
  })];

  for (let k = n; k >= 0; k--) {
    frames = [...frames, { k, ret: null }];
    calls++;
    const first = k === n;
    steps.push(snap({
      kind: "add", op: `fact(${k})`,
      anchors: first ? ["cs.main", "cs.sig"] : ["cs.rec", "cs.sig"],
      notes: first
        ? { "cs.main": `main calls fact(${n})`, "cs.sig": `new frame: n = ${k}` }
        : { "cs.rec": `fact(${k + 1}) waits for fact(${k})`, "cs.sig": `new frame: n = ${k}` },
      title: first ? `main calls fact(${k})` : `fact(${k + 1}) calls fact(${k})`,
      idea: first ? "Each call gets a frame holding its own copy of n." : "The caller is paused, not finished. Its frame stays on the stack, waiting.",
      text: first
        ? `A frame for fact(${k}) goes on the stack. It holds n = ${k} and the spot to return to in main.`
        : `fact(${k + 1}) can't finish until it knows fact(${k}), so it calls it. A new frame with n = ${k} goes on top. The stack is ${frames.length} deep.`
    }));
  }

  steps.push(snap({
    kind: "check", op: "n == 0?",
    anchors: ["cs.base"], notes: { "cs.base": "n = 0, so the base case applies" },
    title: "Hit the base case",
    idea: "The base case is the call that answers without calling again. Without it the stack would grow until it overflows.",
    text: `n is 0 now, so fact(0) doesn't recurse. This is as deep as the stack gets: ${frames.length} frame${frames.length === 1 ? "" : "s"}.`
  }));
  frames[frames.length - 1] = { k: 0, ret: 1 };
  steps.push(snap({
    kind: "found", op: "return 1", ret: "1", retNote: "base case",
    anchors: ["cs.base"], notes: { "cs.base": "fact(0) returns 1" },
    title: "fact(0) returns 1",
    idea: "The answer starts at the bottom of the recursion and travels back up.",
    text: n === 0 ? "fact(0) returns 1 straight to main." : "fact(0) returns 1 to fact(1), which has been waiting."
  }));

  for (let k = 1; k <= n; k++) {
    const sub = fact(k - 1), v = k * sub;
    frames = frames.slice(0, -1);
    frames[frames.length - 1] = { k, ret: v };
    steps.push(snap({
      kind: "remove", op: `return ${v}`, ret: String(v),
      anchors: ["cs.rec", "cs.ret"],
      notes: { "cs.rec": `fact(${k - 1}) gave back ${sub}, its frame is popped`, "cs.ret": `${k} × ${sub} = ${v}` },
      title: `fact(${k}) returns ${v}`,
      idea: "Frames come off in the reverse order they went on: last in, first out.",
      text: `fact(${k - 1})'s frame is popped. fact(${k}) picks up where it paused and returns ${k} × ${sub} = ${v}.`
    }));
  }

  const result = fact(n);
  frames = [];
  steps.push(snap({
    kind: "empty", op: `main gets ${result}`,
    anchors: ["cs.main"], notes: { "cs.main": `fact(${n}) = ${result}` },
    title: "Back in main",
    idea: "When the last frame pops, the stack is back where it started.",
    text: `fact(${n})'s frame is popped too. main receives ${result}, and only main is left running.`
  }, { result }));

  steps.push(snap({
    kind: "recap", op: null, anchors: [], notes: {},
    title: "What happened",
    idea: "Recursion depth is stack memory: fact(n) needs n + 1 frames, O(n) space.",
    text: `${calls} calls pushed ${calls} frames and the same number of returns popped them. Time is O(n), and the stack held up to ${n + 1} frames, so space is O(n) too.`
  }, { result }));
  return steps;
}

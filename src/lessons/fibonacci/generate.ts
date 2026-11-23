import type { Step } from "../../engine/types";
import type { BlockState } from "../../iso/IsoBlock";
import type { Cell } from "../../iso/CellRow";
import type { DPState } from "../dpkit";

export type FibState = DPState & {
  op: string | null;
  /** Calls made so far, memo hits so far, and the frames open right now (oldest first). */
  calls: number;
  hits: number;
  stack: number[];
  /** memo[k], or null while it is not computed. */
  memo: (number | null)[];
};

/** Top-down Fibonacci with a memo: each fib(k) is worked out once, then read back. */
export function generateFibonacci(n: number): Step<FibState>[] {
  const memo: (number | null)[] = Array.from({ length: n + 1 }, () => null);
  const stack: number[] = [];
  let calls = 0, hits = 0;
  const steps: Step<FibState>[] = [];

  const snap = (
    st: Omit<Step<FibState>, "state" | "op">,
    v: { op?: string; k?: number; mark?: Record<number, BlockState> } = {}
  ) => {
    const cells: Cell[] = memo.map((x, i) => ({ v: x, state: v.mark?.[i] }));
    const op = v.op ?? null;
    steps.push({
      ...st, op,
      state: {
        kind: "row", cells, name: "memo",
        ptrs: v.k !== undefined ? [{ at: v.k, label: "k" }] : [],
        strip: st.kind === "problem" ? undefined : {
          name: "stack", slots: n + 1,
          cells: stack.map((f, i) => ({ v: `fib(${f})`, state: i === stack.length - 1 ? "active" : undefined })),
          ptrs: stack.length ? [{ at: stack.length - 1, label: "top" }] : []
        },
        op, calls, hits, stack: stack.slice(), memo: memo.slice()
      }
    });
  };

  snap({
    kind: "problem", anchors: [], notes: {},
    title: "Do each sum once, then remember it",
    idea: "Plain recursion computes the same fib values again and again. A memo stores each answer the first time, so every value is worked out once.",
    text: `Fibonacci numbers start 0, 1, and each one is the sum of the two before it. To get fib(${n}) we call fib on smaller numbers. The memo row remembers each answer, and the stack shows the calls waiting for their children.`
  });

  const fib = (k: number): number => {
    calls++;
    stack.push(k);
    snap({
      kind: "add", anchors: k === n ? ["fib.init", "fib.sig"] : ["fib.sig"],
      notes: { "fib.sig": `fib(${k}), call ${calls}`, ...(k === n ? { "fib.init": `memo = [-1] * ${n + 1}` } : {}) },
      title: `Call fib(${k})`,
      idea: "Every call pushes a frame on the stack. It stays there until the call has an answer.",
      text: k === n
        ? `We ask for fib(${n}) with an empty memo. The call goes on the stack.`
        : `fib(${k}) goes on the stack, ${stack.length} deep now. It has to wait for the calls it makes.`
    }, { op: `call fib(${k})`, k });

    if (k < 2) {
      memo[k] = k;
      snap({
        kind: "check", anchors: ["fib.base"], notes: { "fib.base": `k = ${k} < 2, memo[${k}] = ${k}` },
        title: `fib(${k}) is a base case`,
        idea: "fib(0) is 0 and fib(1) is 1. They return at once, before the memo is even read.",
        text: `${k} is below 2, so the answer is ${k} itself. It is written to memo[${k}] and returned, and the frame leaves the stack. The memo was not read here, so this is not a hit.`,
        ret: String(k), retNote: `fib(${k}) = ${k}`
      }, { op: `base fib(${k})`, k, mark: { [k]: "active" } });
      stack.pop();
      return k;
    }

    if (memo[k] !== null) {
      hits++;
      const v = memo[k] as number;
      snap({
        kind: "found", anchors: ["fib.hit"], notes: { "fib.hit": `memo[${k}] = ${v}, no recursion` },
        title: `Memo hit: fib(${k}) = ${v}`,
        idea: "A value stored earlier is read back in one step. The whole subtree of calls under it is skipped.",
        text: `memo[${k}] already holds ${v}. fib(${k}) returns it at once and its frame leaves the stack. Without the memo this would repeat many calls.`,
        ret: String(v), retNote: `fib(${k}) = ${v} from the memo`
      }, { op: `hit fib(${k})`, k, mark: { [k]: "compare" } });
      stack.pop();
      return v;
    }

    const a = fib(k - 1);
    const b = fib(k - 2);
    memo[k] = a + b;
    snap({
      kind: "add", anchors: ["fib.store"], notes: { "fib.store": `memo[${k}] = ${a} + ${b} = ${a + b}` },
      title: `Store memo[${k}] = ${a + b}`,
      idea: "The sum is saved before the call returns, so nobody has to work it out again.",
      text: `Both children are back: fib(${k - 1}) = ${a} and fib(${k - 2}) = ${b}. Their sum ${a + b} goes into memo[${k}].`
    }, { op: `memo[${k}]=${a + b}`, k, mark: { [k]: "active" } });
    snap({
      kind: "remove", anchors: ["fib.ret"], notes: { "fib.ret": `return ${a + b}` },
      title: `fib(${k}) returns ${a + b}`,
      idea: "A call returns its answer to the one that made it, and its frame leaves the stack.",
      text: `fib(${k}) hands ${a + b} to its caller and its frame leaves the stack.`,
      ret: String(a + b), retNote: `fib(${k}) = ${a + b}`
    }, { op: `ret fib(${k})`, k, mark: { [k]: "found" } });
    stack.pop();
    return a + b;
  };

  const result = fib(n);
  snap({
    kind: "recap", anchors: [], notes: {},
    title: `fib(${n}) = ${result}`,
    idea: "With a memo each value is computed once, so the work grows with n, not with the size of the call tree.",
    text: `fib(${n}) = ${result} took ${calls} call${calls === 1 ? "" : "s"}, and ${hits} of them were memo hits. Without the memo the same answer would take far more calls. The memo uses n + 1 cells of memory.`
  }, { mark: { [n]: "found" } });
  return steps;
}

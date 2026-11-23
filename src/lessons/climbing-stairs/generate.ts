import type { Step } from "../../engine/types";
import type { BlockState } from "../../iso/IsoBlock";
import type { Cell } from "../../iso/CellRow";
import type { DPState } from "../dpkit";

export type StairsState = DPState & {
  op: string | null;
  /** The i being worked on, or null before the loop starts. */
  i: number | null;
  /** Cells written so far. */
  filled: number;
  /** ways[k], or null while it is not computed. */
  ways: (number | null)[];
};

/** Bottom-up climbing stairs: ways[i] = ways[i-1] + ways[i-2], filled from the bottom of the table up. */
export function generateClimbingStairs(n: number): Step<StairsState>[] {
  const ways: (number | null)[] = Array.from({ length: n + 1 }, () => null);
  let filled = 0;
  const steps: Step<StairsState>[] = [];

  const snap = (
    st: Omit<Step<StairsState>, "state" | "op">,
    v: { op?: string; i?: number; mark?: Record<number, BlockState> } = {}
  ) => {
    const cells: Cell[] = ways.map((x, k) => ({ v: x, state: v.mark?.[k] }));
    const op = v.op ?? null;
    steps.push({
      ...st, op,
      state: {
        kind: "row", cells, name: "ways",
        ptrs: v.i !== undefined ? [{ at: v.i, label: "i" }] : [],
        op, i: v.i ?? null, filled, ways: ways.slice()
      }
    });
  };

  snap({
    kind: "problem", anchors: [], notes: {},
    title: "Count the ways up the stairs",
    idea: "The number of ways to reach a stair is built from the numbers for the two stairs below it. Fill a table from the bottom and each cell is one addition.",
    text: `A staircase has ${n} stair${n === 1 ? "" : "s"}. Each move climbs 1 or 2 stairs. ways[i] counts the different ways to reach stair i. We fill the table from stair 0 up to stair ${n}.`
  });

  ways[0] = 1; ways[1] = 1; filled = 2;
  snap({
    kind: "add", anchors: ["stairs.init", "stairs.base"],
    notes: { "stairs.init": `ways = ${n + 1} cells`, "stairs.base": "ways[0] = ways[1] = 1" },
    title: "Base cases: ways[0] = ways[1] = 1",
    idea: "Start the table with the answers that need no sum. Everything after is built on them.",
    text: "There is one way to be at stair 0, which is to not move. There is one way to reach stair 1, a single 1-stair move. These two cells are filled by hand."
  }, { op: "ways[0..1]=1", mark: { 0: "active", 1: "active" } });

  for (let i = 2; i <= n; i++) {
    const a = ways[i - 1] as number, b = ways[i - 2] as number;
    snap({
      kind: "check", anchors: ["stairs.loop"], notes: { "stairs.loop": `i = ${i}, read ways[${i - 1}] and ways[${i - 2}]` },
      title: `Read ways[${i - 1}] = ${a} and ways[${i - 2}] = ${b}`,
      idea: "The last move onto stair i was either 1 stair or 2 stairs. So only the two cells just below can feed it.",
      text: `To reach stair ${i}, you came from stair ${i - 1} with a 1-stair move, or from stair ${i - 2} with a 2-stair move. Those cells hold ${a} and ${b}.`
    }, { op: `read ${i - 1},${i - 2}`, i, mark: { [i - 1]: "compare", [i - 2]: "compare" } });

    ways[i] = a + b; filled++;
    snap({
      kind: "add", anchors: ["stairs.fill"], notes: { "stairs.fill": `ways[${i}] = ${a} + ${b} = ${a + b}` },
      title: `Write ways[${i}] = ${a + b}`,
      idea: "Add the two counts. The two groups of ways cannot overlap, because they end with different moves.",
      text: `${a} + ${b} = ${a + b}, so there are ${a + b} ways to reach stair ${i}. It goes into ways[${i}].`
    }, { op: `ways[${i}]=${a + b}`, i, mark: { [i]: "active", [i - 1]: "compare", [i - 2]: "compare" } });
  }

  const result = ways[n] as number;
  const loops = n - 1;
  snap({
    kind: "recap", anchors: ["stairs.ret"], notes: { "stairs.ret": `return ${result}` },
    title: `ways(${n}) = ${result}`,
    idea: "Filling from the bottom needs no recursion. Each cell is written once, so the work grows with n.",
    text: `There are ${result} way${result === 1 ? "" : "s"} to climb ${n} stair${n === 1 ? "" : "s"}. The table has ${n + 1} cells, each written once, and the loop ran ${loops} time${loops === 1 ? "" : "s"}.`,
    ret: String(result), retNote: `ways(${n}) = ${result}`
  }, { op: `return ${result}`, mark: { [n]: "found" } });
  return steps;
}

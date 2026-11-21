import type { Step } from "../../engine/types";
import type { NumsInput } from "../parseOps";

export interface SubsetsState {
  items: number[];
  path: number[];
  /** Index of the item being decided, or items.length at a leaf. */
  depth: number;
  found: number[][];
  choice: "take" | "skip" | "undo" | "record" | null;
}

const fmt = (a: number[]) => `[${a.join(", ")}]`;

/** All subsets by backtracking: at each item, take it and go deeper, undo it, then skip it and go deeper. */
export function generateSubsets({ nums: items }: NumsInput): Step<SubsetsState>[] {
  const n = items.length;
  const path: number[] = [];
  const found: number[][] = [];
  const snap = (s: Omit<Step<SubsetsState>, "state">, depth: number, choice: SubsetsState["choice"]): Step<SubsetsState> => ({
    ...s, state: { items, path: path.slice(), depth, found: found.map((f) => f.slice()), choice }
  });

  const steps: Step<SubsetsState>[] = [snap({
    kind: "problem", op: null, anchors: [], notes: {},
    title: `List every subset of ${fmt(items)}`,
    idea: "Backtracking makes one choice per item, explores it fully, then undoes it and tries the other choice.",
    text: `Each item is either in or out, so there are 2^${n} = ${2 ** n} subsets. We walk the items left to right with one path and change it in place: take, go deeper, undo, skip, go deeper.`
  }, 0, null)];

  const dfs = (i: number) => {
    if (i === n) {
      found.push(path.slice());
      steps.push(snap({
        kind: "found", op: "record", ret: fmt(path),
        anchors: ["bt.sig", "bt.leaf"], notes: { "bt.leaf": `i = ${n}, save a copy of ${fmt(path)}` },
        title: `Record ${fmt(path)}`,
        idea: "Every item has been decided, so the path is one complete subset. Save a copy, because the path keeps changing.",
        text: `All ${n} items are decided. ${path.length ? `The path holds ${fmt(path)}` : "The path is empty"}, so that is subset ${found.length} of ${2 ** n}. Now we return and undo the last choice.`
      }, i, "record"));
      return;
    }
    const v = items[i];
    path.push(v);
    steps.push(snap({
      kind: "add", op: `take ${v}`,
      anchors: ["bt.sig", "bt.take"], notes: { "bt.take": `path = ${fmt(path)}, go to i = ${i + 1}` },
      title: `Take ${v}`,
      idea: "Make a choice, then recurse to decide the next item with that choice in place.",
      text: `Put ${v} on the path, which is now ${fmt(path)}. The next call decides item ${i + 1}${i + 1 === n ? ", which is past the end" : ""}.`
    }, i, "take"));
    dfs(i + 1);
    path.pop();
    steps.push(snap({
      kind: "remove", op: `undo ${v}`,
      anchors: ["bt.undo"], notes: { "bt.undo": `path back to ${fmt(path)}` },
      title: `Undo ${v}`,
      idea: "Undoing the choice restores the path exactly as it was, so the other branch starts clean.",
      text: `Everything with ${v} at this spot is done. Pop ${v} off the path, back to ${fmt(path)}.`
    }, i, "undo"));
    steps.push(snap({
      kind: "move", op: `skip ${v}`,
      anchors: ["bt.skip"], notes: { "bt.skip": `path stays ${fmt(path)}, go to i = ${i + 1}` },
      title: `Skip ${v}`,
      idea: "The second branch leaves the item out and goes deeper with the path unchanged.",
      text: `Now explore every subset without ${v}. The path stays ${fmt(path)} and the next call decides item ${i + 1}.`
    }, i, "skip"));
    dfs(i + 1);
  };
  dfs(0);

  steps.push(snap({
    kind: "recap", op: null, anchors: [], notes: {},
    title: "What happened",
    idea: "Choose, explore, unchoose: one path, changed and restored, visits every combination.",
    text: `${found.length} subsets, one per leaf of the take/skip tree. There are 2^n leaves and copying each one costs up to n, so the time is O(n · 2^n). The recursion is only n + 1 deep.`
  }, n, null));
  return steps;
}

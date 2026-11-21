import type { Step } from "../../engine/types";
import type { NumsInput } from "../parseOps";

export interface LinearState { nums: number[]; i: number; target: number; hit: boolean }

/** Check each cell left to right until one equals the target. */
export function generateLinear({ nums, k }: NumsInput): Step<LinearState>[] {
  const target = k ?? 0;
  const n = nums.length;
  const snap = (s: Omit<Step<LinearState>, "state">, i: number, hit = false): Step<LinearState> => ({ ...s, state: { nums, i, target, hit } });

  const steps: Step<LinearState>[] = [snap({
    kind: "problem", op: null, anchors: [], notes: {},
    title: `Find ${target} in the array`,
    idea: "With no order to rely on, the only way to know is to look at each cell.",
    text: `The array has ${n} values in no particular order. Check them one at a time from the left and stop at the first ${target}.`
  }, 0)];

  for (let i = 0; i < n; i++) {
    if (nums[i] === target) {
      steps.push(snap({
        kind: "found", op: `return ${i}`, ret: String(i),
        anchors: ["ls.sig", "ls.loop", "ls.cmp", "ls.hit"],
        notes: { "ls.cmp": `a[${i}] = ${nums[i]} equals ${target}`, "ls.hit": `returns ${i} after ${i + 1} check${i ? "s" : ""}` },
        title: `Found ${target} at index ${i}`,
        idea: "Linear search returns the first match. Cells after it are never looked at.",
        text: `a[${i}] is ${target}, so the search stops and returns ${i}. It took ${i + 1} of the ${n} possible checks.`
      }, i, true));
      break;
    }
    steps.push(snap({
      kind: "check", op: `a[${i}] == ${target}?`,
      anchors: ["ls.sig", "ls.loop", "ls.cmp"],
      notes: { "ls.cmp": `a[${i}] = ${nums[i]}, not ${target}` },
      title: `a[${i}] is ${nums[i]}, not ${target}`,
      idea: "One look rules out one cell. Nothing about it tells us where the target might be.",
      text: `${nums[i]} isn't ${target}. Move on to index ${i + 1}${i + 1 === n ? ", which is past the end" : ""}.`
    }, i));
  }

  if (!steps.some((s) => s.kind === "found")) {
    steps.push(snap({
      kind: "empty", op: "return -1", ret: "-1", retNote: "not found",
      anchors: ["ls.sig", "ls.none"], notes: { "ls.none": `checked all ${n} cells` },
      title: `${target} is not in the array`,
      idea: "Proving a value is absent costs the most: every cell has to be checked.",
      text: `All ${n} cells were checked and none held ${target}, so the search returns -1.`
    }, n));
  }

  steps.push(snap({
    kind: "recap", op: null, anchors: [], notes: {},
    title: "What happened",
    idea: "Linear search is O(n): the work grows with the length of the array.",
    text: `The worst case checks all ${n} cells, the best case checks one. It works on any array, sorted or not, and needs no extra memory.`
  }, steps[steps.length - 1].state.i, steps[steps.length - 1].state.hit));
  return steps;
}

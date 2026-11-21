import type { Step } from "../../engine/types";
import type { NumsInput } from "../parseOps";

export interface TwoPtrState {
  nums: number[];
  lo: number;
  hi: number;
  target: number;
  sum: number | null;
  /** Where the pair was found. */
  hit: boolean;
  /** Which pointer the last comparison told us to move. */
  moved: "lo" | "hi" | null;
}

/** Pair sum on a sorted array: compare the two ends and move one pointer inward per step. */
export function generateTwoPointers({ nums: raw, k }: NumsInput): Step<TwoPtrState>[] {
  const nums = raw.slice().sort((a, b) => a - b);
  const target = k ?? 0;
  const sorted = raw.every((v, i) => i === 0 || raw[i - 1] <= v);
  let lo = 0, hi = nums.length - 1;
  const snap = (s: Omit<Step<TwoPtrState>, "state">, extra: Partial<TwoPtrState> = {}): Step<TwoPtrState> => ({
    ...s, state: { nums, lo, hi, target, sum: null, hit: false, moved: null, ...extra }
  });

  const steps: Step<TwoPtrState>[] = [snap({
    kind: "problem", op: null, anchors: [], notes: {},
    title: `Find two numbers that add to ${target}`,
    idea: "Sorted order lets one comparison rule out a whole end of the array.",
    text: `${sorted ? "The array is sorted." : `The input was sorted first: ${nums.join(", ")}.`} Put lo at the smallest value and hi at the largest. Their sum tells us which end to give up on. Checking every pair would take up to ${(nums.length * (nums.length - 1)) / 2} checks.`
  })];

  let checks = 0;
  while (lo < hi) {
    const sum = nums[lo] + nums[hi];
    checks++;
    if (sum === target) {
      steps.push(snap({
        kind: "found", op: `${nums[lo]} + ${nums[hi]}`, ret: `[${lo}, ${hi}]`,
        anchors: ["tp.sig", "tp.loop", "tp.sum", "tp.found"],
        notes: { "tp.sum": `${nums[lo]} + ${nums[hi]} = ${sum}`, "tp.found": `returns [${lo}, ${hi}] after ${checks} checks` },
        title: "Found the pair",
        idea: "Each check removed one candidate, so at most n - 1 checks were needed: O(n).",
        text: `${nums[lo]} + ${nums[hi]} = ${target}. The answer is indexes ${lo} and ${hi}, found in ${checks} check${checks === 1 ? "" : "s"}.`
      }, { sum, hit: true }));
      break;
    }
    const small = sum < target;
    steps.push(snap({
      kind: "check", op: `${nums[lo]} + ${nums[hi]}`,
      anchors: ["tp.sig", "tp.loop", "tp.sum", small ? "tp.lo" : "tp.hi"],
      notes: { "tp.sum": `${nums[lo]} + ${nums[hi]} = ${sum}, target ${target}`, [small ? "tp.lo" : "tp.hi"]: small ? `too small, lo becomes ${lo + 1}` : `too big, hi becomes ${hi - 1}` },
      title: small ? "Too small: move lo right" : "Too big: move hi left",
      idea: small
        ? `Even the largest partner leaves ${nums[lo]} short, so ${nums[lo]} cannot be in any pair.`
        : `Even the smallest partner makes ${nums[hi]} overshoot, so ${nums[hi]} cannot be in any pair.`,
      text: small
        ? `${nums[lo]} + ${nums[hi]} = ${sum}, less than ${target}. A bigger sum needs a bigger left value, so lo steps right.`
        : `${nums[lo]} + ${nums[hi]} = ${sum}, more than ${target}. A smaller sum needs a smaller right value, so hi steps left.`
    }, { sum, moved: small ? "lo" : "hi" }));
    if (small) lo++; else hi--;
  }
  if (lo >= hi) {
    steps.push(snap({
      kind: "empty", op: "lo meets hi", ret: "[]", retNote: "no pair",
      anchors: ["tp.sig", "tp.loop", "tp.none"], notes: { "tp.none": `lo = ${lo}, hi = ${hi}, nothing left to pair` },
      title: "The pointers met",
      idea: "When lo reaches hi, every candidate has been ruled out.",
      text: `No two numbers add to ${target}. ${checks} checks were enough to prove it.`
    }));
  }

  steps.push(snap({
    kind: "recap", op: null, anchors: [], notes: {},
    title: "What happened",
    idea: "Two pointers from opposite ends turn an O(n²) pair search into O(n).",
    text: `Each check moved one pointer inward, so the loop ran at most n - 1 = ${nums.length - 1} times. The trick only works because the array is sorted.`
  }));
  return steps;
}

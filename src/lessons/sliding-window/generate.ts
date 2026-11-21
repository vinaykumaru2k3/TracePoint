import type { ParseResult, Step } from "../../engine/types";
import { parseNums, type NumsInput } from "../parseOps";

export interface WindowState {
  nums: number[];
  k: number;
  /** Window covers [lo, hi]; hi is -1 before anything is added. */
  lo: number;
  hi: number;
  sum: number;
  best: number | null;
  bestLo: number;
  /** Index that just left the window, or -1. */
  out: number;
  improved: boolean;
}

export function parseWindow(text: string): ParseResult<NumsInput> {
  const r = parseNums(text, { minLen: 2, maxLen: 9, key: "k", keyMin: 1, keyMax: 9, keyRequired: true });
  if (r.ok && r.input.k! > r.input.nums.length) return { ok: false, error: `k can be at most the array length, ${r.input.nums.length}.` };
  if (r.ok && r.input.k === r.input.nums.length) return { ok: false, error: "Make k smaller than the array so the window has room to slide." };
  return r;
}

/** Maximum sum of k consecutive items: build the first window, then slide it one item at a time. */
export function generateWindow({ nums, k: kk }: NumsInput): Step<WindowState>[] {
  const k = kk ?? 1, n = nums.length;
  let sum = 0, best: number | null = null, bestLo = 0;
  const snap = (s: Omit<Step<WindowState>, "state">, extra: Partial<WindowState> = {}): Step<WindowState> => ({
    ...s, state: { nums, k, lo: 0, hi: -1, sum, best, bestLo, out: -1, improved: false, ...extra }
  });

  const steps: Step<WindowState>[] = [snap({
    kind: "problem", op: null, anchors: [], notes: {},
    title: `Best sum of ${k} in a row`,
    idea: "Neighbouring windows share all but two items, so reuse the sum instead of recomputing it.",
    text: `Find the largest sum of ${k} consecutive numbers. Summing every window from scratch costs ${k} additions per window. Sliding the window costs two: add the item that enters, subtract the one that leaves.`
  })];

  for (let i = 0; i < k; i++) {
    sum += nums[i];
    if (i === k - 1) { best = sum; bestLo = 0; }
    steps.push(snap({
      kind: "add", op: `sum += a[${i}]`, anchors: ["sw.sig", "sw.first"],
      notes: { "sw.first": `i = ${i}, sum = ${sum}` },
      title: i === 0 ? "Build the first window" : i === k - 1 ? "First window complete" : `Add a[${i}]`,
      idea: i === k - 1 ? "The first window is the only one summed in full." : "The first window is built one item at a time.",
      text: i === k - 1
        ? `The first ${k} items sum to ${sum}. That is the best so far.`
        : `Add ${nums[i]}. The window holds ${i + 1} of ${k} items, sum ${sum}.`
    }, { hi: i, improved: i === k - 1 }));
  }

  for (let i = k; i < n; i++) {
    const before = sum;
    sum += nums[i] - nums[i - k];
    const improved = sum > best!;
    if (improved) { best = sum; bestLo = i - k + 1; }
    steps.push(snap({
      kind: "move", op: `+a[${i}] -a[${i - k}]`,
      anchors: ["sw.sig", "sw.slide", "sw.best"],
      notes: { "sw.slide": `${before} + ${nums[i]} - ${nums[i - k]} = ${sum}`, "sw.best": improved ? `${sum} beats the old best, best = ${sum}` : `best stays ${best}` },
      title: improved ? "New best window" : "Slide one step",
      idea: improved ? "Track the best as you go, so one pass is enough." : "One add and one subtract per slide, whatever k is.",
      text: `${nums[i]} enters on the right and ${nums[i - k]} leaves on the left. The sum goes from ${before} to ${sum}.` +
        (improved ? ` That beats the best so far.` : ` The best is still ${best}.`)
    }, { lo: i - k + 1, hi: i, out: i - k, improved }));
  }

  steps.push(snap({
    kind: "found", op: `maxSum(a, ${k})`, ret: String(best), anchors: ["sw.sig", "sw.return"],
    notes: { "sw.return": `best window starts at ${bestLo}, sum ${best}` },
    title: "Return the best",
    idea: "Every item entered once and left once, so the whole scan is O(n).",
    text: `The best window is a[${bestLo}..${bestLo + k - 1}] = ${nums.slice(bestLo, bestLo + k).join(" + ")} = ${best}.`
  }, { lo: bestLo, hi: bestLo + k - 1 }));

  steps.push(snap({
    kind: "recap", op: null, anchors: [], notes: {},
    title: "What happened",
    idea: "A sliding window keeps a running answer and updates it at both edges.",
    text: `${n - k + 1} windows were checked with ${k + 2 * (n - k)} additions and subtractions in total. Recomputing each window would have taken ${(n - k + 1) * k}.`
  }, { lo: bestLo, hi: bestLo + k - 1 }));
  return steps;
}

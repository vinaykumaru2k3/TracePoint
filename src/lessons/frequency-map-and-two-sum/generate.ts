import type { Step } from "../../engine/types";
import type { NumsInput } from "../parseOps";

export const FM_MAX = 8;

export interface FmState {
  nums: number[];
  target: number;
  phase: "count" | "two" | null;
  i: number | null;
  /** Insertion-ordered map entries. */
  count: [number, number][];
  seen: [number, number][];
  /** Key touched this step, in the current phase's map. */
  key: number | null;
  need: number | null;
  pair: [number, number] | null;
}

/** Builds a frequency map, then solves two-sum in one pass with a value → index map. */
export function generateFm({ nums, k }: NumsInput): Step<FmState>[] {
  const target = k ?? 0;
  const count = new Map<number, number>(), seen = new Map<number, number>();
  const snap = (s: Omit<Step<FmState>, "state">, x: Partial<FmState> = {}): Step<FmState> => ({
    ...s, state: { nums, target, phase: null, i: null, count: [...count], seen: [...seen], key: null, need: null, pair: null, ...x }
  });
  const fmt = (m: Map<number, number>) => (m.size ? "{" + [...m].map(([a, b]) => `${a}: ${b}`).join(", ") + "}" : "{}");

  const steps: Step<FmState>[] = [snap({
    kind: "problem", op: null, anchors: [], notes: {},
    title: "Let a map remember for you",
    idea: "A hash map answers \"have I seen this?\" in O(1), which turns many O(n²) loops into O(n).",
    text: `Two jobs on [${nums.join(", ")}]. First count how often each value appears. Then find two indexes whose values add up to ${target}, without trying every pair.`
  })];

  steps.push(snap({
    kind: "check", op: "count(nums)", anchors: ["count.sig"], notes: {},
    title: "Start with an empty count map", idea: "Keys are values from the array, and each maps to how many times it has appeared.",
    text: "count is empty. Walk the array once and bump the counter for each value."
  }, { phase: "count" }));
  nums.forEach((x, i) => {
    const before = count.get(x);
    count.set(x, (before ?? 0) + 1);
    steps.push(snap({
      kind: "add", op: "count(nums)", anchors: ["count.loop", "count.bump"],
      notes: { "count.bump": before === undefined ? `count[${x}] = 1 (new key)` : `count[${x}] = ${before} + 1 = ${before + 1}` },
      title: before === undefined ? `First ${x}` : `Another ${x}`,
      idea: before === undefined ? "merge inserts 1 for a key it has not seen." : "merge adds 1 to the stored count.",
      text: `nums[${i}] = ${x}. ${before === undefined ? `${x} is a new key, so it starts at 1.` : `${x} was seen ${before} time${before === 1 ? "" : "s"} before, so it becomes ${before + 1}.`}`
    }, { phase: "count", i, key: x }));
  });
  const top = [...count].reduce((a, b) => (b[1] > a[1] ? b : a));
  steps.push(snap({
    kind: "check", op: "count(nums)", ret: `${count.size} keys`, anchors: ["count.return"], notes: { "count.return": fmt(count) },
    title: "Counts are ready", idea: "One pass, one O(1) update per element: O(n) total.",
    text: `${nums.length} values, ${count.size} distinct. ${top[1] > 1 ? `${top[0]} is the most common, appearing ${top[1]} times.` : "Every value appears once."}`
  }, { phase: "count" }));

  steps.push(snap({
    kind: "check", op: `twoSum(nums, ${target})`, anchors: ["two.sig"], notes: {},
    title: `Now find a pair that sums to ${target}`,
    idea: "For each value x, the partner it needs is target - x. A map of earlier values finds it instantly.",
    text: "seen maps each value to its index. It starts empty."
  }, { phase: "two" }));

  let found = false;
  for (let i = 0; i < nums.length; i++) {
    const x = nums[i], need = target - x, j = seen.get(need);
    if (j !== undefined) {
      steps.push(snap({
        kind: "found", op: `twoSum(nums, ${target})`, ret: `[${j}, ${i}]`, anchors: ["two.loop", "two.need", "two.check", "two.found"],
        notes: { "two.need": `need = ${target} - ${x} = ${need}`, "two.found": `seen[${need}] = ${j}` },
        title: `${need} was seen at index ${j}`, idea: "Each element was looked at once. Brute force would test every pair.",
        text: `nums[${i}] = ${x} needs ${need}, and seen says ${need} is at index ${j}. ${nums[j]} + ${x} = ${target}, so return [${j}, ${i}].`
      }, { phase: "two", i, key: need, need, pair: [j, i] }));
      found = true;
      break;
    }
    steps.push(snap({
      kind: "check", op: `twoSum(nums, ${target})`, anchors: ["two.loop", "two.need", "two.check"],
      notes: { "two.need": `need = ${target} - ${x} = ${need}`, "two.check": `${need} not in seen` },
      title: `${x} needs ${need}`, idea: "One map lookup replaces a whole inner loop.",
      text: `nums[${i}] = ${x}, so the partner must be ${target} - ${x} = ${need}. ${need} has not appeared yet.`
    }, { phase: "two", i, need }));
    const had = seen.has(x);
    seen.set(x, i);
    steps.push(snap({
      kind: "add", op: `twoSum(nums, ${target})`, anchors: ["two.store"], notes: { "two.store": `seen[${x}] = ${i}` },
      title: `Remember ${x} at index ${i}`, idea: "Store after checking, so an element never pairs with itself.",
      text: had ? `${x} was already in seen; its index is updated to ${i}.` : `Later values can now find ${x} at index ${i}.`
    }, { phase: "two", i, key: x }));
  }
  if (!found) steps.push(snap({
    kind: "check", op: `twoSum(nums, ${target})`, ret: "none", anchors: ["two.none"], notes: {},
    title: `No pair sums to ${target}`, idea: "Even a miss costs only one pass.",
    text: `Every value was checked against all earlier ones through the map, and none fit. twoSum reports no answer.`
  }, { phase: "two" }));

  steps.push(snap({
    kind: "recap", op: null, anchors: [], notes: {},
    title: "What happened",
    idea: "Trade O(n) memory for O(n) time: the map holds what a nested loop would recompute.",
    text: `count took one pass to build ${fmt(count)}. twoSum took ${found ? "at most one more pass" : "one more pass"}, asking the seen map for each value's partner instead of looping over every pair.`
  }));
  return steps;
}

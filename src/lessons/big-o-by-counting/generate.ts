import type { Step } from "../../engine/types";
import type { NumsInput } from "../parseOps";

export interface BigOState {
  nums: number[];
  i: number;
  j: number;
  part: "sum" | "dup" | null;
  /** Work done so far by each function: one per loop body run. */
  sumOps: number;
  dupOps: number;
  total: number;
  /** True on the step where a[i] == a[j]. */
  hit: boolean;
}

/** Runs sum() and then hasDuplicate() on the same array, one step per loop body, counting the work. */
export function generateBigO({ nums }: NumsInput): Step<BigOState>[] {
  const n = nums.length;
  let sumOps = 0, dupOps = 0, total = 0;
  const snap = (s: Omit<Step<BigOState>, "state">, extra: Partial<BigOState> = {}): Step<BigOState> => ({
    ...s, state: { nums, i: -1, j: -1, part: null, sumOps, dupOps, total, hit: false, ...extra }
  });

  const steps: Step<BigOState>[] = [snap({
    kind: "problem", op: null, anchors: [], notes: {},
    title: "Count the work",
    idea: "Big-O counts how many basic steps a function takes as the input grows.",
    text: `Two functions read the same ${n} numbers. sum() adds them up. hasDuplicate() checks whether any value appears twice. Count one step each time a loop body runs, and see how the two counts grow.`
  })];

  for (let i = 0; i < n; i++) {
    total += nums[i];
    sumOps++;
    steps.push(snap({
      kind: "move", op: `total += a[${i}]`, short: `+a[${i}]`, anchors: ["sum.sig", "sum.loop", "sum.add"],
      notes: { "sum.loop": `i = ${i}, step ${sumOps} of ${n}`, "sum.add": `total = ${total - nums[i]} + ${nums[i]} = ${total}` },
      title: i === 0 ? "One loop, one step per item" : `Add a[${i}]`,
      idea: "A single loop over n items runs its body n times.",
      text: i === 0
        ? `sum() starts at index 0 and adds ${nums[0]}. That is one step. Each item gets exactly one visit.`
        : `Add ${nums[i]}. The running total is ${total}. Steps so far: ${sumOps}.`
    }, { i, part: "sum" }));
  }
  steps.push(snap({
    kind: "found", op: "sum(a)", ret: String(total), anchors: ["sum.sig", "sum.return"],
    notes: { "sum.return": `returns ${total} after ${n} steps` },
    title: `n items, n steps`,
    idea: "Work that grows in step with n is O(n), linear time.",
    text: `sum() took ${n} steps for ${n} items. Double the array and it takes twice as many. That is O(n).`
  }, { part: "sum" }));

  let found = false;
  outer: for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      dupOps++;
      const hit = nums[i] === nums[j];
      steps.push(snap({
        kind: hit ? "found" : "check", op: `a[${i}] == a[${j}]`, short: `${i}·${j}`, ret: hit ? "true" : undefined,
        anchors: hit ? ["dup.sig", "dup.outer", "dup.inner", "dup.cmp", "dup.found"] : ["dup.sig", "dup.outer", "dup.inner", "dup.cmp"],
        notes: {
          "dup.inner": `i = ${i}, j = ${j}, pair ${dupOps}`,
          "dup.cmp": `${nums[i]} == ${nums[j]} is ${hit}`,
          ...(hit ? { "dup.found": `returns true after ${dupOps} checks` } : {})
        },
        title: hit ? "A match ends it early" : dupOps === 1 ? "A loop inside a loop" : `Compare a[${i}] with a[${j}]`,
        idea: hit ? "Stopping early helps this input. Big-O still describes the worst case, where no match exists." : "For each i, the inner loop visits every later j. That is every pair.",
        text: hit
          ? `${nums[i]} appears twice, so hasDuplicate() returns true after ${dupOps} checks. Without a duplicate it would have checked all ${(n * (n - 1)) / 2} pairs.`
          : dupOps === 1
            ? `hasDuplicate() fixes i = 0 and compares it with every later item. Then i moves on and it starts again. Steps so far: 1.`
            : `${nums[i]} and ${nums[j]} differ. Steps so far: ${dupOps}, already ${dupOps > n ? "more than" : "close to"} the ${n} that sum() needed.`
      }, { i, j, part: "dup", hit }));
      if (hit) { found = true; break outer; }
    }
  }
  if (!found) {
    steps.push(snap({
      kind: "check", op: "hasDuplicate(a)", ret: "false", anchors: ["dup.sig", "dup.none"],
      notes: { "dup.none": `no pair matched, ${dupOps} checks` },
      title: "Every pair, checked",
      idea: "n(n-1)/2 pairs grows like n², so this is O(n²), quadratic time.",
      text: `No value repeats, so every pair was compared: ${dupOps} checks for ${n} items. That is n(n-1)/2. Double n and the work roughly quadruples.`
    }, { part: "dup" }));
  }

  const row = [4, 8, 16, 32].map((k) => `n = ${k}: ${k} vs ${(k * (k - 1)) / 2}`).join(", ");
  steps.push(snap({
    kind: "recap", op: null, anchors: [], notes: {},
    title: "What happened",
    idea: "Count loop bodies. One loop over n is O(n). A loop inside a loop is O(n²).",
    text: `sum() took ${sumOps} steps and hasDuplicate() took ${dupOps}. The gap widens fast as n grows: ${row}. Big-O keeps the shape of that growth and drops the constants.`
  }));
  return steps;
}

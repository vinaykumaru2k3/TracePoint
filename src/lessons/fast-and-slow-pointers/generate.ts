import type { Step } from "../../engine/types";
import type { NumsInput } from "../parseOps";

/** Most nodes the stage is framed for. */
export const FS_MAX = 7;

export interface FsState {
  vals: number[];
  /** next[i] is the index node i points to, or null. */
  next: (number | null)[];
  cycleAt: number | null;
  slow: number | null;
  fast: number | null;
  /** Which pointer moved this step. */
  moved: "slow" | "fast" | null;
  met: boolean;
  hops: number;
}

/** Floyd's cycle detection: slow moves one node, fast moves two, and they meet only if there is a loop. */
export function generateFs({ nums, k }: NumsInput): Step<FsState>[] {
  const n = nums.length;
  const cycleAt = k ?? null;
  const next = nums.map((_, i) => (i < n - 1 ? i + 1 : cycleAt));
  let slow: number | null = 0, fast: number | null = 0, hops = 0;
  const snap = (s: Omit<Step<FsState>, "state">, x: Partial<FsState> = {}): Step<FsState> => ({
    ...s, state: { vals: nums, next, cycleAt, slow, fast, moved: null, met: false, hops, ...x }
  });
  const name = (i: number | null) => (i === null ? "null" : String(nums[i]));

  const steps: Step<FsState>[] = [snap({
    kind: "problem", op: null, anchors: [], notes: {},
    title: "Does the list loop back?",
    idea: "Two runners on a track: if the track is a loop, the fast one laps the slow one.",
    text: `A list of ${n} nodes. ${cycleAt === null ? "The last node points to null" : `The last node points back to ${nums[cycleAt]}, making a cycle`}, but the code cannot see that from outside. It may only follow next pointers, and it must not walk forever.`
  }, { slow: null, fast: null })];

  steps.push(snap({
    kind: "move", op: "hasCycle(head)", anchors: ["fs.sig", "fs.init"], notes: { "fs.init": `slow = fast = head (${nums[0]})` },
    title: "Both start at head", idea: "Floyd's trick uses O(1) memory: no set of visited nodes, just two pointers.",
    text: `slow and fast both point at ${nums[0]}.`
  }));

  for (let guard = 0; guard < 4 * n; guard++) {
    if (fast === null || next[fast] === null) {
      steps.push(snap({
        kind: "check", op: "hasCycle(head)", ret: "false", anchors: ["fs.loop", "fs.none"],
        notes: { "fs.loop": fast === null ? "fast is null" : `fast.next is null (fast on ${name(fast)})`, "fs.none": "no cycle" },
        title: "fast reached the end", idea: "Reaching null proves the list ends. A loop would never let fast escape.",
        text: `fast ${fast === null ? "fell off the end" : `is on the last node ${name(fast)}`}, so there is no cycle. hasCycle returns false after ${hops} rounds.`
      }));
      break;
    }
    hops++;
    const s0: number = slow!;
    slow = next[s0];
    steps.push(snap({
      kind: "move", op: "hasCycle(head)", anchors: ["fs.loop", "fs.slow"], notes: { "fs.slow": `slow: ${name(s0)} → ${name(slow)}` },
      title: `Round ${hops}: slow takes one step`, idea: "slow moves one node per round.",
      text: `slow moves from ${name(s0)} to ${name(slow)}.`
    }, { moved: "slow" }));
    const f0: number = fast;
    const f1: number | null = next[f0];
    fast = f1 === null ? null : next[f1];
    const met = slow === fast;
    steps.push(snap({
      kind: met ? "found" : "move", op: "hasCycle(head)", ret: met ? "true" : undefined,
      anchors: met ? ["fs.fast", "fs.meet"] : ["fs.fast"],
      notes: met ? { "fs.fast": `fast: ${name(f0)} → ${name(f1)} → ${name(fast)}`, "fs.meet": `slow == fast at ${name(slow)}` }
        : { "fs.fast": `fast: ${name(f0)} → ${name(f1)} → ${name(fast)}` },
      title: met ? `They meet at ${name(slow)}` : `Round ${hops}: fast takes two steps`,
      idea: met ? "Inside a loop, fast gains one node per round, so it must land on slow." : "fast moves two nodes per round, twice the speed of slow.",
      text: met ? `fast jumps from ${name(f0)} over ${name(f1)} and lands on ${name(fast)}, the same node as slow. That can only happen in a cycle, so hasCycle returns true.`
        : `fast jumps from ${name(f0)} over ${name(f1)} to ${name(fast)}.`
    }, { moved: "fast", met }));
    if (met) break;
  }

  steps.push(snap({
    kind: "recap", op: null, anchors: [], notes: {},
    title: "What happened",
    idea: "Fast and slow pointers find cycles, middles and k-th-from-end nodes in one pass.",
    text: (cycleAt === null ? "fast hit null, proving the list ends." : `The pointers met after ${hops} rounds.`) +
      " Each round costs O(1), and fast can lap slow at most once inside a loop, so the whole check is O(n) time and O(1) space."
  }));
  return steps;
}

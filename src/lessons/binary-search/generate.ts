import type { Step } from "../../engine/types";
import type { NumsInput } from "../parseOps";

export interface BinaryState {
  nums: number[];
  lo: number;
  hi: number;
  mid: number | null;
  target: number;
  hit: boolean;
  /** Which bound the last probe moved. */
  moved: "lo" | "hi" | null;
}

/** Halve the range [lo, hi] around mid until a[mid] is the target or the range is empty. */
export function generateBinary({ nums: raw, k }: NumsInput): Step<BinaryState>[] {
  const nums = raw.slice().sort((a, b) => a - b);
  const sorted = raw.every((v, i) => i === 0 || raw[i - 1] <= v);
  const target = k ?? 0;
  let lo = 0, hi = nums.length - 1;
  const snap = (s: Omit<Step<BinaryState>, "state">, extra: Partial<BinaryState> = {}): Step<BinaryState> => ({
    ...s, state: { nums, lo, hi, mid: null, target, hit: false, moved: null, ...extra }
  });

  const steps: Step<BinaryState>[] = [snap({
    kind: "problem", op: null, anchors: [], notes: {},
    title: `Find ${target} in a sorted array`,
    idea: "In sorted data, one comparison with the middle tells you which half can't hold the target.",
    text: `${sorted ? "The array is sorted." : `The input was sorted first: ${nums.join(", ")}.`} Linear search could need ${nums.length} checks. Binary search halves the range each time.`
  })];
  steps.push(snap({
    kind: "peek", op: `lo=0, hi=${hi}`,
    anchors: ["bs.sig", "bs.init"], notes: { "bs.init": `lo = 0, hi = ${hi}` },
    title: "The whole array is in range",
    idea: "lo and hi bound the only cells that could still hold the target.",
    text: `Start with every cell as a candidate: lo = 0 and hi = ${hi}.`
  }));

  let probes = 0;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    const v = nums[mid];
    probes++;
    if (v === target) {
      steps.push(snap({
        kind: "found", op: `return ${mid}`, ret: String(mid),
        anchors: ["bs.loop", "bs.mid", "bs.hit"],
        notes: { "bs.mid": `mid = ${lo} + (${hi} - ${lo}) / 2 = ${mid}`, "bs.hit": `a[${mid}] = ${v}, found after ${probes} probe${probes === 1 ? "" : "s"}` },
        title: `a[${mid}] is ${target}`,
        idea: "Each probe halved the range, so even the worst case needs only about log2(n) probes.",
        text: `The middle of [${lo}, ${hi}] is index ${mid}, and it holds ${target}. Found in ${probes} probe${probes === 1 ? "" : "s"}.`
      }, { mid, hit: true }));
      break;
    }
    const small = v < target;
    const range = `[${lo}, ${hi}]`;
    steps.push(snap({
      kind: "check", op: `mid = ${mid}`,
      anchors: ["bs.loop", "bs.mid", small ? "bs.right" : "bs.left"],
      notes: {
        "bs.mid": `mid = ${lo} + (${hi} - ${lo}) / 2 = ${mid}, a[mid] = ${v}`,
        [small ? "bs.right" : "bs.left"]: small ? `${v} < ${target}, lo becomes ${mid + 1}` : `${v} > ${target}, hi becomes ${mid - 1}`
      },
      title: small ? `${v} < ${target}: drop the left half` : `${v} > ${target}: drop the right half`,
      idea: small
        ? `Everything left of mid is at most ${v}, so it is too small as well.`
        : `Everything right of mid is at least ${v}, so it is too big as well.`,
      text: small
        ? `The middle of ${range} is a[${mid}] = ${v}, less than ${target}. The target can only be to the right, so lo moves to ${mid + 1}.`
        : `The middle of ${range} is a[${mid}] = ${v}, more than ${target}. The target can only be to the left, so hi moves to ${mid - 1}.`
    }, { mid, moved: small ? "lo" : "hi" }));
    if (small) lo = mid + 1; else hi = mid - 1;
  }

  if (!steps.some((s) => s.kind === "found")) {
    steps.push(snap({
      kind: "empty", op: "return -1", ret: "-1", retNote: "not found",
      anchors: ["bs.loop", "bs.none"], notes: { "bs.none": `lo = ${lo} > hi = ${hi}` },
      title: "The range is empty",
      idea: "When lo passes hi, no candidate is left, so the target isn't there.",
      text: `lo = ${lo} is past hi = ${hi}. ${probes} probes ruled out every cell, so the search returns -1.`
    }));
  }

  const last = steps[steps.length - 1].state;
  steps.push(snap({
    kind: "recap", op: null, anchors: [], notes: {},
    title: "What happened",
    idea: "Binary search is O(log n), but only on sorted data.",
    text: `${probes} probe${probes === 1 ? "" : "s"} for ${nums.length} values. Doubling the array adds only one probe. Sorting first costs O(n log n), so it pays off when you search the same data many times.`
  }, { lo: last.lo, hi: last.hi, mid: last.mid, hit: last.hit }));
  return steps;
}

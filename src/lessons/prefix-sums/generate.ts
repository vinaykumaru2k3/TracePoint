import type { ParseResult, Step } from "../../engine/types";
import { parseNums } from "../parseOps";

export interface PrefixInput { nums: number[]; queries: [number, number][] }

export interface PrefixState {
  nums: number[];
  /** p[i] = sum of the first i items; null until written. */
  p: (number | null)[];
  /** Index of a being added while building, or -1. */
  i: number;
  /** Query range [l, r] being answered. */
  q: [number, number] | null;
}

/** "3 1 4 1 5 query 1 3 query 0 4": numbers, then up to 4 inclusive ranges. */
export function parsePrefix(text: string): ParseResult<PrefixInput> {
  const [head, ...rest] = text.toLowerCase().split(/\bquery\b/);
  const r = parseNums(head, { minLen: 2, maxLen: 8, max: 20 });
  if (!r.ok) return r;
  const n = r.input.nums.length;
  const queries: [number, number][] = [];
  for (const part of rest) {
    const m = part.replace(/[(),;-]/g, " ").trim().split(/\s+/).filter(Boolean);
    if (m.length !== 2 || !m.every((t) => /^\d+$/.test(t))) return { ok: false, error: `Each query needs two indexes, like "query 1 3".` };
    const [l, rr] = m.map(Number);
    if (l > rr || rr >= n) return { ok: false, error: `Query ranges need 0 <= l <= r <= ${n - 1}.` };
    queries.push([l, rr]);
  }
  if (!queries.length) return { ok: false, error: `Add at least one range, like "query 1 3".` };
  if (queries.length > 4) return { ok: false, error: "Keep it to 4 queries or fewer." };
  return { ok: true, input: { nums: r.input.nums, queries } };
}

/** Builds the prefix array one entry per step, then answers each range sum with one subtraction. */
export function generatePrefix({ nums, queries }: PrefixInput): Step<PrefixState>[] {
  const n = nums.length;
  const p: (number | null)[] = Array(n + 1).fill(null);
  const snap = (s: Omit<Step<PrefixState>, "state">, extra: Partial<PrefixState> = {}): Step<PrefixState> => ({
    ...s, state: { nums, p: p.slice(), i: -1, q: null, ...extra }
  });

  const steps: Step<PrefixState>[] = [snap({
    kind: "problem", op: null, anchors: [], notes: {},
    title: "Many range sums, one array",
    idea: "Pay O(n) once to build running totals, then every range sum is O(1).",
    text: `We will be asked ${queries.length} range sum${queries.length === 1 ? "" : "s"} over these ${n} numbers. Adding up each range directly costs up to ${n} additions per question. A prefix array answers each one with a single subtraction.`
  })];

  p[0] = 0;
  steps.push(snap({
    kind: "add", op: "p[0] = 0", anchors: ["ps.sig", "ps.zero"],
    notes: { "ps.zero": "the sum of no items is 0" },
    title: "Start with zero",
    idea: "p has one more slot than a. p[i] is the sum of the first i items.",
    text: "p[0] is the sum of zero items, so it is 0. The extra slot means no range ever needs a special case."
  }));
  for (let i = 0; i < n; i++) {
    p[i + 1] = p[i]! + nums[i];
    steps.push(snap({
      kind: "add", op: `p[${i + 1}] = p[${i}] + a[${i}]`, anchors: ["ps.sig", "ps.loop", "ps.add"],
      notes: { "ps.add": `p[${i + 1}] = ${p[i]} + ${nums[i]} = ${p[i + 1]}` },
      title: i === n - 1 ? "Prefix array done" : `Running total ${p[i + 1]}`,
      idea: "Each entry reuses the one before it, so building p is one pass.",
      text: `p[${i + 1}] = p[${i}] + a[${i}] = ${p[i]} + ${nums[i]} = ${p[i + 1]}. It holds the sum of a[0..${i}].` +
        (i === n - 1 ? ` The whole array sums to ${p[n]}.` : "")
    }, { i }));
  }

  for (const [l, r] of queries) {
    const ans = p[r + 1]! - p[l]!;
    steps.push(snap({
      kind: "found", op: `sum(${l}, ${r})`, ret: String(ans), anchors: ["ps.query"],
      notes: { "ps.query": `p[${r + 1}] - p[${l}] = ${p[r + 1]} - ${p[l]} = ${ans}` },
      title: `Sum of a[${l}..${r}]`,
      idea: "Range sum = total up to r, minus total before l.",
      text: `p[${r + 1}] = ${p[r + 1]} covers a[0..${r}]. ` +
        (l === 0 ? "p[0] = 0, because nothing comes before the range. " : `p[${l}] = ${p[l]} covers a[0..${l - 1}], the part before the range. `) +
        `Subtract: ${ans}. ` +
        `Adding directly would take ${r - l + 1} additions.`
    }, { q: [l, r] }));
  }

  steps.push(snap({
    kind: "recap", op: null, anchors: [], notes: {},
    title: "What happened",
    idea: "Precompute once, answer fast many times.",
    text: `Building p took ${n} additions. The ${queries.length} quer${queries.length === 1 ? "y" : "ies"} took one subtraction each, instead of ${queries.reduce((t, [l, r]) => t + r - l + 1, 0)} additions done directly.`
  }));
  return steps;
}

import type { Step } from "./types";

/** A name must not read like a code coordinate (`i1 j2`, `a5 c2`, `back i3`, `i4`). */
export const COORD = /\b[a-z]\d+ [a-z]\d+\b|^back i\d|^[a-z]\d+$/;

/** The op that names 40% or more of the run, or null. Such an op says nothing about any one step. */
export function runOpOf(steps: Step<unknown>[]): string | null {
  const n = new Map<string, number>();
  for (const s of steps) if (s.op) n.set(s.op, (n.get(s.op) ?? 0) + 1);
  for (const [op, c] of n) if (c >= steps.length * 0.4) return op;
  return null;
}

/** A stop's name: its short form, else its kind when its op is the run-wide op, else its op, else start or recap. */
export function stepName(steps: Step<unknown>[], i: number, runOp: string | null): string {
  const s = steps[i];
  if (s.short) return s.short;
  if (s.op) return s.op === runOp ? s.kind : s.op;
  return i === 0 ? "start" : "recap";
}

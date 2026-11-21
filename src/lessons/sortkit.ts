import type { Metric, MemoryView, ParseResult, Step } from "../engine/types";
import { toneOf } from "../engine/types";
import type { BlockState } from "../iso/IsoBlock";
import type { RowPointer } from "../iso/CellRow";
import { parseNums, type NumsInput } from "./parseOps";

/** One snapshot shared by every sort lesson. `null` in `a` is a lifted cell (insertion sort's key). */
export interface SortState {
  a: (number | null)[];
  /** Per-index scene state; overrides `done`. */
  marks: Partial<Record<number, BlockState>>;
  /** Indices already in their final place. */
  done: number[];
  ptrs: RowPointer[];
  compares: number;
  swaps: number;
  /** A second row under the array: the merge buffer, the count array, or the lifted key. */
  aux?: (number | null)[];
  auxName?: string;
  /** First index tag of the aux row; no tags when unset. */
  auxIndexFrom?: number;
  /** Cell column the aux row starts under (defaults to 0). */
  auxAt?: number;
  auxPtrs?: RowPointer[];
}

export const fmt = (a: (number | null)[]): string => `[${a.map((v) => v ?? "_").join(", ")}]`;

export const parseSort = (text: string, max = 99): ParseResult<NumsInput> =>
  parseNums(text, { minLen: 2, maxLen: 8, max });

/** The array in memory. A cell is highlighted with the same tone its scene state uses. */
export function sortMemory(title: string, s: SortState, note: string): MemoryView {
  return {
    title,
    note,
    cells: s.a.map((v, k) => {
      const tone = v === null ? undefined : toneOf(s.marks[k]) ?? (s.marks[k] === "active" ? "active" : undefined);
      return {
        v, live: v !== null, act: tone !== undefined, tone,
        marks: s.ptrs.filter((p) => p.at === k).map((p) => p.label)
      };
    })
  };
}

export const sortMetrics = (s: SortState, moves = "Swaps"): Metric[] => [
  { label: "Compares", value: s.compares },
  { label: moves, value: s.swaps },
  { label: "Sorted", value: `${s.done.length}/${s.a.length}` }
];

/** Builds a sort's steps. `snap` copies the live state so later mutation never leaks into earlier steps. */
export class SortTrace {
  steps: Step<SortState>[] = [];
  s: SortState;
  constructor(nums: number[]) {
    this.s = { a: nums.slice(), marks: {}, done: [], ptrs: [], compares: 0, swaps: 0 };
  }
  push(step: Omit<Step<SortState>, "state">, view: Partial<SortState> = {}) {
    const s = this.s;
    this.steps.push({
      ...step,
      state: {
        ...s, a: s.a.slice(), done: s.done.slice(), aux: s.aux?.slice(),
        marks: {}, ptrs: [], auxPtrs: [], ...view
      }
    });
  }
  settle(...ks: number[]) {
    for (const k of ks) if (!this.s.done.includes(k)) this.s.done.push(k);
  }
  /** The closing "sorted" step (with the return value) and the recap. */
  finish(anchor: string, idea: string, recap: string) {
    this.settle(...this.s.a.map((_, k) => k));
    this.s.aux = undefined;
    const out = fmt(this.s.a);
    this.push({
      kind: "found", op: "sorted", ret: out, anchors: [anchor], notes: { [anchor]: `returns ${out}` },
      title: "The array is sorted", idea,
      text: `Every value is in its final place: ${out}. That took ${this.s.compares} compare${this.s.compares === 1 ? "" : "s"}.`
    });
    this.push({ kind: "recap", op: null, anchors: [], notes: {}, title: "What happened", idea, text: recap });
    return this.steps;
  }
}

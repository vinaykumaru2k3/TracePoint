import type { Step } from "../../engine/types";
import type { BlockState } from "../../iso/IsoBlock";
import type { Cell } from "../../iso/CellRow";
import type { DPState } from "../dpkit";

export interface Item { w: number; v: number }
export interface KnapInput { items: Item[]; cap: number }

export type KnapState = DPState & {
  op: string | null;
  /** The item row being filled (1-based), or null outside the loops. */
  i: number | null;
  /** The capacity column being filled, or null outside the loops. */
  w: number | null;
  /** Cells computed so far. */
  filled: number;
  /** dp[i][w] as numbers, or null while a cell is not computed. */
  dp: (number | null)[][];
  /** Items taken by the traceback so far, as "w:v". */
  taken: string[];
};

const tag = (it: Item) => `${it.w}:${it.v}`;

/** 0/1 knapsack, bottom-up: dp[i][w] = the best value from the first i items with capacity w. */
export function generateKnapsack({ items, cap }: KnapInput): Step<KnapState>[] {
  const n = items.length;
  const dp: (number | null)[][] = Array.from({ length: n + 1 }, () => Array.from({ length: cap + 1 }, () => null));
  const taken: string[] = [];
  let filled = 0;
  const steps: Step<KnapState>[] = [];
  const rowHead = ["-", ...items.map(tag)];
  const colHead = Array.from({ length: cap + 1 }, (_, w) => String(w));

  const snap = (
    st: Omit<Step<KnapState>, "state" | "op">,
    v: { op?: string; i?: number; w?: number; mark?: Record<string, BlockState>; strip?: "items" | "taken"; slots?: number } = {}
  ) => {
    const grid: Cell[][] = dp.map((row, r) => row.map((x, c) => ({ v: x, state: v.mark?.[`${r},${c}`] })));
    const op = v.op ?? null;
    const strip = v.strip === "taken"
      ? { name: "taken", cells: taken.map((t) => ({ v: t, state: "found" as BlockState })), slots: v.slots }
      : { name: "items", cells: items.map((it, k) => ({ v: tag(it), state: k + 1 === v.i ? ("active" as BlockState) : undefined })) };
    steps.push({
      ...st, op,
      state: {
        kind: "grid", grid, rowHead, colHead,
        ptrs: v.i !== undefined && v.w !== undefined ? [{ r: v.i, c: v.w, label: "here" }] : [],
        strip,
        op, i: v.i ?? null, w: v.w ?? null, filled, dp: dp.map((r) => r.slice()), taken: taken.slice()
      }
    });
  };

  snap({
    kind: "problem", anchors: [], notes: {},
    title: "Best value that fits in the bag",
    idea: "Each item is taken whole or left out. The best value for the first i items and capacity w comes from two choices: skip item i, or take it and use what is left.",
    text: `The items are written weight:value. They are ${items.map(tag).join(", ")}, and the bag holds ${cap}. dp[i][w] is the best value using the first i items with room w. Row 0 means no items.`
  }, { strip: "items" });

  for (let c = 0; c <= cap; c++) dp[0][c] = 0;
  for (let r = 1; r <= n; r++) dp[r][0] = 0;
  filled = cap + 1 + n;
  const base: Record<string, BlockState> = {};
  for (let c = 0; c <= cap; c++) base[`0,${c}`] = "active";
  for (let r = 1; r <= n; r++) base[`${r},0`] = "active";
  snap({
    kind: "add", anchors: ["kn.init"], notes: { "kn.init": `dp = ${n + 1} rows by ${cap + 1} columns, row 0 and column 0 are 0` },
    title: "Base case: no items, or no room, is worth 0",
    idea: "With no items there is nothing to carry, and with no room nothing fits. Both give value 0, so row 0 and column 0 start at 0.",
    text: `Row 0 is zeros because no items means no value. Column 0 is zeros because a bag with room 0 holds nothing. The other ${n * cap} cells are filled one at a time.`
  }, { op: "row 0 = 0", mark: base, strip: "items" });

  for (let i = 1; i <= n; i++) {
    const it = items[i - 1];
    for (let w = 1; w <= cap; w++) {
      const skip = dp[i - 1][w] as number;
      const fits = it.w <= w;
      const left = fits ? (dp[i - 1][w - it.w] as number) : 0;
      const take = fits ? it.v + left : -1;
      const op = `i${i} w${w}`;
      const reads: [number, number][] = fits ? [[i - 1, w], [i - 1, w - it.w]] : [[i - 1, w]];
      const mark: Record<string, BlockState> = {};
      for (const [r, c] of reads) mark[`${r},${c}`] = "compare";
      mark[`${i},${w}`] = "active";
      filled++;
      if (fits && take > skip) {
        dp[i][w] = take;
        snap({
          kind: "add", anchors: w === 1 ? ["kn.item", "kn.fit", "kn.take"] : ["kn.fit", "kn.take"],
          notes: { ...(w === 1 ? { "kn.item": `item ${i} (${tag(it)}): a new row starts` } : {}), "kn.fit": `w = ${w}, item ${i} weighs ${it.w}: it fits`, "kn.take": `dp[${i}][${w}] = ${it.v} + dp[${i - 1}][${w - it.w}] = ${take}` },
          title: `Take item ${i} (${tag(it)}): dp[${i}][${w}] = ${take}`, short: `item ${i}, room ${w}`,
          idea: "Taking the item gives its value plus the best value for the room that is left. When that beats skipping it, the cell takes the larger number.",
          text: `Item ${i} weighs ${it.w}, so ${w - it.w} room is left, worth dp[${i - 1}][${w - it.w}] = ${left}. Taking it gives ${it.v} + ${left} = ${take}, more than skipping (${skip}). dp[${i}][${w}] = ${take}.`
        }, { op, i, w, mark, strip: "items" });
      } else {
        dp[i][w] = skip;
        snap({
          kind: "check", anchors: w === 1 ? ["kn.item", "kn.fit", "kn.copy"] : ["kn.fit", "kn.copy"],
          notes: {
            ...(w === 1 ? { "kn.item": `item ${i} (${tag(it)}): a new row starts` } : {}),
            "kn.copy": `dp[${i}][${w}] = dp[${i - 1}][${w}] = ${skip}`,
            "kn.fit": fits ? `w = ${w}: taking gives ${take}, not more than ${skip}` : `w = ${w}: item ${i} weighs ${it.w}, too heavy`
          },
          title: fits ? `Skip item ${i}: dp[${i}][${w}] = ${skip}` : `Item ${i} is too heavy for ${w}`, short: `item ${i}, room ${w}`,
          idea: "When the item does not fit, or taking it does not beat skipping it, the cell copies the cell above: the best value without this item.",
          text: fits
            ? `Item ${i} weighs ${it.w} and fits. Taking it gives ${it.v} + ${left} = ${take}, which is not more than ${skip}. So dp[${i}][${w}] copies the cell above: ${skip}.`
            : `Item ${i} weighs ${it.w}, more than the room ${w}, so it cannot be taken. dp[${i}][${w}] copies the cell above: ${skip}.`
        }, { op, i, w, mark, strip: "items" });
      }
    }
  }

  const best = dp[n][cap] as number;
  const path: Record<string, BlockState> = { [`${n},${cap}`]: "found" };
  let total = 0;
  for (let i = n, w = cap; i > 0; i--) if (dp[i][w] !== dp[i - 1][w]) { total++; w -= items[i - 1].w; }
  let w = cap;
  for (let i = n; i > 0; i--) {
    if (dp[i][w] === dp[i - 1][w]) continue;
    const it = items[i - 1];
    taken.push(tag(it));
    const cmp: Record<string, BlockState> = { [`${i},${w}`]: "compare", [`${i - 1},${w}`]: "compare" };
    path[`${i - 1},${w - it.w}`] = "found";
    snap({
      kind: "found", anchors: ["kn.trace", "kn.tb", "kn.step"],
      notes: {
        "kn.trace": `row ${i}, room ${w}`,
        "kn.tb": `dp[${i}][${w}] = ${dp[i][w]} differs from dp[${i - 1}][${w}] = ${dp[i - 1][w]}, so item ${i} was taken`,
        "kn.step": `w = ${w} - ${it.w} = ${w - it.w}`
      },
      title: `Item ${i} (${tag(it)}) was taken`, short: `take item ${i}`,
      idea: "To see which items were taken, walk back from the last cell. If a cell differs from the one above it, the item in that row was taken, so move left by its weight and up a row.",
      text: `dp[${i}][${w}] = ${dp[i][w]} but the cell above is ${dp[i - 1][w]}, so item ${i} was taken. Room ${w} drops to ${w - it.w}, and we move up to row ${i - 1}.`
    }, { op: `take i${i}`, mark: { ...cmp, ...path }, strip: "taken", slots: total });
    w -= it.w;
  }

  snap({
    kind: "recap", anchors: ["kn.ret"], notes: { "kn.ret": `return ${best}` },
    title: `Best value ${best}`,
    idea: "Every cell was filled once from two cells in the row above, so the work grows with the number of items times the capacity.",
    text: best === 0
      ? `No item both fits in room ${cap} and adds value, so the best value is 0 and nothing is taken. The table had ${n + 1} rows by ${cap + 1} columns.`
      : `The best value is ${best}, from taking ${taken.join(" and ")}. The table had ${n + 1} rows by ${cap + 1} columns, and each cell was one step.`,
    ret: String(best), retNote: `best value = ${best}`
  }, { op: `return ${best}`, mark: { [`${n},${cap}`]: "found" }, strip: "taken", slots: total });
  return steps;
}

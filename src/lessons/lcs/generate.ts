import type { Step } from "../../engine/types";
import type { BlockState } from "../../iso/IsoBlock";
import type { Cell } from "../../iso/CellRow";
import type { DPState } from "../dpkit";

export interface LcsInput { a: string; b: string }

export type LcsState = DPState & {
  op: string | null;
  /** The row being filled (letters of a used so far), or null outside the loops. */
  i: number | null;
  /** The column being filled (letters of b used so far), or null outside the loops. */
  j: number | null;
  /** Cells computed so far. */
  filled: number;
  /** dp[i][j] as numbers, or null while a cell is not computed. */
  dp: (number | null)[][];
  /** Letters picked by the traceback so far, in word order. */
  common: string;
};

const show = (w: string) => (w === "" ? "(empty)" : w);

/** Longest common subsequence, bottom-up: dp[i][j] = the LCS length of the first i letters of a and the first j of b. */
export function generateLcs({ a, b }: LcsInput): Step<LcsState>[] {
  const n = a.length, m = b.length;
  const dp: (number | null)[][] = Array.from({ length: n + 1 }, () => Array.from({ length: m + 1 }, () => null));
  let common = "";
  let filled = 0;
  const steps: Step<LcsState>[] = [];
  const rowHead = ["-", ...a.split("")];
  const colHead = ["-", ...b.split("")];

  /* The same name twice in a row would give two stops one label, so the repeat carries its position. */
  const fresh = (name: string, at: string) => (steps.length > 0 && steps[steps.length - 1].short === name ? `${name} (${at})` : name);

  const snap = (
    st: Omit<Step<LcsState>, "state" | "op">,
    v: { op?: string; i?: number; j?: number; mark?: Record<string, BlockState>; strip?: boolean; slots?: number } = {}
  ) => {
    const grid: Cell[][] = dp.map((row, r) => row.map((x, c) => ({ v: x, state: v.mark?.[`${r},${c}`] })));
    const op = v.op ?? null;
    steps.push({
      ...st, op,
      state: {
        kind: "grid", grid, rowHead, colHead,
        ptrs: v.i !== undefined && v.j !== undefined ? [{ r: v.i, c: v.j, label: "here" }] : [],
        strip: v.strip ? { name: "common", cells: common.split("").map((ch) => ({ v: ch, state: "found" as BlockState })), slots: v.slots } : undefined,
        op, i: v.i ?? null, j: v.j ?? null, filled, dp: dp.map((r) => r.slice()), common
      }
    });
  };

  snap({
    kind: "problem", anchors: [], notes: {},
    title: "Longest common subsequence",
    idea: "A subsequence keeps letters in their original order but may skip some. The longest one shared by two words is built from the answers for shorter prefixes.",
    text: `The words are ${show(a)} and ${show(b)}. A subsequence is what is left after deleting some letters, so ACE is a subsequence of ABCDE. dp[i][j] is the length of the longest one shared by the first i letters of the first word and the first j of the second.`
  });

  for (let c = 0; c <= m; c++) dp[0][c] = 0;
  for (let r = 1; r <= n; r++) dp[r][0] = 0;
  filled = m + 1 + n;
  const edges: Record<string, BlockState> = {};
  for (let c = 0; c <= m; c++) edges[`0,${c}`] = "active";
  for (let r = 1; r <= n; r++) edges[`${r},0`] = "active";
  snap({
    kind: "add", anchors: ["lc.init"], notes: { "lc.init": `dp = ${n + 1} rows by ${m + 1} columns, row 0 and column 0 are 0` },
    title: "Base case: an empty prefix shares nothing",
    idea: "Compared with an empty word, the other word shares no letters. So row 0 and column 0 are 0, whatever the letters are.",
    text: n === 0 || m === 0
      ? `One word is empty and has no letters, so nothing can be shared and every cell is 0. There are no other cells to fill.`
      : `Row 0 means no letters of ${a}, and column 0 means no letters of ${b}. Both are 0. The other ${n * m} cells are filled one at a time.`
  }, { op: "edges = 0", mark: edges });

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const same = a[i - 1] === b[j - 1];
      const diag = dp[i - 1][j - 1] as number, up = dp[i - 1][j] as number, left = dp[i][j - 1] as number;
      const op = `i${i} j${j}`;
      const mark: Record<string, BlockState> = {};
      const reads: [number, number][] = same ? [[i - 1, j - 1]] : [[i - 1, j], [i, j - 1]];
      for (const [r, c] of reads) mark[`${r},${c}`] = "compare";
      mark[`${i},${j}`] = "active";
      filled++;
      const row = j === 1 ? ["lc.row"] : [];
      const rowNote: Record<string, string> = j === 1 ? { "lc.row": `letter ${a[i - 1]} of the first word: a new row starts` } : {};
      if (same) {
        dp[i][j] = diag + 1;
        snap({
          kind: "add", anchors: [...row, "lc.match"], notes: { ...rowNote, "lc.match": `${a[i - 1]} = ${b[j - 1]}: dp[${i}][${j}] = dp[${i - 1}][${j - 1}] + 1 = ${diag + 1}` },
          title: `${a[i - 1]} matches: dp[${i}][${j}] = ${diag + 1}`, short: fresh(`${a[i - 1]} = ${b[j - 1]}`, `col ${j}`),
          idea: "When the two letters match, that letter extends the best answer for both words without their last letters. That answer is on the diagonal, so the cell is the diagonal plus 1.",
          text: `Letter ${i} of the first word is ${a[i - 1]} and letter ${j} of the second is ${b[j - 1]}. They match, so the cell is the diagonal dp[${i - 1}][${j - 1}] = ${diag}, plus 1. dp[${i}][${j}] = ${diag + 1}.`
        }, { op, i, j, mark });
      } else {
        const best = Math.max(up, left);
        dp[i][j] = best;
        snap({
          kind: "check", anchors: [...row, "lc.match", "lc.max"], notes: { ...rowNote, "lc.match": `${a[i - 1]} ≠ ${b[j - 1]}: no match`, "lc.max": `dp[${i}][${j}] = max(${up}, ${left}) = ${best}` },
          title: `${a[i - 1]} ≠ ${b[j - 1]}: dp[${i}][${j}] = ${best}`, short: fresh(`${a[i - 1]} ≠ ${b[j - 1]}`, `col ${j}`),
          idea: "When the letters differ, at least one of them is not used. So the cell takes the larger of the cell above (drop a letter of the first word) and the cell to the left (drop a letter of the second).",
          text: `${a[i - 1]} and ${b[j - 1]} differ. The cell above is ${up} and the cell to the left is ${left}. The larger is ${best}, so dp[${i}][${j}] = ${best}.`
        }, { op, i, j, mark });
      }
    }
  }

  // Traceback from the corner. On a tie between up and left, move up.
  const total = dp[n][m] as number;
  const path: Record<string, BlockState> = {};
  let i = n, j = m;
  while (i > 0 && j > 0) {
    const cur = `${i},${j}`;
    const op = `back i${i} j${j}`;
    if (a[i - 1] === b[j - 1]) {
      const ch = a[i - 1];
      common = ch + common;
      const mark: Record<string, BlockState> = { ...path, [cur]: "compare", [`${i - 1},${j - 1}`]: "compare" };
      snap({
        kind: "found", anchors: ["lc.trace", "lc.tbmatch"],
        notes: { "lc.trace": `row ${i}, column ${j}`, "lc.tbmatch": `${a[i - 1]} = ${b[j - 1]}: take ${ch}, move to (${i - 1}, ${j - 1})` },
        title: `${ch} matches: take it`, short: fresh(`back to ${ch}`, `row ${i}`),
        idea: "To spell the subsequence, walk back from the corner. When the two letters match, that letter belongs to the answer, so take it and move diagonally.",
        text: `Letter ${i} of the first word and letter ${j} of the second are both ${ch}, so ${ch} is in the answer. Move up and left to (${i - 1}, ${j - 1}). Letters are found last to first, so each one goes in front.`
      }, { op, i, j, mark, strip: true, slots: total });
      path[cur] = "found";
      i--; j--;
    } else {
      const up = dp[i - 1][j] as number, left = dp[i][j - 1] as number;
      const goUp = up >= left;
      const mark: Record<string, BlockState> = { ...path, [cur]: "compare", [`${i - 1},${j}`]: "compare", [`${i},${j - 1}`]: "compare" };
      snap({
        kind: "move", anchors: goUp ? ["lc.trace", "lc.tbmatch", "lc.tbup"] : ["lc.trace", "lc.tbmatch", "lc.tbup", "lc.tbleft"],
        notes: {
          "lc.trace": `row ${i}, column ${j}`,
          "lc.tbmatch": `${a[i - 1]} ≠ ${b[j - 1]}: no letter taken`,
          "lc.tbup": `up is ${up}, left is ${left}`,
          ...(goUp ? {} : { "lc.tbleft": `left is larger: move to (${i}, ${j - 1})` })
        },
        short: goUp ? `up to row ${i - 1}` : `left to col ${j - 1}`,
        title: goUp ? (up === left ? `Tie (${up} and ${left}): move up` : "Up is larger: move up") : "Left is larger: move left",
        idea: "When the letters differ, the cell came from the larger of up and left, so move toward it. On a tie, move up.",
        text: goUp
          ? `${a[i - 1]} and ${b[j - 1]} differ. Up is ${up} and left is ${left}${up === left ? ", a tie, and ties go up" : ""}. Move up to (${i - 1}, ${j}).`
          : `${a[i - 1]} and ${b[j - 1]} differ. Up is ${up} and left is ${left}, so the answer came from the left. Move left to (${i}, ${j - 1}).`
      }, { op, i, j, mark, strip: true, slots: total });
      path[cur] = "found";
      if (goUp) i--; else j--;
    }
  }
  path[`${i},${j}`] = "found";

  snap({
    kind: "recap", anchors: ["lc.ret"], notes: { "lc.ret": `return ${total}` },
    title: `Longest common subsequence: ${total}`,
    idea: "Every cell was filled once from its neighbours, so the work grows with the length of the first word times the length of the second.",
    text: total === 0
      ? n === 0 || m === 0
        ? "One word is empty, so the answer is 0 and the table had nothing to fill."
        : `The two words share no letter, so the answer is 0. The table had ${n + 1} rows by ${m + 1} columns, and each inner cell was one step.`
      : `The longest common subsequence has length ${total}, and the traceback spelled it ${common}. The table had ${n + 1} rows by ${m + 1} columns, and each inner cell was one step.`,
    ret: String(total), retNote: `length = ${total}`
  }, { op: `return ${total}`, mark: path, strip: true, slots: total });
  return steps;
}

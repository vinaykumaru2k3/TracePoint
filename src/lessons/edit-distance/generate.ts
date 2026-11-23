import type { Step } from "../../engine/types";
import type { BlockState } from "../../iso/IsoBlock";
import type { Cell } from "../../iso/CellRow";
import type { DPState } from "../dpkit";

export interface EditInput { a: string; b: string }

export type EditState = DPState & {
  op: string | null;
  /** The row being filled (letters of a used so far), or null outside the loops. */
  i: number | null;
  /** The column being filled (letters of b used so far), or null outside the loops. */
  j: number | null;
  /** Cells computed so far. */
  filled: number;
  /** dp[i][j] as numbers, or null while a cell is not computed. */
  dp: (number | null)[][];
  /** Edits picked by the traceback so far, in word order: `keep H`, `rep R`, `del H`, `ins S`. */
  edits: string[];
};

const show = (w: string) => (w === "" ? "(empty)" : w);

/** Edit distance, bottom-up: dp[i][j] = fewest insert, delete and replace edits turning the first i letters of a into the first j of b. */
export function generateEdit({ a, b }: EditInput): Step<EditState>[] {
  const n = a.length, m = b.length;
  const dp: (number | null)[][] = Array.from({ length: n + 1 }, () => Array.from({ length: m + 1 }, () => null));
  let filled = 0;
  let edits: string[] = [];
  const steps: Step<EditState>[] = [];
  const rowHead = ["-", ...a.split("")];
  const colHead = ["-", ...b.split("")];

  /* The same name twice in a row would give two stops one label, so the repeat carries its position. */
  const fresh = (name: string, at: string) => (steps.length > 0 && steps[steps.length - 1].short === name ? `${name} (${at})` : name);

  const snap = (
    st: Omit<Step<EditState>, "state" | "op">,
    v: { op?: string; i?: number; j?: number; mark?: Record<string, BlockState>; strip?: boolean; slots?: number } = {}
  ) => {
    const grid: Cell[][] = dp.map((row, r) => row.map((x, c) => ({ v: x, state: v.mark?.[`${r},${c}`] })));
    const op = v.op ?? null;
    steps.push({
      ...st, op,
      state: {
        kind: "grid", grid, rowHead, colHead,
        ptrs: v.i !== undefined && v.j !== undefined ? [{ r: v.i, c: v.j, label: "here" }] : [],
        strip: v.strip ? { name: "edits", cells: edits.map((t) => ({ v: t, state: "found" as BlockState })), slots: v.slots } : undefined,
        op, i: v.i ?? null, j: v.j ?? null, filled, dp: dp.map((r) => r.slice()), edits: edits.slice()
      }
    });
  };

  snap({
    kind: "problem", anchors: [], notes: {},
    title: "Edit distance",
    idea: "The fewest edits that turn one word into another. An edit is one insert, delete or replace of a single letter, and the answer is built from shorter prefixes.",
    text: `The words are ${show(a)} and ${show(b)}. You may insert a letter, delete a letter, or replace one letter with another. dp[i][j] is the fewest edits that turn the first i letters of the first word into the first j letters of the second.`
  });

  for (let c = 0; c <= m; c++) dp[0][c] = c;
  for (let r = 1; r <= n; r++) dp[r][0] = r;
  filled = m + 1 + n;
  const edges: Record<string, BlockState> = {};
  for (let c = 0; c <= m; c++) edges[`0,${c}`] = "active";
  for (let r = 1; r <= n; r++) edges[`${r},0`] = "active";
  snap({
    kind: "add", anchors: ["ed.init", "ed.edgecol", "ed.edgerow"],
    notes: { "ed.init": `dp = ${n + 1} rows by ${m + 1} columns`, "ed.edgecol": `column 0 holds 0 to ${n}: delete every letter`, "ed.edgerow": `row 0 holds 0 to ${m}: insert every letter` },
    title: "Base case: edges count 0, 1, 2, ...",
    idea: "Turning i letters into nothing takes i deletes. Building j letters from nothing takes j inserts. So column 0 and row 0 just count up.",
    text: n === 0 || m === 0
      ? `One word is empty. Reaching the other word takes one edit per letter, so the table is just its edge and the answer is ${n + m}. There are no other cells to fill.`
      : `Column 0 holds 0 to ${n}, because ${a} turns into nothing with that many deletes. Row 0 holds 0 to ${m}, because ${b} is built from nothing with that many inserts. The other ${n * m} cells are filled one at a time.`
  }, { op: "edges", mark: edges });

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const same = a[i - 1] === b[j - 1];
      const diag = dp[i - 1][j - 1] as number, up = dp[i - 1][j] as number, left = dp[i][j - 1] as number;
      const op = `i${i} j${j}`;
      const mark: Record<string, BlockState> = {};
      const reads: [number, number][] = same ? [[i - 1, j - 1]] : [[i - 1, j - 1], [i - 1, j], [i, j - 1]];
      for (const [r, c] of reads) mark[`${r},${c}`] = "compare";
      mark[`${i},${j}`] = "active";
      filled++;
      const row = j === 1 ? ["ed.row"] : [];
      const notes: Record<string, string> = { "ed.col": `column ${j}: letter ${j} of the second word is ${b[j - 1]}` };
      if (j === 1) notes["ed.row"] = `letter ${a[i - 1]} of the first word: a new row starts`;
      if (same) {
        dp[i][j] = diag;
        snap({
          kind: "check", anchors: [...row, "ed.col", "ed.match"], notes: { ...notes, "ed.match": `${a[i - 1]} = ${b[j - 1]}: dp[${i}][${j}] = dp[${i - 1}][${j - 1}] = ${diag}` },
          title: `${a[i - 1]} matches: dp[${i}][${j}] = ${diag}`, short: fresh(`${a[i - 1]} = ${b[j - 1]}`, `col ${j}`),
          idea: "When the two letters match, no edit is needed for them. The cell copies the diagonal, the answer for both words without their last letters.",
          text: `Letter ${i} of the first word is ${a[i - 1]} and letter ${j} of the second is ${b[j - 1]}. They match, so nothing is edited. The cell copies the diagonal dp[${i - 1}][${j - 1}] = ${diag}.`
        }, { op, i, j, mark });
      } else {
        const best = Math.min(diag, up, left) + 1;
        const how = diag + 1 === best ? "replace" : up + 1 === best ? "delete" : "insert";
        dp[i][j] = best;
        const why = how === "replace"
          ? `replace ${a[i - 1]} with ${b[j - 1]}, so the diagonal ${diag} plus 1`
          : how === "delete" ? `delete ${a[i - 1]}, so the cell above ${up} plus 1`
            : `insert ${b[j - 1]}, so the cell to the left ${left} plus 1`;
        snap({
          kind: "add", anchors: [...row, "ed.col", "ed.match", "ed.min"],
          notes: { ...notes, "ed.match": `${a[i - 1]} ≠ ${b[j - 1]}: the letters differ`, "ed.min": `dp[${i}][${j}] = 1 + min(${diag}, ${up}, ${left}) = ${best}` },
          title: `${a[i - 1]} ≠ ${b[j - 1]}: dp[${i}][${j}] = ${best} (${how})`, short: fresh(`${a[i - 1]} ≠ ${b[j - 1]}`, `col ${j}`),
          idea: "When the letters differ, one edit is needed. Replace reads the diagonal, delete the cell above, insert the cell to the left. Take the cheapest, add 1.",
          text: `${a[i - 1]} and ${b[j - 1]} differ. Replace costs ${diag} + 1, delete costs ${up} + 1, insert costs ${left} + 1. The cheapest is to ${why}. dp[${i}][${j}] = ${best}.`
        }, { op, i, j, mark });
      }
    }
  }

  // Plan the traceback first so the strip can reserve one slot per edit.
  // Order of preference: keep, replace, delete, insert.
  const total = dp[n][m] as number;
  type Move = { kind: "keep" | "rep" | "del" | "ins"; i: number; j: number };
  const plan: Move[] = [];
  for (let i = n, j = m; i > 0 || j > 0;) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) { plan.push({ kind: "keep", i, j }); i--; j--; }
    else if (i > 0 && j > 0 && dp[i][j] === (dp[i - 1][j - 1] as number) + 1) { plan.push({ kind: "rep", i, j }); i--; j--; }
    else if (i > 0 && dp[i][j] === (dp[i - 1][j] as number) + 1) { plan.push({ kind: "del", i, j }); i--; }
    else { plan.push({ kind: "ins", i, j }); j--; }
  }

  const path: Record<string, BlockState> = {};
  plan.forEach((mv, k) => {
    const { i, j } = mv;
    const cur = `${i},${j}`;
    const mark: Record<string, BlockState> = { ...path, [cur]: "compare" };
    if (i > 0 && j > 0) mark[`${i - 1},${j - 1}`] = "compare";
    if (i > 0) mark[`${i - 1},${j}`] = "compare";
    if (j > 0) mark[`${i},${j - 1}`] = "compare";
    const x = a[i - 1], y = b[j - 1];
    const anchors = ["ed.trace", "ed.tbmatch"];
    const notes: Record<string, string> = { "ed.trace": `row ${i}, column ${j}`, "ed.tbmatch": x !== undefined && x === y ? `${x} = ${y}: no edit` : `no match here` };
    if (k === 0) { anchors.unshift("ed.tbstart"); notes["ed.tbstart"] = `start at the corner (${i}, ${j})`; }
    let short: string, title: string, idea: string, text: string, tag: string, to: string;
    if (mv.kind === "keep") {
      tag = `keep ${x}`; to = `(${i - 1}, ${j - 1})`;
      title = `Keep ${x}`; short = fresh(`back to ${x}`, `row ${i}`);
      idea = "To list the edits, walk back from the corner. When the letters match, keep the letter for free and move diagonally.";
      text = `Letter ${i} of the first word and letter ${j} of the second are both ${x}. Keep it, with no edit, and move up and left to ${to}.`;
    } else {
      anchors.push("ed.tbrep"); notes["ed.tbrep"] = `the cell is not diagonal + 1`;
      if (mv.kind === "rep") {
        tag = `rep ${y}`; to = `(${i - 1}, ${j - 1})`;
        notes["ed.tbrep"] = `the cell is diagonal + 1: replace ${x} with ${y}, move to ${to}`;
        title = `Replace ${x} with ${y}`; short = fresh(`back to ${x}`, `row ${i}`);
        idea = "When the letters differ and the cell is the diagonal plus 1, the edit was a replace. Move diagonally.";
        text = `${x} and ${y} differ, and the cell is the diagonal plus 1. So ${x} was replaced with ${y}. Move up and left to ${to}.`;
      } else {
        anchors.push("ed.tbdel"); notes["ed.tbdel"] = `the cell is not above + 1`;
        if (mv.kind === "del") {
          tag = `del ${x}`; to = `(${i - 1}, ${j})`;
          notes["ed.tbdel"] = `the cell is above + 1: delete ${x}, move to ${to}`;
          title = `Delete ${x}`; short = `up to row ${i - 1}`;
          idea = "When the cell is the cell above plus 1, the edit was a delete. Move up.";
          text = `The cell is the one above plus 1, so letter ${x} was deleted. Move up to ${to}.`;
        } else {
          anchors.push("ed.tbins");
          tag = `ins ${y}`; to = `(${i}, ${j - 1})`;
          notes["ed.tbins"] = `the cell is left + 1: insert ${y}, move to ${to}`;
          title = `Insert ${y}`; short = `left to col ${j - 1}`;
          idea = "When no other move fits, the cell is the cell to the left plus 1, so the edit was an insert. Move left.";
          text = `The cell is the one to the left plus 1, so ${y} was inserted. Move left to ${to}.`;
        }
      }
    }
    edits = [tag, ...edits];
    snap({ kind: "found", anchors, notes, title, short, idea, text }, { op: `back i${i} j${j}`, i, j, mark, strip: true, slots: plan.length });
    path[cur] = "found";
  });
  path["0,0"] = "found";

  const changes = edits.filter((t) => !t.startsWith("keep")).length;
  snap({
    kind: "recap", anchors: ["ed.print", "ed.ret"], notes: { "ed.print": `print the ${edits.length} steps: ${edits.join(", ")}`, "ed.ret": `return ${total}` },
    title: `Edit distance: ${total}`,
    idea: "Every cell was filled once from its neighbours, so the work grows with the length of the first word times the length of the second.",
    text: total === 0
      ? n === 0 && m === 0
        ? "Both words are empty, so no edits are needed and the answer is 0."
        : `The words are equal, so no edits are needed and the answer is 0. The traceback kept every letter.`
      : n === 0 || m === 0
        ? `One word is empty, so the answer is the other word's length, ${total}. Every letter is inserted or deleted.`
        : `${show(a)} turns into ${show(b)} in ${total} edits, and the traceback listed them, with ${edits.length - changes} letters kept. The table had ${n + 1} rows by ${m + 1} columns, and each inner cell was one step.`,
    ret: String(total), retNote: `edits = ${total}`
  }, { op: `return ${total}`, mark: path, strip: edits.length > 0, slots: edits.length });
  return steps;
}

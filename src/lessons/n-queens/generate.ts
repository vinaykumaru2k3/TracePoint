import type { Step } from "../../engine/types";
import type { NumsInput } from "../parseOps";

export interface QueensState {
  n: number;
  /** cols[r] is the column of the queen in row r, for the rows filled so far. */
  cols: number[];
  row: number;
  col: number | null;
  /** The queen that attacks the tried square, as [row, col]. */
  attacker: [number, number] | null;
  /** The square a queen was just lifted from. */
  lifted: [number, number] | null;
  solved: boolean;
}

const fmt = (a: number[]) => `[${a.join(", ")}]`;

/** First solution of N-Queens: fill rows top to bottom, try columns left to right, lift the last queen at a dead end. */
export function generateQueens({ nums }: NumsInput): Step<QueensState>[] {
  const n = nums[0];
  const cols: number[] = [];
  const snap = (s: Omit<Step<QueensState>, "state">, extra: Partial<QueensState> = {}): Step<QueensState> => ({
    ...s, state: { n, cols: cols.slice(), row: cols.length, col: null, attacker: null, lifted: null, solved: false, ...extra }
  });
  const attackerOf = (row: number, c: number): [number, number] | null => {
    for (let r = 0; r < cols.length; r++) {
      if (cols[r] === c || Math.abs(cols[r] - c) === row - r) return [r, cols[r]];
    }
    return null;
  };

  const steps: Step<QueensState>[] = [snap({
    kind: "problem", op: null, anchors: [], notes: {},
    title: `Place ${n} queens on a ${n}×${n} board`,
    idea: "Place one queen per row. If a row has no safe square, the queen above it was in the wrong place: lift it and try further right.",
    text: `No two queens may share a column or a diagonal. Rows go top to bottom and columns left to right, so a board is a list of ${n} column numbers. We stop at the first solution.`
  })];

  const solve = (row: number): boolean => {
    if (row === n) return true;
    for (let c = 0; c < n; c++) {
      const att = attackerOf(row, c);
      if (att) {
        const how = att[1] === c ? "same column" : "same diagonal";
        steps.push(snap({
          kind: "check", op: `try ${row},${c}`,
          anchors: ["nq.loop", "nq.safe"], notes: { "nq.safe": `queen at ${att[0]},${att[1]} attacks ${row},${c} (${how})` },
          title: `${row},${c} is attacked`,
          idea: "One attacking queen is enough to rule a square out.",
          text: `The queen at row ${att[0]}, column ${att[1]} is on the ${how}. Try the next column.`
        }, { row, col: c, attacker: att }));
        continue;
      }
      cols.push(c);
      steps.push(snap({
        kind: "add", op: `place ${row},${c}`,
        anchors: ["nq.loop", "nq.safe", "nq.place"], notes: { "nq.place": `cols = ${fmt(cols)}, go to row ${row + 1}` },
        title: `Place a queen at ${row},${c}`,
        idea: "A safe square is a choice, not a commitment. We go to the next row and find out.",
        text: `Nothing attacks row ${row}, column ${c}. Put a queen there${row + 1 < n ? ` and move on to row ${row + 1}` : ""}.`
      }, { row, col: c }));
      const before = steps.length;
      if (solve(row + 1)) return true;
      const triedBelow = steps.slice(before).some((x) => x.kind === "add" && x.state.row === row + 1);
      cols.pop();
      steps.push(snap({
        kind: "remove", op: `lift ${row},${c}`,
        anchors: ["nq.lift"], notes: { "nq.lift": `${triedBelow ? `every queen in row ${row + 1} hit a dead end` : `row ${row + 1} has no safe square`}, cols = ${fmt(cols)}` },
        title: `Dead end: lift ${row},${c}`,
        idea: "Backtrack: undo the most recent choice and try the next option for it.",
        text: triedBelow
          ? `Every safe square in row ${row + 1} was tried and led to a dead end, so the queen at ${row},${c} cannot be part of a solution. Lift it and try further right in row ${row}.`
          : `Every square in row ${row + 1} is attacked with a queen at ${row},${c}. Lift it and try further right in row ${row}.`
      }, { row, col: c, lifted: [row, c] }));
    }
    return false;
  };

  if (solve(0)) {
    steps.push(snap({
      kind: "found", op: "solved", ret: fmt(cols),
      anchors: ["nq.done"], notes: { "nq.done": `row ${n} reached, cols = ${fmt(cols)}` },
      title: "All queens placed",
      idea: "Reaching the row past the end means every row has a safe queen.",
      text: `Queens sit in columns ${fmt(cols)}, one per row, and none attacks another.`
    }, { solved: true, row: n }));
  } else {
    steps.push(snap({
      kind: "empty", op: "no solution", ret: "[]",
      anchors: ["nq.none"], notes: { "nq.none": "every column in row 0 was tried" },
      title: "No solution",
      idea: "When even row 0 runs out of columns, every arrangement has been ruled out.",
      text: `A ${n}×${n} board can't hold ${n} queens that leave each other alone.`
    }, { row: 0 }));
  }

  steps.push(snap({
    kind: "recap", op: null, anchors: [], notes: {},
    title: "What happened",
    idea: "Backtracking prunes: an attacked square is never extended, so whole branches of the search are skipped.",
    text: `${steps.filter((s) => s.kind === "add").length} placements and ${steps.filter((s) => s.kind === "remove").length} lifts. Trying every arrangement of one queen per row would be ${n}^${n} = ${n ** n} boards. The worst case still grows like n!.`
  }, { solved: steps[steps.length - 1].kind === "found", row: cols.length }));
  return steps;
}

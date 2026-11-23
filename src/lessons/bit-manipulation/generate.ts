import type { Step } from "../../engine/types";
import type { BlockState } from "../../iso/IsoBlock";
import type { Cell } from "../../iso/CellRow";
import type { DPState, Grid } from "../dpkit";

export type OpKind = "and" | "or" | "xor" | "shl" | "shr" | "count" | "pow2";
export interface BitOp { kind: OpKind; a: number; b: number }
export type BitInput = BitOp[];

export type BitState = DPState & {
  op: string | null;
  /** The number under the loop or the latest result, or null before any op. */
  value: number | null;
  /** The latest answer text, or null before any op. */
  res: string | null;
  /** Bits cleared so far by the current count. */
  cleared: number;
};

const COLS = ["7", "6", "5", "4", "3", "2", "1", "0"];
const SYM: Record<string, string> = { and: "&", or: "|", xor: "^", shl: "<<", shr: ">>" };

const bit = (v: number, i: number) => (v >> i) & 1;
/** Column c (0 = leftmost) holds bit 7 - c. */
const col = (i: number) => 7 - i;
const bin = (v: number) => v.toString(2).padStart(8, "0");
const ones = (v: number) => { const o: number[] = []; for (let i = 7; i >= 0; i--) if (bit(v, i)) o.push(i); return o; };
const lowest = (v: number) => { for (let i = 0; i < 8; i++) if (bit(v, i)) return i; return -1; };
const plural = (xs: number[]) => (xs.length === 1 ? `bit ${xs[0]}` : `bits ${xs.join(", ")}`);
const list = (xs: number[]) => (xs.length ? plural(xs) : "no bits");

const row = (v: number, marks: Record<number, BlockState> = {}): Cell[] =>
  COLS.map((_, c) => ({ v: bit(v, 7 - c), state: marks[c] }));

/** The text of one op as the learner types it, e.g. `13 & 6` or `count 13`. */
export const opText = (o: BitOp) => (o.kind === "count" || o.kind === "pow2" ? `${o.kind} ${o.a}` : `${o.a} ${SYM[o.kind]} ${o.b}`);

export function generateBits(ops: BitInput): Step<BitState>[] {
  const steps: Step<BitState>[] = [];
  const opOf: number[] = [];
  let value: number | null = null;
  let res: string | null = null;
  let cur = -1;
  const done: string[] = [];

  const snap = (
    st: Omit<Step<BitState>, "state" | "op">,
    v: { op?: string; rows: Cell[][]; heads: string[]; cleared?: number; ptrs?: { r: number; c: number; label: string }[]; tiles?: number[]; slots?: number }
  ) => {
    const op = v.op ?? null;
    const grid: Grid = v.rows;
    opOf.push(cur);
    steps.push({
      ...st, op,
      state: {
        kind: "grid", grid, rowHead: v.heads, colHead: COLS, ptrs: v.ptrs ?? [],
        strip: v.tiles ? { name: "cleared", cells: v.tiles.map((t) => ({ v: t, state: "found" as BlockState })), slots: v.slots } : undefined,
        op, value, res, cleared: v.cleared ?? 0
      }
    });
  };

  snap({
    kind: "problem", anchors: [], notes: {},
    title: "Bit manipulation",
    idea: "A number is a row of bits, and a few operators read or change those bits one place at a time.",
    text: `A bit is a single 0 or 1. Each number from 0 to 255 is a row of 8 bits, with bit 7 on the left and bit 0 on the right. A bit that is 1 is called set. ${ops.length} operation${ops.length === 1 ? "" : "s"} follow, and each one draws its bits on plates.`
  }, { rows: [row(ops[0].a)], heads: [String(ops[0].a)] });

  ops.forEach((o, k) => {
    cur = k;
    const { a, b } = o;
    if (o.kind === "and" || o.kind === "or" || o.kind === "xor") {
      const r = o.kind === "and" ? a & b : o.kind === "or" ? a | b : a ^ b;
      const sym = SYM[o.kind];
      const marks = [{} as Record<number, BlockState>, {} as Record<number, BlockState>, {} as Record<number, BlockState>];
      for (const i of ones(r)) {
        marks[2][col(i)] = "active";
        if (bit(a, i)) marks[0][col(i)] = "compare";
        if (bit(b, i)) marks[1][col(i)] = "compare";
      }
      value = r; res = String(r);
      const rule = o.kind === "and" ? "AND sets a result bit only where both numbers have a 1."
        : o.kind === "or" ? "OR sets a result bit where either number has a 1."
          : "XOR sets a result bit where the two numbers differ.";
      const anchor = `bit.${o.kind}`;
      snap({
        kind: "add", anchors: [anchor], notes: { [anchor]: `${a} ${sym} ${b} = ${r}` },
        title: `${a} ${sym} ${b} = ${r}`,
        idea: rule,
        text: `${a} is ${bin(a)} and ${b} is ${bin(b)}. ${rule} The result has ${list(ones(r))} set, so it is ${bin(r)}, which is ${r}.${o.kind === "and" && r === 0 ? " The two numbers share no set bit." : ""}`,
        ret: String(r), retNote: `${a} ${sym} ${b}`
      }, { op: `${a} ${sym} ${b}`, rows: [row(a, marks[0]), row(b, marks[1]), row(r, marks[2])], heads: [String(a), `${sym} ${b}`, `= ${r}`] });
    } else if (o.kind === "shl" || o.kind === "shr") {
      const left = o.kind === "shl";
      const sym = left ? "<<" : ">>";
      const r = left ? (a << b) & 0xff : a >> b;
      const src: Record<number, BlockState> = {}, dst: Record<number, BlockState> = {};
      const lost: number[] = [];
      for (const i of ones(a)) {
        const to = left ? i + b : i - b;
        if (to < 0 || to > 7) { src[col(i)] = "swap"; lost.push(i); } else { src[col(i)] = "compare"; dst[col(to)] = "active"; }
      }
      value = r; res = String(r);
      const dir = left ? "left" : "right";
      const mv = b === 0 ? "The shift is 0 places, so every bit stays where it is." : `Every bit moves ${b} place${b === 1 ? "" : "s"} to the ${dir}.`;
      const drop = lost.length
        ? ` ${plural(lost)} ${lost.length === 1 ? "was" : "were"} set and moved past the ${dir} edge, so ${lost.length === 1 ? "it was" : "they were"} dropped.${left ? ` Without the 8 bit limit the answer would be ${a << b}, and the code masks with 0xFF to keep ${r}.` : ""}`
        : a === 0 ? " There is no set bit to move." : ` No set bit passes the ${dir} edge, so nothing is lost.`;
      const anchor = left ? "bit.shl" : "bit.shr";
      snap({
        kind: "move", anchors: [anchor], notes: { [anchor]: `${a} ${sym} ${b} = ${r}` },
        title: `${a} ${sym} ${b} = ${r}`,
        idea: left
          ? "A left shift moves every bit toward bit 7 and drops what passes the edge. With no drop it multiplies by 2 for each place."
          : "A right shift moves every bit toward bit 0 and drops what passes the edge. It divides by 2 for each place, rounding down.",
        text: `${a} is ${bin(a)}. ${mv}${drop} The result is ${bin(r)}, which is ${r}.`,
        ret: String(r), retNote: `${a} ${sym} ${b}`
      }, { op: `${a} ${sym} ${b}`, rows: [row(a, src), row(r, dst)], heads: [String(a), `= ${r}`] });
    } else if (o.kind === "pow2") {
      const yes = a > 0 && (a & (a - 1)) === 0;
      res = String(yes);
      const op = `pow2 ${a}`;
      if (a === 0) {
        value = 0;
        snap({
          kind: "check", anchors: ["bit.pow2"], notes: { "bit.pow2": "n > 0 fails, so false" },
          title: "pow2 0 is false",
          idea: "A power of two has exactly one set bit. Zero has none, so the test needs n > 0 first.",
          text: `0 is ${bin(0)} and has no set bit, so it is not a power of two. The check n > 0 fails before n & (n - 1) is tried.`,
          ret: "false", retNote: "0 is not a power of two"
        }, { op, rows: [row(0)], heads: ["0"] });
      } else {
        const m = a - 1, r = a & m, lo = lowest(a);
        const mk: Record<number, BlockState>[] = [{ [col(lo)]: "active" }, {}, {}];
        for (let i = 0; i <= lo; i++) mk[1][col(i)] = "compare";
        if (yes) for (let c = 0; c < 8; c++) mk[2][c] = "found";
        value = r;
        snap({
          kind: "check", anchors: ["bit.pow2"], notes: { "bit.pow2": `${a} & ${m} = ${r}, so ${yes}` },
          title: `pow2 ${a} is ${yes}`,
          idea: "n & (n - 1) clears the lowest set bit. A power of two has only one set bit, so clearing it leaves 0.",
          text: `${a} is ${bin(a)} and ${a} - 1 is ${bin(m)}. ${a} & ${m} = ${r}. ${yes ? "Nothing is left, so the number had one set bit and is a power of two." : `${bin(r)} still has ${list(ones(r))} set, so ${a} has more than one set bit and is not a power of two.`}`,
          ret: String(yes), retNote: yes ? `${a} is a power of two` : `${a} is not a power of two`
        }, { op, rows: [row(a, mk[0]), row(m, mk[1]), row(r, mk[2])], heads: [String(a), `& ${m}`, `= ${r}`], ptrs: [{ r: 0, c: col(lo), label: "low" }] });
      }
    } else {
      const total = ones(a).length;
      let n = a, cleared = 0;
      const tiles: number[] = [];
      while (n !== 0) {
        const lo = lowest(n), m = n - 1, r = n & m;
        const mk: Record<number, BlockState>[] = [{ [col(lo)]: "active" }, {}, {}];
        for (let i = 0; i <= lo; i++) mk[1][col(i)] = "compare";
        cleared++; tiles.push(lo);
        value = r;
        snap({
          kind: "remove", anchors: ["bit.loop", "bit.clear", "bit.tally"],
          notes: { "bit.loop": `n = ${n}, not 0 yet`, "bit.clear": `${n} & ${m} = ${r}`, "bit.tally": `count = ${cleared}` },
          title: `Clear bit ${lo}: ${n} becomes ${r}`,
          idea: "n & (n - 1) clears the lowest set bit. Subtracting 1 turns that bit into 0 and every bit below it into 1, and the AND cancels those lower bits.",
          text: `${n} is ${bin(n)} and its lowest set bit is bit ${lo}. ${n} - 1 is ${bin(m)}, so ${n} & ${m} = ${r}, which is ${bin(r)}. One set bit is gone, and count is now ${cleared}.`
        }, { op: `clear bit ${lo}`, rows: [row(n, mk[0]), row(m, mk[1]), row(r, mk[2])], heads: [String(n), `& ${m}`, `= ${r}`], cleared, tiles: tiles.slice(), slots: total, ptrs: [{ r: 0, c: col(lo), label: "low" }] });
        n = r;
      }
      res = String(total); value = 0;
      snap({
        kind: "found", anchors: ["bit.loop", "bit.ret"],
        notes: { "bit.loop": "n = 0, the loop ends", "bit.ret": `return ${total}` },
        title: `count ${a} = ${total}`,
        idea: "Each pass clears one set bit, so the loop runs once per set bit, not once per bit position.",
        text: total === 0
          ? "0 has no set bit, so the loop never runs and the count is 0."
          : `n reached 0 after ${total} pass${total === 1 ? "" : "es"}, one for each set bit of ${a}. The count is ${total}.`,
        ret: String(total), retNote: `${a} has ${total} set bit${total === 1 ? "" : "s"}`
      }, { op: `count = ${total}`, rows: [row(0)], heads: ["0"], cleared: total, tiles: tiles.slice(), slots: total });
    }
    done.push(`${opText(o)} = ${steps[steps.length - 1].ret}`);
  });

  // A repeated op gives two neighbours the same rail name: tell them apart by position.
  const name = (s: Step<BitState>) => s.short ?? s.op;
  for (let i = 1; i < steps.length; i++) {
    if (steps[i].op && name(steps[i]) === name(steps[i - 1])) steps[i].short = `${opOf[i] + 1}: ${steps[i].op}`;
  }

  cur = -1;
  snap({
    kind: "recap", anchors: [], notes: {},
    title: "Bits, one place at a time",
    idea: "Every result here is plain arithmetic on rows of 8 bits: AND, OR and XOR compare columns, shifts slide the row, and n & (n - 1) clears the lowest set bit.",
    text: `Results: ${done.join(", ")}.`,
    ret: res ?? undefined
  }, { rows: [row(value ?? 0)], heads: [String(value ?? 0)] });

  return steps;
}

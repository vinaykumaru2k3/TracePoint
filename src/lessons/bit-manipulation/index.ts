import { defineLesson, type ParseResult } from "../../engine/types";
import DPScene from "../DPScene";
import { tableMemory } from "../dpkit";
import { generateBits, type BitInput, type BitOp, type BitState } from "./generate";
import java from "./code/Main.java?raw";
import python from "./code/main.py?raw";
import cpp from "./code/main.cpp?raw";
import theory from "./theory";

const FORMAT = 'Type up to 7 operations separated by commas, like "13 & 6, count 13". Forms: a & b, a | b, a ^ b, a << k, a >> k, count a, pow2 a.';
const MAX_OPS = 7;

function parseBits(text: string): ParseResult<BitInput> {
  const items = text.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);
  if (!items.length) return { ok: false, error: FORMAT };
  if (items.length > MAX_OPS) return { ok: false, error: `Keep it to ${MAX_OPS} operations or fewer so the steps stay readable.` };
  const ops: BitOp[] = [];
  const big = (t: string) => `${Number(t)} is out of range. Use values from 0 to 255, because a value has 8 bits.`;
  for (const it of items) {
    let m: RegExpMatchArray | null;
    if ((m = it.match(/^(\d+)\s*(&|\||\^)\s*(\d+)$/))) {
      if (Number(m[1]) > 255) return { ok: false, error: big(m[1]) };
      if (Number(m[3]) > 255) return { ok: false, error: big(m[3]) };
      ops.push({ kind: m[2] === "&" ? "and" : m[2] === "|" ? "or" : "xor", a: Number(m[1]), b: Number(m[3]) });
    } else if ((m = it.match(/^(\d+)\s*(<<|>>)\s*(\d+)$/))) {
      if (Number(m[1]) > 255) return { ok: false, error: big(m[1]) };
      if (Number(m[3]) > 7) return { ok: false, error: `The shift ${Number(m[3])} is out of range. Shift by 0 to 7 places, because a value has only 8 bits.` };
      ops.push({ kind: m[2] === "<<" ? "shl" : "shr", a: Number(m[1]), b: Number(m[3]) });
    } else if ((m = it.match(/^(count|pow2)\s+(\d+)$/i))) {
      if (Number(m[2]) > 255) return { ok: false, error: big(m[2]) };
      ops.push({ kind: m[1].toLowerCase() === "count" ? "count" : "pow2", a: Number(m[2]), b: 0 });
    } else {
      return { ok: false, error: `Could not read "${it}". ${FORMAT}` };
    }
  }
  return { ok: true, input: ops };
}

export default defineLesson<BitInput, BitState>({
  id: "bit-manipulation",
  title: "Bit manipulation",
  subtitle: "Numbers as rows of 8 bits: AND, OR, XOR, shifts, and n & (n - 1) to count bits and spot powers of two.",
  minutes: 8,
  level: "intermediate",
  section: "advanced",

  inputLabel: "operations",
  inputHint: "Up to 7 operations separated by commas. Values 0 to 255, shifts 0 to 7. Forms: 13 & 6, 13 | 6, 13 ^ 6, 13 << 1, 13 >> 2, count 13, pow2 16.",
  defaultText: "13 & 6, 13 | 6, 13 ^ 6, 13 << 1, 13 >> 2, count 13, pow2 16",
  presets: [
    { label: "all seven", text: "13 & 6, 13 | 6, 13 ^ 6, 13 << 1, 13 >> 2, count 13, pow2 16" },
    { label: "overflow", text: "200 << 1, 200 << 3, 200 >> 3, 255 >> 7" },
    { label: "count 255", text: "count 255" },
    { label: "powers of two", text: "pow2 16, pow2 12, pow2 0, pow2 1" },
    { label: "no overlap", text: "5 & 10, 5 | 10, 5 ^ 10, 5 & 5" }
  ],
  parse: parseBits,
  generate: generateBits,

  Scene: DPScene,
  legend: [{ cls: "s-active", label: "bit set in the result" }, { cls: "s-compare", label: "input bits that decide it" }, { cls: "s-swap", label: "bit dropped off the edge" }, { cls: "s-found", label: "answer" }],
  metrics: ({ state: s }) => [
    { label: "Result", value: s.res ?? "-" },
    { label: "Value", value: s.value ?? "-" },
    { label: "Bits cleared", value: s.cleared }
  ],
  memory: ({ state: s }) => s.kind === "grid"
    ? tableMemory("In memory: int bits", s.grid, s.rowHead, s.colHead,
        "Each row is one number as 8 bits, bit 7 first. A 1 means that bit is set.")
    : { title: "In memory: int bits", note: "", cells: [] },
  vars: ({ state: s }) => `n = ${s.value ?? "-"}   result = ${s.res ?? "-"}   cleared = ${s.cleared}`,
  costs: [["AND, OR, XOR", "O(1)"], ["shift", "O(1)"], ["count bits", "O(k)"], ["power of two", "O(1)"]],
  learn: [
    ["AND keeps a 1 only where both have one", (s) => s.anchors.includes("bit.and")],
    ["OR and XOR combine columns", (s) => s.anchors.includes("bit.or") || s.anchors.includes("bit.xor")],
    ["a shift can drop bits off the edge", (s) => (s.anchors.includes("bit.shl") || s.anchors.includes("bit.shr")) && /dropped/.test(s.text)],
    ["n & (n - 1) clears the lowest set bit", (s) => s.anchors.includes("bit.clear")],
    ["a power of two has one set bit", (s) => s.anchors.includes("bit.pow2") && s.ret === "true"]
  ],

  theory,

  code: { java, python, cpp }
});

import { defineLesson, toneOf, type MemoryView, type ParseResult } from "../../engine/types";
import { parseNums } from "../parseOps";
import TreeScene from "../TreeScene";
import { SEG_MAX, SEG_OPS, generateSegmentTree, type SegInput, type SegOp, type SegState } from "./generate";
import java from "./code/Main.java?raw";
import python from "./code/main.py?raw";
import cpp from "./code/main.cpp?raw";
import theory from "./theory";

const FORMAT = `Type "array" and 1 to ${SEG_MAX} values, then up to ${SEG_OPS} operations separated by commas, like "array 2 1 5 3 4, query 1 3, update 2 0".`;
const PHASE = { build: "build", query: "query", update: "update", done: "done" } as const;

function parseSegment(text: string): ParseResult<SegInput> {
  const parts = text.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);
  if (!parts.length || !/^array\b/i.test(parts[0])) return { ok: false, error: `Start with the array. ${FORMAT}` };
  const head = parts[0].replace(/^array\b/i, "").trim();
  if (!head) return { ok: false, error: `Give at least one value after "array". ${FORMAT}` };
  const arr = parseNums(head, { minLen: 1, maxLen: SEG_MAX });
  if (!arr.ok) return { ok: false, error: arr.error.includes("0 to 99") || arr.error.includes("whole number") ? arr.error : `${arr.error} The array has 1 to ${SEG_MAX} values from 0 to 99.` };
  const n = arr.input.nums.length;
  const rest = parts.slice(1);
  if (!rest.length) return { ok: false, error: `Add at least one operation after the array, like "query 1 3". ${FORMAT}` };
  if (rest.length > SEG_OPS) return { ok: false, error: `Keep it to ${SEG_OPS} operations or fewer so the steps stay readable.` };
  const ops: SegOp[] = [];
  for (const p of rest) {
    const w = p.toLowerCase().split(/\s+/);
    const nums = w.slice(1);
    if (w[0] !== "query" && w[0] !== "update") return { ok: false, error: `Unknown operation "${w[0]}". Use query or update.` };
    const want = 2;
    if (nums.length !== want || nums.some((x) => !/^\d{1,3}$/.test(x))) {
      return { ok: false, error: w[0] === "query" ? `query needs two whole numbers, the first and last position, like "query 1 3".` : `update needs a position and a new value, like "update 2 0".` };
    }
    const [x, y] = nums.map(Number);
    if (w[0] === "query") {
      if (x > y) return { ok: false, error: `"query ${x} ${y}" ends at ${y}, which is not after its start ${x}. Put the smaller position first.` };
      if (y >= n) return { ok: false, error: `Position ${y} is outside the array. With ${n} value${n === 1 ? "" : "s"}, positions run from 0 to ${n - 1}.` };
      ops.push({ kind: "query", l: x, r: y });
    } else {
      if (x >= n) return { ok: false, error: `Position ${x} is outside the array. With ${n} value${n === 1 ? "" : "s"}, positions run from 0 to ${n - 1}.` };
      if (y > 99) return { ok: false, error: "Values go from 0 to 99 so they fit in the blocks." };
      ops.push({ kind: "update", i: x, v: y });
    }
  }
  return { ok: true, input: { nums: arr.input.nums, ops } };
}

export default defineLesson<SegInput, SegState>({
  id: "segment-tree",
  title: "Segment tree",
  subtitle: "Store the sum of every half of the array in a tree, so range sums and point updates both take O(log n).",
  minutes: 9,
  level: "advanced",
  section: "advanced",

  inputLabel: "Array and operations",
  inputHint: `"array" and 1 to ${SEG_MAX} values from 0 to 99, then up to ${SEG_OPS} operations: query l r (inclusive, 0-based) or update i v.`,
  defaultText: "array 2 1 5 3 4, query 1 3, update 2 0, query 1 3",
  presets: [
    { label: "default", text: "array 2 1 5 3 4, query 1 3, update 2 0, query 1 3" },
    { label: "one value", text: "array 7, query 0 0, update 0 4, query 0 0" },
    { label: "two values", text: "array 3 9, query 0 1, update 1 1, query 1 1" },
    { label: "whole array", text: "array 4 8 1 6 2, query 0 4, update 4 9, query 0 4" },
    { label: "awkward range", text: "array 3 1 4 1 5 9 2 6, query 1 6, query 2 5, update 6 0" }
  ],
  parse: parseSegment,
  generate: generateSegmentTree,

  Scene: TreeScene,
  legend: [
    { cls: "s-active", label: "node being split, set or re-added" },
    { cls: "s-compare", label: "children read, or positions of a asked or changed" },
    { cls: "s-found", label: "node taken whole into the answer" },
    { cls: "s-visited", label: "split or passed, still waiting" },
    { cls: "s-stale", label: "outside the query, adds 0" }
  ],
  metrics: ({ state: s }) => [
    { label: "Phase", value: s.phase ? PHASE[s.phase] : "-" },
    { label: "Total so far", value: s.phase === "query" ? s.acc : "-" },
    { label: "Nodes visited", value: s.phase === "query" || s.phase === "update" ? s.visits : "-" },
    { label: "Nodes in tree", value: s.t.filter((x) => x !== null).length }
  ],
  memory: ({ state: s }): MemoryView => ({
    title: "In memory: int[] t",
    note: "The tree is stored as an array. Node t[i] has its children at t[2i] and t[2i + 1], and the root is t[1]. A _ is a slot with no node yet.",
    cells: s.t.map((v, k) => {
      const st = s.nodes.find((x) => x.id === k + 1)?.state;
      return { v, tag: `t[${k + 1}]`, live: v !== null, act: st === "active" || toneOf(st) !== undefined, tone: toneOf(st), marks: [] };
    })
  }),
  vars: ({ state: s }) => `a = [${s.a.join(", ")}]${s.phase === "query" ? `   total = ${s.acc}` : ""}`,
  costs: [["build", "O(n)"], ["range sum query", "O(log n)"], ["point update", "O(log n)"], ["space", "O(n)"]],
  learn: [
    ["each internal node adds its two children", (s) => s.anchors.includes("build.sum")],
    ["a node fully inside the query is taken whole", (s) => s.anchors.includes("query.in")],
    ["a node fully outside the query adds 0", (s) => s.anchors.includes("query.out")],
    ["a partial overlap asks both children", (s) => s.anchors.includes("query.split")],
    ["an update sets one leaf and fixes the sums above", (s) => s.anchors.includes("update.fix")]
  ],

  theory,

  code: { java, python, cpp }
});

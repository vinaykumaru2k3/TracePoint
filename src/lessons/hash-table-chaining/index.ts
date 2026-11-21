import { defineLesson, toneOf, type MemoryView } from "../../engine/types";
import { parseOps, type Op } from "../parseOps";
import Scene from "./Scene";
import { BUCKETS, CHAIN_MAX, generateChaining, type ChainState } from "./generate";
import java from "./code/Main.java?raw";
import python from "./code/main.py?raw";
import cpp from "./code/main.cpp?raw";

/** Rejects inputs whose chains would grow past what the stage can show. */
function fits(ops: Op[]): boolean {
  const set = new Set<number>();
  for (const { name, v = 0 } of ops) {
    if (name === "add") set.add(v);
    if (name === "remove") set.delete(v);
    if ([...set].filter((k) => k % BUCKETS === v % BUCKETS).length > CHAIN_MAX) return false;
  }
  return true;
}

/** A bucket cell takes the strongest colour of its chain, or the bucket colour while it is only being looked at. */
const bucketTone = (c: { state?: string }[]) =>
  (["found", "compare", "active"] as const).find((t) => c.some((e) => e.state === t)) ?? toneOf("visited");

export default defineLesson<Op[], ChainState>({
  id: "hash-table-chaining",
  title: "Hash table: chaining",
  subtitle: "Hash a key to a bucket, then scan that bucket's short chain.",
  minutes: 6,
  level: "beginner",
  section: "hashing",

  inputLabel: "Operations",
  inputHint: `add N, contains N, remove N. Keys go in bucket N % ${BUCKETS}.`,
  defaultText: "add 12, add 7, add 22, add 3, contains 17, contains 22, remove 7, add 15",
  presets: [
    { label: "Duplicate add", text: "add 4, add 9, add 4, contains 9" },
    { label: "Everything collides", text: "add 5, add 10, add 15, add 20, contains 25" },
    { label: "Remove, then miss", text: "add 8, add 13, remove 8, contains 8, remove 1" }
  ],
  parse: (text) => {
    const r = parseOps(text, ["add", "contains", "remove"], [], { insert: "add", put: "add", has: "contains", find: "contains", delete: "remove", del: "remove" });
    if (r.ok && !fits(r.input)) return { ok: false, error: `A bucket can show up to ${CHAIN_MAX} keys. Spread the keys out a little.` };
    return r;
  },
  generate: generateChaining,

  Scene,
  legend: [{ cls: "s-visited", label: "bucket" }, { cls: "s-compare", label: "comparing" }, { cls: "s-found", label: "match" }, { cls: "s-active", label: "added" }],
  metrics: ({ state: s }) => [
    { label: "Size", value: s.size },
    { label: "Bucket", value: s.bucket ?? "-" },
    { label: "Load", value: (s.size / BUCKETS).toFixed(1) },
    { label: "Longest", value: Math.max(...s.chains.map((c) => c.length)) }
  ],
  memory: ({ state: s }): MemoryView => ({
    title: "In memory: LinkedList[] buckets",
    note: "An array of list heads. Each bucket points at its own chain of nodes, or holds an empty list.",
    cells: s.chains.map((c, i) => ({
      v: c.length ? c.map((e) => e.v).join("→") : "empty", live: c.length > 0, act: i === s.bucket, tone: bucketTone(c), marks: [], tag: `[${i}]`
    }))
  }),
  vars: ({ state: s }) => `size = ${s.size}   buckets = ${BUCKETS}`,
  costs: [["add", "O(1) avg"], ["contains", "O(1) avg"], ["remove", "O(1) avg"], ["worst case", "O(n)"]],
  learn: [
    ["key % 5 picks the bucket", (s) => s.anchors.includes("hash")],
    ["colliding keys share one chain", (s) => s.kind === "add" && s.state.chains.some((c) => c.length > 1)],
    ["a set ignores duplicate adds", (s) => s.anchors.includes("add.dup")],
    ["contains scans only one chain", (s) => s.anchors.includes("contains.miss") || s.anchors.includes("contains.hit")],
    ["remove unlinks from that chain", (s) => s.anchors.includes("remove.hit")]
  ],

  code: { java, python, cpp }
});

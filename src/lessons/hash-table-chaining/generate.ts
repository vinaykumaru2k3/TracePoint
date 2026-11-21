import type { Step } from "../../engine/types";
import type { Entry } from "../../iso/Buckets";
import type { BlockState } from "../../iso/IsoBlock";
import type { Op } from "../parseOps";

export const BUCKETS = 5;
export const CHAIN_MAX = 5;

export interface ChainState {
  chains: Entry[][];
  /** Bucket the step works in. */
  bucket: number | null;
  /** Entry the scan is on, by id, or the bucket itself when its chain is empty. */
  flag: { id?: number; bucket?: number; label: string } | null;
  size: number;
}

/** Simulates a hash set with separate chaining: key % 5 picks a bucket, each bucket keeps a list. */
export function generateChaining(ops: Op[]): Step<ChainState>[] {
  let nextId = 1;
  const chains: { id: number; v: number }[][] = Array.from({ length: BUCKETS }, () => []);
  const size = () => chains.reduce((a, c) => a + c.length, 0);
  const snap = (s: Omit<Step<ChainState>, "state">, x: Partial<ChainState> = {}, st: Record<number, BlockState> = {}): Step<ChainState> => ({
    ...s,
    state: { chains: chains.map((c) => c.map((e) => ({ ...e, state: st[e.id] }))), bucket: null, flag: null, size: size(), ...x }
  });
  const show = (b: number) => (chains[b].length ? chains[b].map((e) => e.v).join(" → ") : "empty");

  const steps: Step<ChainState>[] = [snap({
    kind: "problem", op: null, anchors: [], notes: {},
    title: "Jump straight to the right list",
    idea: "A hash turns a key into a bucket number, so a lookup scans one short list instead of everything.",
    text: `A hash set with ${BUCKETS} buckets. A key goes in bucket key % ${BUCKETS}. Keys that land in the same bucket collide and share that bucket's chain.`
  })];

  for (const { name, v = 0 } of ops) {
    const b = v % BUCKETS, X = name, op = `${name}(${v})`;
    const intro = name === "contains" ? [`${X}.sig`, "hash"] : [`${X}.sig`, "hash", `${X}.bucket`];
    steps.push(snap({
      kind: "check", op, anchors: intro, notes: { hash: `${v} % ${BUCKETS} = ${b}` },
      title: `${v} hashes to bucket ${b}`, idea: "Hashing is O(1). It skips every other bucket.",
      text: `${v} % ${BUCKETS} = ${b}. Bucket ${b} holds: ${show(b)}.`
    }, { bucket: b, flag: { bucket: b, label: `${v} % ${BUCKETS}` } }));

    let at = -1;
    for (let j = 0; j < chains[b].length; j++) {
      const e = chains[b][j], match = e.v === v;
      const scan = `${X}.scan`;
      if (match) at = j;
      steps.push(snap({
        kind: match ? "found" : "check", op,
        ret: match && name === "contains" ? "true" : match && name === "add" ? "false" : undefined,
        retNote: match && name === "add" ? "already in the set" : undefined,
        anchors: match ? (name === "add" ? [scan, "add.dup"] : name === "contains" ? [scan, "contains.hit"] : [scan]) : [scan],
        notes: { [scan]: `k = ${e.v}${match ? ` == ${v}` : ` != ${v}`}` },
        title: match ? `Found ${v} in bucket ${b}` : `Compare with ${e.v}`,
        idea: match ? (name === "add" ? "A set keeps one copy, so a duplicate add changes nothing." : "Only this one chain was scanned.")
          : "Collisions cost extra comparisons, so a good hash spreads keys evenly.",
        text: match ? (name === "add" ? `${v} is already here, so add returns false.` : name === "contains" ? `${v} is in the chain, so contains returns true.` : `${v} is in the chain. Unlink it.`)
          : `${e.v} is not ${v}. Move along the chain.`
      }, { bucket: b, flag: { id: e.id, label: "k" } }, { [e.id]: match ? "found" : "compare" }));
      if (match) break;
    }

    if (name === "add") {
      if (at >= 0) continue;
      const e = { id: nextId++, v };
      chains[b].push(e);
      steps.push(snap({
        kind: "add", op, ret: "true", anchors: ["add.append"], notes: { "add.append": `bucket ${b}: ${show(b)}` },
        title: `Append ${v} to bucket ${b}`,
        idea: chains[b].length > 1 ? "This is a collision: two keys share a bucket and the chain grows." : "An empty bucket gets its first entry.",
        text: `${v} is not in the set, so it joins the end of bucket ${b}'s chain. Load factor: ${size()} / ${BUCKETS} = ${(size() / BUCKETS).toFixed(1)}.`
      }, { bucket: b, flag: { id: e.id, label: "new" } }, { [e.id]: "active" }));
    } else if (name === "contains") {
      if (at >= 0) continue;
      steps.push(snap({
        kind: "check", op, ret: "false", anchors: ["contains.miss"], notes: { "contains.miss": `${v} not in bucket ${b}` },
        title: `${v} is not in the set`, idea: "A miss scans only one chain, not the whole table.",
        text: `Bucket ${b}'s chain ended without ${v}, so contains returns false.`
      }, { bucket: b, flag: { bucket: b, label: "miss" } }));
    } else {
      if (at < 0) {
        steps.push(snap({
          kind: "check", op, ret: "false", anchors: ["remove.miss"], notes: { "remove.miss": `${v} not in bucket ${b}` },
          title: `${v} is not there`, idea: "Nothing to remove, so the table is unchanged.",
          text: `Bucket ${b} does not hold ${v}, so remove returns false.`
        }, { bucket: b, flag: { bucket: b, label: "miss" } }));
        continue;
      }
      chains[b].splice(at, 1);
      steps.push(snap({
        kind: "remove", op, ret: "true", anchors: ["remove.hit"], notes: { "remove.hit": `bucket ${b}: ${show(b)}` },
        title: `Unlink ${v}`, idea: "Removing from a chain is a linked-list unlink. Other buckets are untouched.",
        text: `${v} leaves bucket ${b}. The chain is now: ${show(b)}.`
      }, { bucket: b, flag: { bucket: b, label: "removed" } }));
    }
  }

  steps.push(snap({
    kind: "recap", op: null, anchors: [], notes: {},
    title: "What happened",
    idea: "With short chains, add, contains and remove are O(1) on average.",
    text: `The set holds ${size()} key${size() === 1 ? "" : "s"} in ${BUCKETS} buckets. Each operation hashed once and scanned a single chain. If too many keys collide, chains get long, so real tables grow and rehash once the load factor passes about 0.75.`
  }));
  return steps;
}

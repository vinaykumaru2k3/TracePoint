import type { Step } from "../../engine/types";
import type { BlockState } from "../../iso/IsoBlock";
import type { NumsInput } from "../parseOps";
import { fmt, SortTrace, type SortState } from "../sortkit";

const range = (l: number, r: number, state: BlockState): Partial<Record<number, BlockState>> =>
  Object.fromEntries(Array.from({ length: r - l + 1 }, (_, k) => [l + k, state]));

/** Top-down merge sort. The merge buffer `tmp` is drawn under the range being merged. */
export function generateMerge({ nums }: NumsInput): Step<SortState>[] {
  const t = new SortTrace(nums);
  const a = t.s.a as number[];
  const n = a.length;
  t.push({
    kind: "problem", op: null, anchors: [], notes: {},
    title: `Sort ${fmt(a)} with merge sort`,
    idea: "Two sorted halves merge into one sorted run in a single pass.",
    text: "Split the array in half again and again until every piece is one value, which is sorted by itself. Then merge pieces back together, always taking the smaller front value."
  });

  const sort = (l: number, r: number) => {
    if (l >= r) return;
    const m = (l + r) >> 1;
    const single = m === l || m + 1 === r;
    t.push({
      kind: "move", op: `split ${l}..${r}`, anchors: single ? ["ms.split", "ms.base"] : ["ms.split"],
      notes: single
        ? { "ms.split": `mid = ${m}: ${l}..${m} and ${m + 1}..${r}`, "ms.base": "a one-element half is already sorted" }
        : { "ms.split": `mid = ${m}: ${l}..${m} and ${m + 1}..${r}` },
      title: `Split ${fmt(a.slice(l, r + 1))}`,
      idea: "Splitting does no sorting work; it only makes the pieces small enough to merge.",
      text: `Range ${l}..${r} splits at mid ${m} into ${fmt(a.slice(l, m + 1))} and ${fmt(a.slice(m + 1, r + 1))}.${single ? " A piece of one value is sorted already." : ""}`
    }, { marks: range(l, r, "visited"), ptrs: [{ at: l, label: "l" }, { at: r, label: "r" }] });
    sort(l, m);
    sort(m + 1, r);
    merge(l, m, r);
  };

  const merge = (l: number, m: number, r: number) => {
    const tmp: (number | null)[] = Array(r - l + 1).fill(null);
    t.s.aux = tmp;
    t.s.auxName = "tmp";
    t.s.auxAt = l;
    t.s.auxIndexFrom = l;
    let i = l, j = m + 1, k = 0;
    const heads = (): Partial<SortState> => ({
      ptrs: [...(i <= m ? [{ at: i, label: "i" }] : []), ...(j <= r ? [{ at: j, label: "j" }] : [])],
      auxPtrs: k < tmp.length ? [{ at: k, label: "k" }] : []
    });
    const take = (from: number, rest: boolean) => {
      const anchor = `ms.${rest ? "rest" : "take"}${from <= m ? "L" : "R"}`;
      const v = a[from];
      tmp[k++] = v;
      t.s.swaps++;
      t.push({
        kind: "add", op: `take ${v}`, anchors: [anchor],
        notes: { [anchor]: `tmp[${k - 1}] = ${v}` },
        title: rest ? `Copy the leftover ${v}` : `${v} goes into tmp`,
        idea: rest ? "Once one half runs out, the rest of the other half is already in order." : "The smaller head is the smallest value left in both halves.",
        text: rest ? `One half is empty, so ${v} is copied straight across.` : `${v} is the smaller head, so it is next in the merged run: ${fmt(tmp.slice(0, k))}.`
      }, { marks: { [from]: "active" }, ...heads() });
    };
    while (i <= m && j <= r) {
      t.s.compares++;
      const left = a[i] <= a[j];
      t.push({
        kind: "check", op: "L[i] <= R[j]?", short: `${a[i]} <= ${a[j]}?`, anchors: ["ms.cmp"],
        notes: { "ms.cmp": `${a[i]} <= ${a[j]}? ${left ? "yes, take left" : "no, take right"}` },
        title: a[i] === a[j] ? `${a[i]} = ${a[j]}: take the left one` : `Compare heads ${a[i]} and ${a[j]}`,
        idea: a[i] === a[j] ? "Using <= takes the left value on a tie, so equal values keep their order: merge sort is stable." : "Only the two front values can be the smallest left.",
        text: `The left half's head is ${a[i]}, the right half's is ${a[j]}. ${left ? `${a[i]}` : `${a[j]}`} is smaller${a[i] === a[j] ? " or equal" : ""}.`
      }, { marks: { [i]: "compare", [j]: "compare" }, ...heads() });
      take(left ? i++ : j++, false);
    }
    while (i <= m) take(i++, true);
    while (j <= r) take(j++, true);
    for (let q = 0; q < tmp.length; q++) a[l + q] = tmp[q] as number;
    t.s.aux = undefined;
    if (l === 0 && r === n - 1) t.settle(...a.map((_, q) => q));
    t.push({
      kind: "found", op: `copy ${l}..${r}`, anchors: ["ms.copy"],
      notes: { "ms.copy": `a[${l}..${r}] = ${fmt(a.slice(l, r + 1))}` },
      title: `${l}..${r} is sorted`,
      idea: "Each merge doubles the length of the sorted runs.",
      text: `tmp is copied back over a[${l}..${r}]: ${fmt(a.slice(l, r + 1))}.`
    }, { marks: range(l, r, l === 0 && r === n - 1 ? "found" : "visited") });
  };

  sort(0, n - 1);

  return t.finish("ms.sig",
    "Merge sort is O(n log n) every time, at the cost of O(n) extra memory for the buffer.",
    `${t.s.compares} compares and ${t.s.swaps} writes into tmp for ${n} values. There are about log2(n) levels of splits, and each level merges n values. It is stable, and its speed doesn't depend on the input order.`);
}

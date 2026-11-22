import type { ParseResult, Step } from "../../engine/types";
import type { BlockState } from "../../iso/IsoBlock";
import type { TPointer } from "../../iso/TreeNodes";
import { trieAdd, trieChild, trieLayout, trieSize, type KNode, type TreeState } from "../treekit";
import { TRIE_NODES, checkWord, walkView, wordStrip } from "../trie/generate";

export const AC_WORDS = 8;

export interface AcInput { words: string[]; prefix: string }

export interface AcState extends TreeState {
  phase: "build" | "walk" | "collect" | "done" | null;
  prefix: string;
  out: string[];
  words: number;
  size: number;
}

/** Parse "car cart care cat dog, prefix ca": the words to store, then the prefix to complete. */
export function parseAc(text: string): ParseResult<AcInput> {
  const m = text.toLowerCase().match(/^(.*?)\bprefix\b\s*[=:]?\s*(\S*)\s*$/s);
  if (!m) return { ok: false, error: 'End with "prefix" and the letters to complete, like "… prefix ca".' };
  const bad = checkWord(m[2] || undefined, "prefix");
  if (bad) return { ok: false, error: bad };
  const words = m[1].replace(/[(),;"']/g, " ").split(/\s+/).filter(Boolean);
  if (!words.length) return { ok: false, error: "Type at least one word before the prefix." };
  for (const w of words) {
    const e = checkWord(w, "Each entry");
    if (e) return { ok: false, error: `"${w}": ${e}` };
  }
  if (words.length > AC_WORDS) return { ok: false, error: `Keep it to ${AC_WORDS} words or fewer so the steps stay readable.` };
  if (trieSize(words) > TRIE_NODES + 1)
    return { ok: false, error: `The words need more than ${TRIE_NODES} nodes. Use shorter words, or ones that share more letters.` };
  return { ok: true, input: { words, prefix: m[2] } };
}

const list = (ws: string[]) => `[${ws.join(", ")}]`;

/** Autocomplete: store the words in a trie, walk down to the prefix, then collect every word below it in alphabetical order. */
export function generateAc({ words, prefix }: AcInput): Step<AcState>[] {
  const root: KNode = { id: 1, ch: "", kids: [], end: false };
  let nextId = 2;
  let stored = 0;
  let phase: AcState["phase"] = null;
  const out: string[] = [];
  let c1 = 0, maxD = 0;
  const steps: Step<AcState>[] = [];
  const op = `complete("${prefix}")`;
  const short = op.length <= 14 ? undefined : `comp("${prefix}")`;

  type View = { path?: KNode[]; tone?: BlockState; strip?: TreeState["strip"]; extra?: Partial<Record<number, BlockState>> };
  const snap = (s: Omit<Step<AcState>, "state">, v: View = {}) => {
    const path = v.path ?? [];
    const { states, active } = walkView(path, v.tone);
    Object.assign(states, v.extra);
    const t = trieLayout(root, { states, active });
    c1 = Math.max(c1, t.c1);
    maxD = Math.max(maxD, t.depth);
    const cur = path[path.length - 1];
    const ptrs: TPointer[] = [{ node: root.id, label: "root" }, ...(cur && cur !== root ? [{ node: cur.id, label: "n" }] : [])];
    steps.push({
      ...s,
      state: { nodes: t.nodes, edges: t.edges, ptrs, frame: { c0: 0, c1: 0, depth: 0 }, strip: v.strip, phase, prefix, out: out.slice(), words: stored, size: t.nodes.length }
    });
  };
  const outStrip = (fresh = false): TreeState["strip"] => ({
    name: "out", slots: Math.max(total, 1), index: true,
    tiles: out.map((w, j) => ({ v: w, state: fresh && j === out.length - 1 ? "found" : undefined }))
  });

  /* How many words the prefix will collect, so the out strip keeps one size for the whole run. */
  const total = new Set(words.filter((w) => w.startsWith(prefix))).size;

  snap({
    kind: "problem", op: null, anchors: [], notes: {},
    title: "Suggest every word that starts with what was typed",
    idea: "In a trie, all the words with one prefix sit in one subtree. Finding the prefix is one walk; listing them is one traversal.",
    text: `A search box suggests words as you type. We store ${words.join(", ")} in a trie, then list every stored word that starts with "${prefix}", in alphabetical order.`
  }, { path: [root] });

  phase = "build";
  for (const w of words) {
    const path: KNode[] = [root];
    let n = root, made = 0;
    for (const ch of w) {
      const had = trieChild(n, ch);
      n = had ?? trieAdd(n, ch, nextId++);
      if (!had) made++;
      path.push(n);
    }
    const dup = n.end;
    if (!dup) { n.end = true; n.word = w; stored++; }
    const shared = w.length - made;
    snap({
      kind: dup ? "check" : "add", op: `insert("${w}")`, short: `insert("${w}")`.length > 14 ? `ins("${w}")` : undefined,
      anchors: ["ins.sig", ...(made ? ["ins.new"] : []), "ins.end"],
      notes: { ...(made ? { "ins.new": `${made} new node${made === 1 ? "" : "s"}` } : {}), "ins.end": dup ? `"${w}" already stored` : `end = true` },
      title: dup ? `"${w}" is already stored` : `Store "${w}"`,
      idea: "Each word costs one node per new letter. A shared prefix costs nothing extra.",
      text: dup
        ? `"${w}" is already in the trie, so nothing changes.`
        : `${shared ? `The first ${shared} letter${shared === 1 ? "" : "s"}, "${w.slice(0, shared)}", already had nodes. ` : ""}${made ? `${made} new node${made === 1 ? " was" : "s were"} added` : "No node was added"}, and the last one is flagged as the end of "${w}".`
    }, { path, tone: dup ? "compare" : "found" });
  }

  phase = "walk";
  const path: KNode[] = [root];
  let n = root;
  for (let k = 0; k < prefix.length; k++) {
    const ch = prefix[k];
    const next = trieChild(n, ch);
    if (!next) {
      phase = "done";
      snap({
        kind: "empty", op, short, ret: "[]", anchors: [...(k === 0 ? ["ac.sig"] : []), "walk.step", "walk.miss"],
        notes: { "walk.miss": `no child "${ch}", return []` },
        title: `No word starts with "${prefix.slice(0, k + 1)}"`,
        idea: "When the prefix itself is missing, there is nothing to suggest, and no other node is looked at.",
        text: `${k === 0 ? "The root" : `The node for "${prefix.slice(0, k)}"`} has no child "${ch}". No stored word starts with "${prefix}", so complete returns an empty list.`
      }, { path: path.slice(), tone: "compare", strip: wordStrip(prefix, k, true, "p") });
      break;
    }
    path.push(next);
    n = next;
    snap({
      kind: "check", op, short, anchors: [...(k === 0 ? ["ac.sig"] : []), "walk.step"], notes: { "walk.step": `n = "${prefix.slice(0, k + 1)}"` },
      title: `Follow "${ch}"`, idea: "The walk to the prefix is the same as a prefix check: one node per letter.",
      text: `${k === 0 ? "The root" : `"${prefix.slice(0, k)}"`} has a child "${ch}", so n moves down to it.${k === prefix.length - 1 ? ` Every word below this node starts with "${prefix}".` : ""}`
    }, { path: path.slice(), strip: wordStrip(prefix, k, false, "p") });
  }

  if (phase === "walk") {
    phase = "collect";
    const top = n;
    const seen: Partial<Record<number, BlockState>> = {};
    let first = true;
    /* Depth-first, children in letter order: the words come out sorted. */
    const dfs = (node: KNode, word: string, trail: KNode[]) => {
      const isEnd = node.end;
      if (isEnd) out.push(word);
      const anchors = first ? ["ac.collect", "dfs.sig"] : ["dfs.down"];
      if (isEnd) anchors.push("dfs.word");
      const notes: Record<string, string> = first ? { "ac.collect": `collect("${word}")` } : { "dfs.down": `word = "${word}"` };
      if (isEnd) notes["dfs.word"] = `out.add("${word}")`;
      snap({
        kind: isEnd ? "found" : "move", op, short, anchors, notes,
        title: isEnd ? `"${word}" is a word: add it` : first ? `Collect below "${word}"` : `Go down to "${word}"`,
        idea: isEnd ? "A node with the end flag is a whole word, so it joins the suggestions." : "Nodes without the end flag are only the middle of longer words. The search goes on below them.",
        text: `${first ? `The search starts at the prefix node and visits everything below it, children in letter order. ` : ""}${isEnd ? `This node ends "${word}", so it goes into out: ${list(out)}.` : `"${word}" is not a word on its own. Keep going down.`}`
      }, { path: trail, tone: isEnd ? "found" : "active", extra: { ...seen }, strip: outStrip(isEnd) });
      first = false;
      seen[node.id] = "visited";
      for (const k of node.kids) dfs(k, word + k.ch, [...trail, k]);
    };
    dfs(top, prefix, path.slice());

    phase = "done";
    snap({
      kind: "found", op, short, ret: list(out), anchors: ["ac.ret"], notes: { "ac.ret": `return ${list(out)}` },
      title: `${out.length} suggestion${out.length === 1 ? "" : "s"} for "${prefix}"`,
      idea: "Visiting children in letter order gives the suggestions sorted, with no separate sort step.",
      text: `Every node below "${prefix}" has been visited. complete returns ${list(out)}.`
    }, { path: path.slice(), tone: "found", extra: seen, strip: outStrip() });
  }

  snap({
    kind: "recap", op: null, anchors: [], notes: {},
    title: "What happened",
    idea: "Autocomplete costs O(P) to find the prefix plus the size of the subtree below it. Words with other prefixes are never touched.",
    text: `${stored} word${stored === 1 ? "" : "s"} went into a trie of ${nextId - 1} nodes. ${out.length ? `The walk to "${prefix}" took ${prefix.length} step${prefix.length === 1 ? "" : "s"}, and the subtree below it held ${list(out)}.` : `No stored word starts with "${prefix}", so the list is empty.`}`
  }, { path: [root], strip: out.length ? outStrip() : undefined });

  const frame = { c0: 0, c1, depth: maxD };
  for (const s of steps) s.state.frame = frame;
  return steps;
}

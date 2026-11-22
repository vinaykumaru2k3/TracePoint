import type { ParseResult, Step } from "../../engine/types";
import type { BlockState } from "../../iso/IsoBlock";
import type { TPointer, Tile, TilePointer } from "../../iso/TreeNodes";
import { trieAdd, trieChild, trieLayout, trieSize, type KNode, type TreeState } from "../treekit";

export const TRIE_OPS = 10;
export const TRIE_NODES = 24;
export const WORD_MAX = 6;

export type TrieVerb = "insert" | "search" | "prefix";
export interface TrieOp { name: TrieVerb; w: string }

export interface TrieState extends TreeState {
  op: string | null;
  words: number;
  size: number;
}

const ALIAS: Record<string, TrieVerb> = {
  insert: "insert", add: "insert", put: "insert",
  search: "search", find: "search", contains: "search",
  prefix: "prefix", startswith: "prefix", starts_with: "prefix"
};

/** Lowercase a word list and check each word: letters a to z only, at most WORD_MAX of them. */
export function checkWord(w: string | undefined, name: string): string | null {
  if (w === undefined || !/^[a-z]+$/.test(w)) return `${name} needs a word of letters a to z, like "${name} cat".`;
  if (w.length > WORD_MAX) return `Words go up to ${WORD_MAX} letters so the tree fits on the stage.`;
  return null;
}

/** Parse "insert cart, search car, prefix ca": each operation takes one lowercase word. */
export function parseTrie(text: string): ParseResult<TrieOp[]> {
  const tokens = text.toLowerCase().replace(/[(),;"']/g, " ").split(/\s+/).filter(Boolean);
  const ops: TrieOp[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const name = ALIAS[tokens[i]];
    if (!name) return { ok: false, error: `Unknown operation "${tokens[i]}". Use insert, search or prefix.` };
    const w = tokens[++i];
    const bad = checkWord(w, name);
    if (bad) return { ok: false, error: bad };
    ops.push({ name, w });
  }
  if (!ops.length) return { ok: false, error: "Type at least one operation." };
  if (ops.length > TRIE_OPS) return { ok: false, error: `Keep it to ${TRIE_OPS} operations or fewer so the steps stay readable.` };
  if (trieSize(ops.filter((o) => o.name === "insert").map((o) => o.w)) > TRIE_NODES + 1)
    return { ok: false, error: `The words need more than ${TRIE_NODES} nodes. Use shorter words, or ones that share more letters.` };
  return { ok: true, input: ops };
}

/** Operation label, shortened when it would not fit under a timeline stop. */
export function opLabel(name: string, abbr: string, w: string): { op: string; short?: string } {
  const op = `${name}("${w}")`;
  return op.length <= 14 ? { op } : { op, short: `${abbr}("${w}")` };
}

/** The word being read as a strip of letter tiles: letters already read are visited, `k` is the current one. */
export function wordStrip(w: string, k: number, miss = false, name = "w"): NonNullable<TreeState["strip"]> {
  const tiles: Tile[] = [...w].map((ch, j) => ({ v: ch, state: j < k ? "visited" : j === k ? (miss ? "compare" : "active") : undefined }));
  const ptrs: TilePointer[] = k >= 0 && k < w.length ? [{ at: k, label: "c" }] : [];
  return { name, tiles, slots: WORD_MAX, index: true, ptrs };
}

/** States and active edges for a walk down `path` (root first); the last node gets `tone`. */
export function walkView(path: KNode[], tone: BlockState = "active") {
  const states: Partial<Record<number, BlockState>> = {};
  for (const n of path) states[n.id] = "visited";
  const cur = path[path.length - 1];
  if (cur) states[cur.id] = tone;
  const active = new Set(path.slice(1).map((n, j) => `${path[j].id}-${n.id}`));
  return { states, active };
}

const from = (w: string, k: number) => (k === 0 ? "The root" : `The node for "${w.slice(0, k)}"`);

/** Trie insert, search and prefix check, one step per letter. */
export function generateTrie(ops: TrieOp[]): Step<TrieState>[] {
  const root: KNode = { id: 1, ch: "", kids: [], end: false };
  let nextId = 2;
  let words = 0;
  let op: string | null = null;
  let c1 = 0, maxD = 0;
  const steps: Step<TrieState>[] = [];

  const snap = (s: Omit<Step<TrieState>, "state">, v: { w?: string; k?: number; path?: KNode[]; tone?: BlockState; miss?: boolean } = {}) => {
    const path = v.path ?? [];
    const { states, active } = walkView(path, v.tone);
    const t = trieLayout(root, { states, active });
    c1 = Math.max(c1, t.c1);
    maxD = Math.max(maxD, t.depth);
    const cur = path[path.length - 1];
    const ptrs: TPointer[] = [{ node: root.id, label: "root" }, ...(cur && cur !== root ? [{ node: cur.id, label: "n" }] : [])];
    steps.push({
      ...s,
      state: {
        nodes: t.nodes, edges: t.edges, ptrs, frame: { c0: 0, c1: 0, depth: 0 },
        strip: v.w !== undefined ? wordStrip(v.w, v.k ?? -1, v.miss) : undefined,
        op, words, size: t.nodes.length
      }
    });
  };

  snap({
    kind: "problem", op: null, anchors: [], notes: {},
    title: "A tree that spells words",
    idea: "Words that share a prefix share the path for it. Looking up a word costs one step per letter, however many words are stored.",
    text: `A trie stores words letter by letter. Each node is one letter, and the path from the root down to a node spells a prefix. A flag on a node marks where a whole word ends. We will run: ${ops.map((o) => `${o.name} ${o.w}`).join(", ")}.`
  }, { path: [root] });

  for (const o of ops) {
    const w = o.w;
    if (o.name === "insert") {
      const lab = opLabel("insert", "ins", w);
      op = lab.op;
      const path: KNode[] = [root];
      let n = root;
      for (let k = 0; k < w.length; k++) {
        const ch = w[k];
        const last = k === w.length - 1;
        const had = trieChild(n, ch);
        const next = had ?? trieAdd(n, ch, nextId++);
        const fresh = !had;
        path.push(next);
        n = next;
        const anchors = [...(k === 0 ? ["ins.sig", "ins.root"] : []), ...(fresh ? ["ins.new"] : []), "ins.step", ...(last ? ["ins.end"] : [])];
        const notes: Record<string, string> = { "ins.step": `n = "${w.slice(0, k + 1)}"` };
        if (fresh) notes["ins.new"] = `no "${ch}" yet, new node`;
        let kind: Step<TrieState>["kind"] = fresh ? "add" : "check";
        let title = fresh ? `Add a node for "${ch}"` : `"${ch}" is already there`;
        let idea = fresh
          ? "A missing letter gets a new node. From here down, the word has a path of its own."
          : "An existing letter is shared. Every word with this prefix uses the same node.";
        let text = fresh
          ? `${from(w, k)} has no child "${ch}", so a new node is made for it and n moves down to it.`
          : `${from(w, k)} already has a child "${ch}", so no node is made. n moves down to it.`;
        let tone: BlockState = fresh ? "found" : "active";
        if (last) {
          if (n.end) {
            notes["ins.end"] = `"${w}" was already a word`;
            kind = "check";
            title = `"${w}" is already stored`;
            idea = "Inserting a word twice changes nothing: the end flag is already set.";
            text += ` That was the last letter, and this node already marks the end of "${w}". Nothing changes.`;
          } else {
            n.end = true;
            n.word = w;
            words++;
            notes["ins.end"] = `end = true, "${w}" stored`;
            kind = "add";
            tone = "found";
            if (!fresh) {
              title = `Mark "${w}" as a word`;
              idea = "A word can end on a node in the middle of a longer word. Only the end flag tells the two apart.";
            }
            text += ` That was the last letter, so this node is flagged as the end of "${w}".`;
          }
        }
        snap({ kind, op: lab.op, short: lab.short, anchors, notes, title, idea, text }, { w, k, path: path.slice(), tone });
      }
      continue;
    }

    /* search and prefix share the walk */
    const isSearch = o.name === "search";
    const lab = isSearch ? opLabel("search", "find", w) : opLabel("startsWith", "pre", w);
    const fn = isSearch ? "search" : "startsWith";
    const end = isSearch ? "find.end" : "pre.ret";
    op = lab.op;
    const path: KNode[] = [root];
    let n = root;
    let missed = false;
    for (let k = 0; k < w.length; k++) {
      const ch = w[k];
      const next = trieChild(n, ch);
      const head = k === 0 ? [isSearch ? "find.sig" : "pre.sig", "walk.sig"] : [];
      if (!next) {
        missed = true;
        snap({
          kind: "empty", op: lab.op, short: lab.short, ret: "false", anchors: [...head, "walk.step", "walk.miss", end],
          notes: { "walk.miss": `no child "${ch}", return null`, [end]: "return false" },
          title: `No "${ch}" after "${w.slice(0, k) || "root"}"`,
          idea: "One missing letter ends the walk. No stored word can start with this prefix.",
          text: `${from(w, k)} has no child "${ch}", so no stored word starts with "${w.slice(0, k + 1)}". ${fn} returns false.`
        }, { w, k, path: path.slice(), tone: "compare", miss: true });
        break;
      }
      path.push(next);
      n = next;
      snap({
        kind: "check", op: lab.op, short: lab.short, anchors: [...head, "walk.step"], notes: { "walk.step": `n = "${w.slice(0, k + 1)}"` },
        title: `Follow "${ch}"`, idea: "Each letter is one step down. The walk never looks at words that start differently.",
        text: `${from(w, k)} has a child "${ch}", so n moves down to it.${k === w.length - 1 ? ` That was the last letter of "${w}".` : ""}`
      }, { w, k, path: path.slice() });
    }
    if (missed) continue;
    if (!isSearch) {
      snap({
        kind: "found", op: lab.op, short: lab.short, ret: "true", anchors: ["walk.ret", "pre.ret"], notes: { "pre.ret": "node found, return true" },
        title: `Some word starts with "${w}"`, idea: "A prefix check only needs the path to exist. The end flag does not matter.",
        text: `Every letter of "${w}" had a node, so at least one stored word starts with it. startsWith returns true.`
      }, { w, k: w.length, path: path.slice(), tone: "found" });
    } else if (n.end) {
      snap({
        kind: "found", op: lab.op, short: lab.short, ret: "true", anchors: ["walk.ret", "find.end"], notes: { "find.end": "end = true, return true" },
        title: `"${w}" is a stored word`, idea: "A search succeeds only when the walk finishes on a node flagged as a word end.",
        text: `The walk used every letter of "${w}", and this node is flagged as the end of a word. search returns true.`
      }, { w, k: w.length, path: path.slice(), tone: "found" });
    } else {
      snap({
        kind: "check", op: lab.op, short: lab.short, ret: "false", anchors: ["walk.ret", "find.end"], notes: { "find.end": "end = false, return false" },
        title: `"${w}" is only a prefix`, idea: "Reaching a node is not enough. Without the end flag, the letters only start longer words.",
        text: `The path for "${w}" exists, but this node has no end flag: "${w}" was never inserted on its own. search returns false.`
      }, { w, k: w.length, path: path.slice(), tone: "compare" });
    }
  }

  op = null;
  const size = nextId - 1;
  snap({
    kind: "recap", op: null, anchors: [], notes: {},
    title: "What happened",
    idea: "Every operation costs O(L) for a word of L letters, no matter how many words the trie holds.",
    text: `The trie holds ${words} word${words === 1 ? "" : "s"} in ${size} nodes, counting the root. Shared prefixes were stored once. Each insert, search and prefix check walked one node per letter.`
  }, { path: [root] });

  const frame = { c0: 0, c1, depth: maxD };
  for (const s of steps) s.state.frame = frame;
  return steps;
}

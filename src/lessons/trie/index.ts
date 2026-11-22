import { defineLesson } from "../../engine/types";
import TreeScene from "../TreeScene";
import { trieMemory } from "../treekit";
import { TRIE_NODES, TRIE_OPS, WORD_MAX, generateTrie, parseTrie, type TrieOp, type TrieState } from "./generate";
import java from "./code/Main.java?raw";
import python from "./code/main.py?raw";
import cpp from "./code/main.cpp?raw";
import theory from "./theory";

export default defineLesson<TrieOp[], TrieState>({
  id: "trie",
  title: "Trie",
  subtitle: "Store words letter by letter in a tree, so words that share a prefix share its path.",
  minutes: 8,
  level: "intermediate",
  section: "tries",

  inputLabel: "Operations",
  inputHint: `Up to ${TRIE_OPS} of insert, search and prefix, each with a word of up to ${WORD_MAX} letters a to z. At most ${TRIE_NODES} nodes.`,
  defaultText: "insert cart, insert car, insert cat, insert dog, search car, search ca, prefix ca, prefix do, search cow",
  presets: [
    { label: "Shared prefix", text: "insert tea, insert ten, insert team, insert to, search te, prefix te" },
    { label: "Word inside a word", text: "insert there, insert the, search the, search then" },
    { label: "Insert twice", text: "insert go, insert go, search go" }
  ],
  parse: parseTrie,
  generate: generateTrie,

  Scene: TreeScene,
  legend: [{ cls: "s-active", label: "current node" }, { cls: "s-visited", label: "path walked" }, { cls: "s-found", label: "added or matched" }, { cls: "s-compare", label: "missing or not a word" }],
  metrics: ({ state: s }) => [
    { label: "Op", value: s.op ?? "-" },
    { label: "Words", value: s.words },
    { label: "Nodes", value: s.size }
  ],
  memory: ({ state: s }) => trieMemory("In memory: TrieNode objects", s, "Each node keeps one slot per letter and an end flag. Here only the used slots are listed."),
  vars: ({ state: s }) => {
    const t = s.strip;
    if (!t) return `words = ${s.words}   nodes = ${s.size}`;
    const k = t.ptrs?.[0]?.at;
    return `w = "${t.tiles.map((x) => x.v).join("")}"` + (k !== undefined ? `   c = '${t.tiles[k].v}'` : "");
  },
  costs: [["insert", "O(L)"], ["search", "O(L)"], ["prefix check", "O(L)"], ["space, worst case", "O(n) letters"]],
  learn: [
    ["words with a common prefix share its nodes", (s) => s.op?.startsWith("insert") === true && s.kind === "check" && s.anchors.includes("ins.step")],
    ["a missing letter gets a new node", (s) => s.anchors.includes("ins.new")],
    ["a path without the end flag is not a word", (s) => s.anchors.includes("find.end") && s.ret === "false"],
    ["a prefix check ignores the end flag", (s) => s.anchors.includes("pre.ret") && s.ret === "true"]
  ],

  theory,

  code: { java, python, cpp }
});

import { defineLesson } from "../../engine/types";
import TreeScene from "../TreeScene";
import { trieMemory } from "../treekit";
import { WORD_MAX } from "../trie/generate";
import { AC_WORDS, generateAc, parseAc, type AcInput, type AcState } from "./generate";
import java from "./code/Main.java?raw";
import python from "./code/main.py?raw";
import cpp from "./code/main.cpp?raw";
import theory from "./theory";

const PHASE = { build: "build", walk: "find prefix", collect: "collect", done: "done" } as const;

export default defineLesson<AcInput, AcState>({
  id: "autocomplete",
  title: "Autocomplete",
  subtitle: "Walk a trie down to what was typed, then list every word below it in alphabetical order.",
  minutes: 7,
  level: "intermediate",
  section: "tries",

  inputLabel: "Words and prefix",
  inputHint: `Up to ${AC_WORDS} words of up to ${WORD_MAX} letters a to z, then "prefix" and the letters typed so far.`,
  defaultText: "cart care car cat dog, prefix ca",
  presets: [
    { label: "Prefix is a word", text: "app apple apply ape, prefix app" },
    { label: "No match", text: "sun sand sea, prefix so" },
    { label: "One letter", text: "bee bed beg bat, prefix b" }
  ],
  parse: parseAc,
  generate: generateAc,

  Scene: TreeScene,
  legend: [{ cls: "s-active", label: "current node" }, { cls: "s-visited", label: "walked or visited" }, { cls: "s-found", label: "stored or suggested" }, { cls: "s-compare", label: "missing" }],
  metrics: ({ state: s }) => [
    { label: "Phase", value: s.phase ? PHASE[s.phase] : "-" },
    { label: "Prefix", value: `"${s.prefix}"` },
    { label: "Found", value: s.out.length }
  ],
  memory: ({ state: s }) => trieMemory("In memory: TrieNode objects", s, "Each node keeps one slot per letter and an end flag. Here only the used slots are listed."),
  vars: ({ state: s }) => `prefix = "${s.prefix}"   out = [${s.out.map((w) => `"${w}"`).join(", ")}]`,
  costs: [["find the prefix", "O(P)"], ["collect the words", "O(k)"], ["build the trie", "O(n) letters"]],
  learn: [
    ["a shared prefix costs no new nodes", (s) => s.kind === "add" && !s.anchors.includes("ins.new")],
    ["finding the prefix is one step per letter", (s) => s.anchors.includes("walk.step") && s.kind === "check"],
    ["a depth-first walk in letter order gives sorted words", (s) => s.anchors.includes("dfs.word")],
    ["a missing prefix returns an empty list", (s) => s.anchors.includes("walk.miss")]
  ],

  theory,

  code: { java, python, cpp }
});

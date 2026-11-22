import type { Guide } from "../types";

const tries: Guide = {
  section: "tries",
  tagline: "How to store words letter by letter, so that every word with a given start sits in one place.",
  core: [
    "A hash set answers one question fast. Is this exact word stored? It cannot tell you which words start with \"ca\" without checking every word. A trie can. It is a tree where **each edge is one letter**. The path from the root to a node spells a prefix, the start of a word.",
    "Words that share a start **share the nodes for it**. cart, car and cat all begin at the same c and a. A flag on a node marks where a whole word ends, because car ends on a node that cart passes through. Insert and search take one step per letter, however many words are stored.",
    "Every word that starts with a prefix lives under that prefix's node. So autocomplete walks down to the node, then visits everything below it. Visiting children from a to z gives the words in alphabetical order."
  ],
  analogy:
    "Picture a phone's contact list sorted by name. As you type T, then TO, then TOM, the list narrows to the names that start that way. A trie does that narrowing with one node per letter typed.",
  prereqs: [
    "The [[guide:trees|Trees guide]]: nodes, children, the root and leaves.",
    "The [[strings]] lesson, for reading a word one character at a time.",
    "The [[tree-traversals]] lesson. Autocomplete collects words with a depth-first walk."
  ],
  terms: [
    ["trie", "A tree that stores words one letter per edge. The name comes from retrieval. Many people say it like try."],
    ["prefix", "The first few letters of a word. ca is a prefix of car, cart and cat."],
    ["end flag", "A mark on a node that says a stored word ends there. Without it, prefixes and words look the same."],
    ["edge", "The link from a node to one of its children. In a trie each edge carries one letter."],
    ["depth-first search", "Visiting a tree by going all the way down one branch before backing up to try the next."],
    ["L", "The length of a word in letters. Trie costs depend on L, not on how many words are stored."]
  ],
  cheat: {
    head: ["Task", "Trie", "Hash set", "Sorted array"],
    rows: [
      ["Is this word stored?", "O(L)", "O(L) average", "O(L log n)"],
      ["Does any word start with p?", "O(L)", "O(n × L)", "O(L log n)"],
      ["List every word starting with p", "O(L + k) (k nodes below p)", "O(n × L)", "O(L log n + k)"],
      ["Insert a word", "O(L)", "O(L) average", "O(n)"]
    ]
  },
  patterns: [
    ["You need to check whether some letters start any stored word.", "Use a trie and follow the letters. See [[trie]]."],
    ["Users type a few letters and expect suggestions.", "Walk to the prefix node, then collect the words below it. See [[autocomplete]]."],
    ["You only ever ask about whole words.", "Use a hash set. It needs less memory. See [[guide:hashing]]."]
  ],
  tips: [
    "Set the end flag even when an insert adds no new node. Inserting car after cart only marks the r.",
    "A trie node needs only an array of 26 children and a flag for lowercase English. Use a map from letter to child for larger alphabets.",
    "Lowercase words before inserting or searching, unless case matters.",
    "Store a count in each node to answer how many words start with a prefix in O(L).",
    "Real search boxes keep a few top results in each node, so a one-letter prefix does not walk thousands of words."
  ],
  cases: [
    {
      title: "Search box suggestions",
      setting: "A shop's search box suggests product names as you type. There are thousands of names, and every keystroke needs an answer at once.",
      idea: "Build a trie of the names once. Each keystroke moves one node down, and the names below that node are the suggestions.",
      why: "The walk costs one step per letter typed, not one per product. Only the matching part of the trie is ever visited."
    },
    {
      title: "Routing on the internet",
      setting: "A router forwards each packet by its address. Its table holds address prefixes, and the longest one that matches decides where the packet goes.",
      idea: "Routers store the prefixes in a trie over the bits of the address. Following the bits finds every matching prefix on the way down, and the deepest one wins.",
      why: "A packet must be forwarded in a moment. The trie finds the longest match in one walk, at most 32 steps for an IPv4 address."
    }
  ],
  hooks: {
    "trie": "Insert words letter by letter, then search for words and prefixes.",
    "autocomplete": "Walk to a prefix, then collect every word stored below it."
  }
};

export default tries;

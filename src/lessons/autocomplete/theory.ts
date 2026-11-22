import type { LessonTheory } from "../../theory/types";

const theory: LessonTheory = {
  definition:
    "Autocomplete lists every stored word that starts with what was typed. In a trie, **all those words live in one subtree**, so it walks down to the prefix and collects everything below it.",
  analogy:
    "Think of a filing cabinet with one drawer per letter and folders inside by the next letter. To find every file starting with CA, you go to the C drawer, take the A folder, and read all of it.",
  steps: [
    "Store every word in a [[trie]]: one node per letter, with an end flag on each node where a word ends.",
    "Walk down from the root, one letter of the prefix at a time. If a letter is missing, no stored word starts with the prefix, so return an empty list.",
    "From the prefix node, visit every node below it depth first. Depth first means going all the way down one branch before trying the next.",
    "Keep the letters of the current path. Each time you reach a node with the end flag, those letters spell a word, so add it to the list.",
    "Visit children in letter order, a to z. The words then come out in alphabetical order with no sorting."
  ],
  shots: [2, 8, 9, 10, 14],
  ops: [
    ["find the prefix", "O(P)", "One step per letter of a prefix with P letters."],
    ["collect the words", "O(k)", "k is the number of nodes below the prefix node. Other words are never touched."],
    ["build the trie", "O(n)", "n is the total number of letters in the word list. It is done once, before any query."]
  ],
  useWhen: [
    "Users type a few letters and expect suggestions straight away, as in a search box or a command line.",
    "The list of words changes rarely and is queried often. Building the trie once pays off over many prefixes."
  ],
  avoidWhen: [
    "The prefix is short and the word list is huge. One letter may match thousands of words. Store a few best words in each node and return only those.",
    "You need to match letters in the middle of a word, not only the start. A trie indexes prefixes only."
  ],
  example: [
    "Store cart, care, car, cat and dog. Type ca.",
    "Walk c, then a. Every word below that a starts with ca.",
    "Go down to r. It has the end flag, so add car. Under r, e ends care and t ends cart.",
    "Back up to a, then down to its next child, t, which ends cat. The result is [car, care, cart, cat], already in order."
  ],
  pitfalls: [
    "Forgetting the prefix node itself. If the prefix is a stored word, such as app, it must be in the list too.",
    "Searching the ~~whole trie~~ for matching words. Only the subtree under the prefix node can match, so start there.",
    "Visiting children in the order they were inserted, as a hash map may. The suggestions then come out unsorted. Sort the children, or use a 26-slot array.",
    "Rebuilding the trie for every keystroke. Build it once, then reuse it for each new prefix."
  ]
};

export default theory;

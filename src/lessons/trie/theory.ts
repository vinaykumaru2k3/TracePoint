import type { LessonTheory } from "../../theory/types";

const theory: LessonTheory = {
  definition:
    "A trie, also called a prefix tree, stores words one letter per node. **Words that start the same way share the path for that start**, and a flag marks each node where a whole word ends.",
  analogy:
    "Think of a paper dictionary's thumb tabs. You open at C, then find the CA pages, then CAR. Each letter narrows the search, and you never look at words that start with D.",
  steps: [
    "The root holds no letter. Each node has up to 26 children, one for each letter, and an end flag.",
    "To insert a word, start at the root and read one letter at a time. If the current node has a child for that letter, move down to it.",
    "If the child is missing, make a new node for it, then move down. From there on, the word has a path of its own.",
    "After the last letter, set the end flag on the node you reached. A word can end in the middle of a longer word's path.",
    "To search, follow the letters the same way. A missing child means the word is absent. Reaching the end, the word is there only if the flag is set.",
    "A prefix check follows the letters too, but ignores the flag. If the path exists, some stored word starts with those letters."
  ],
  shots: [1, 6, 11, 8, 21, 24],
  ops: [
    ["insert", "O(L)", "One step per letter of a word with L letters."],
    ["search", "O(L)", "Same walk. The number of stored words does not matter."],
    ["prefix check", "O(L)", "Same walk, without the end-flag test."],
    ["space", "O(n)", "n is the total number of letters stored. Shared prefixes are stored once, so it is often far less."]
  ],
  useWhen: [
    "You ask whether any stored word starts with some letters, as in a search box or a spelling checker.",
    "Many words share prefixes, such as words in a dictionary or paths in a URL. The shared part is stored once."
  ],
  avoidWhen: [
    "You only ask whether a whole word is stored. A hash set does that in about O(L) too, with far less memory. See [[guide:hashing]].",
    "Keys share few prefixes, such as random IDs. Nearly every letter gets its own node, each with up to 26 empty slots."
  ],
  example: [
    "Insert cart, car and cat. cart makes four nodes: c, a, r, t. car reuses c, a and r, and only sets the end flag on r.",
    "cat reuses c and a, then adds a new t beside r. The trie has 6 nodes below the root for 3 words.",
    "Search for ca: the path c, a exists, but a has no end flag, so search returns false. A prefix check on ca returns true.",
    "Search for cow: c exists, but c has no child o, so the walk stops after one letter and returns false."
  ],
  pitfalls: [
    "Treating ~~any reachable node~~ as a stored word. Only nodes with the end flag are words. Without it, ca would match after inserting cart.",
    "Setting the end flag only on new nodes. Inserting car after cart adds no node, but the flag on r must still be set.",
    "Giving every node a full array of 26 slots when keys use few letters. A map from letter to child saves memory.",
    "Forgetting to lowercase input. C and c would get different children, and searches would miss."
  ]
};

export default theory;

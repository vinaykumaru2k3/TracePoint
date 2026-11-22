import type { LessonTheory } from "../../theory/types";

const theory: LessonTheory = {
  definition:
    "A traversal visits every node of a tree exactly once. The four standard orders differ only in **when a node is written compared with its children**.",
  analogy:
    "Think of reading a book's table of contents. Reading each chapter title before its sections is pre-order. Reading the whole outline one indent level at a time, top to bottom, is level order.",
  steps: [
    "A binary tree is made of nodes. Each node holds a value and links to at most two children, a left one and a right one. The top node is the root.",
    "Pre-order writes the node first, then walks its left subtree, then its right subtree. The root always comes out first.",
    "In-order walks the left subtree, writes the node, then walks the right subtree. On a binary search tree this gives the keys in sorted order.",
    "Post-order walks both subtrees first and writes the node last. The root always comes out last, after everything below it.",
    "Level order writes the root, then every node one level down, and so on. It uses a queue instead of recursion: take a node from the front, write it, add its children at the back."
  ],
  shots: [1, 3, 19, 27, 31],
  ops: [
    ["any of the four orders", "O(n)", "Each node is visited once, and each visit does a fixed amount of work."],
    ["recursion stack", "O(h)", "The three depth-first orders keep one call per level of the current path. h is the height of the tree."],
    ["level-order queue", "O(n)", "The queue holds about one level at a time. The widest level of a full tree holds about half the nodes."]
  ],
  useWhen: [
    "You need every value in a tree: to print it, copy it, count it or check it.",
    "You need the keys of a search tree in sorted order. In-order gives them in O(n) with no sorting."
  ],
  avoidWhen: [
    "You look for one key in a search tree. A [[bst]] search follows one path, about O(log n) nodes when the tree is balanced.",
    "The tree is very deep, such as a long chain. Recursion may run out of stack. Use an explicit stack, or level order."
  ],
  example: [
    "Take the tree with root 4, children 2 and 6, and leaves 1, 3, 5 and 7.",
    "Pre-order writes 4, 2, 1, 3, 6, 5, 7: each node before its subtrees.",
    "In-order writes 1, 2, 3, 4, 5, 6, 7: left subtree, node, right subtree. The keys come out sorted.",
    "Post-order writes 1, 3, 2, 5, 7, 6, 4. Level order writes 4, 2, 6, 1, 3, 5, 7."
  ],
  pitfalls: [
    "Forgetting the empty-tree check. A call on ~~a missing child~~ with no `if (n == null) return` crashes on the first leaf.",
    "Expecting in-order to sort any binary tree. It gives sorted output only when the tree follows the search-tree rule.",
    "Using a stack for level order. A stack takes the newest node first, which gives a depth-first order. Level order needs a queue.",
    "Freeing nodes in pre-order. A parent freed first loses the links to its children. Free in post-order, children before parent."
  ]
};

export default theory;

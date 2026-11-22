import type { LessonTheory } from "../../theory/types";

const theory: LessonTheory = {
  definition:
    "An AVL tree is a binary search tree that **keeps itself balanced**, so at every node the two subtree heights differ by at most 1. Rotations after each insert repair any node that breaks this rule.",
  analogy:
    "Think of a mobile hanging from the ceiling. When one side gets too heavy, you slide the string so a different piece hangs in the middle. Nothing falls off, and every piece keeps its left-to-right order.",
  steps: [
    "Each node stores its height. Its balance factor is the height of its left subtree minus the height of its right subtree.",
    "Insert walks down like a plain search tree and attaches a leaf. Then it walks back up the path, updating heights and balance factors.",
    "If every factor on the path stays between -1 and +1, nothing else happens.",
    "The lowest node at +2 or -2 needs fixing. If the new key went the same way twice, left-left or right-right, one rotation fixes it.",
    "A rotation lifts a child into its parent's place, and the parent becomes its child. The keys keep their order, and the subtree gets shorter.",
    "If the new key zig-zagged, left then right or right then left, the first rotation straightens the zig-zag. A second rotation then fixes the node."
  ],
  shots: [5, 4, 14, 9, 10, 19],
  ops: [
    ["search, insert", "O(log n)", "The height stays below about 1.44 log₂ n, so every path is short."],
    ["one rotation", "O(1)", "A rotation changes three links and two heights, however big the tree is."],
    ["rotations per insert", "at most 2", "Fixing the lowest unbalanced node brings its subtree back to its old height, so nothing above it changes."],
    ["extra space", "O(n)", "One height per node, on top of the keys and links."]
  ],
  useWhen: [
    "Keys may arrive in sorted or nearly sorted order, and you still need O(log n) for every operation.",
    "Lookups are much more common than changes. AVL trees are more tightly balanced than most other balanced trees, so searches are short."
  ],
  avoidWhen: [
    "Keys arrive in random order and the data is small. A plain [[bst]] is shorter to write and stays fairly balanced.",
    "You only need lookups by key, never in order. A hash table is about O(1) on average. See [[guide:hashing]]."
  ],
  example: [
    "Insert 10, 20, 30. After 30, node 10 has an empty left side and a right side of height 2, so its factor is -2.",
    "30 went right, then right again: the RR case. Rotate left at 10. 20 becomes the root, with 10 and 30 below it.",
    "Later, 28 goes right of 25, which is left of 30: a zig-zag. Rotate left at 25, then right at 30. 28 ends up on top of 25 and 30.",
    "Inserting 10, 20, 30, 25, 28, 5, 4 gives a tree of height 3. A plain search tree could have reached height 5."
  ],
  pitfalls: [
    "Fixing the ~~highest~~ unbalanced node. Repair the lowest one on the path first. That single fix balances every node above it.",
    "Forgetting to update heights after a rotation. Update the node that moved down first, then the node that moved up.",
    "Using one rotation for a zig-zag. It moves the problem to the other side. LR and RL need two rotations.",
    "Mixing up the sign of the balance factor. Pick left minus right, or right minus left, and use it in every check."
  ]
};

export default theory;

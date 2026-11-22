import type { LessonTheory } from "../../theory/types";

const theory: LessonTheory = {
  definition:
    "A binary search tree, or BST, keeps **smaller keys in the left subtree and larger keys in the right**, at every node. Search, insert and delete each follow one path down from the root.",
  analogy:
    "Think of a guessing game where each answer is higher or lower. Every node is a guess. Smaller keys send you left, larger keys send you right, and half of what is left drops out of view.",
  steps: [
    "The first key becomes the root. Every later key starts at the root and is compared with each node on its way down.",
    "Go left if the key is smaller than the node, right if it is larger. Stop when the key is equal, or when the side you need is empty.",
    "Insert attaches the new key where the walk fell off the tree. It always becomes a leaf, a node with no children.",
    "Search follows the same walk. Reaching a node with the key means found. Falling off the tree means the key is absent.",
    "Delete a leaf by cutting it off. A node with one child is replaced by that child.",
    "A node with two children takes the key of its successor, the smallest key in its right subtree. Then the successor's old node is removed instead."
  ],
  shots: [2, 8, 9, 21, 27, 30],
  ops: [
    ["search, insert, delete", "O(h)", "Each one follows a single path from the root. h is the height of the tree."],
    ["balanced tree", "O(log n)", "When the levels stay full, h is about log₂ n, so a million keys need about 20 steps."],
    ["worst case", "O(n)", "Keys inserted in sorted order make a chain, and h grows to n."],
    ["in-order traversal", "O(n)", "Visits every key once and gives them in sorted order."]
  ],
  useWhen: [
    "You need lookups, inserts and deletes, and also the keys in order: the smallest, the largest, or everything in a range.",
    "Keys arrive in a random order, so the tree stays fairly balanced without extra work."
  ],
  avoidWhen: [
    "Keys may arrive sorted or nearly sorted. The tree turns into a chain. Use a self-balancing tree such as [[avl-rotations]].",
    "You only need to look keys up and never in order. A hash table finds a key in about one step on average. See [[guide:hashing]]."
  ],
  example: [
    "Insert 50, 30, 70, 20, 40, 60, 80. 50 is the root, 30 and 70 sit below it, and the other four keys are leaves.",
    "Search for 60: 60 is larger than 50, so go right. 60 is smaller than 70, so go left. 60 is found after 3 nodes.",
    "Search for 65 takes the same path, then needs 60's right child. It is empty, so 65 is absent.",
    "Delete 50, which has two children. Its successor is 60, the smallest key right of it. 60 is copied into the root and its old leaf removed."
  ],
  pitfalls: [
    "Checking only a node's two children. The rule covers whole subtrees: a key deep in the left subtree must still be smaller than the root.",
    "Deleting a two-child node by ~~moving one of its subtrees up~~. The other subtree has nowhere to go. Copy the successor in instead.",
    "Inserting sorted keys into a plain BST. Every key goes right, the tree becomes a list, and each operation costs O(n).",
    "Forgetting to decide on duplicates. Pick one rule, such as ignoring them or always sending them right, and use it everywhere."
  ]
};

export default theory;

import type { Guide } from "../types";

const trees: Guide = {
  section: "trees",
  tagline: "How to store values as a hierarchy of nodes, so that one path from the top reaches any of them in a few steps.",
  core: [
    "A list stores values in a line, so reaching the last one can take n steps. A tree stores them as **nodes that branch**. The top node is the root, and each node links to a few children below it. In a binary tree each node has at most two children, left and right. A tree with every level full holds about 2ʰ nodes in h levels, so a million nodes fit in about 20 levels.",
    "Shape alone does not find anything. Order does. A binary search tree keeps **smaller keys on the left and larger keys on the right** at every node. A search then follows one path from the root and skips everything off it. That path is short only while the tree stays balanced, with its levels nearly full. AVL trees rotate nodes after each insert to keep it that way.",
    "A heap uses a weaker rule, with **every parent no larger than its children**. It cannot find any key fast, but the smallest is always on top. Because a heap is a complete tree, it fits in a plain array with no links. The children of index i sit at `2i + 1` and `2i + 2`. Heap sort uses the same array to sort in place."
  ],
  analogy:
    "Picture a company's org chart. The chief sits at the top, each manager has a few reports, and nobody is more than a few levels from the top. To reach anyone, you go down one chain of managers. A search tree is an org chart where everyone on the left of a manager has a smaller ID number.",
  prereqs: [
    "The [[singly-linked-list]] lesson: a node that holds a value and a link to another node. A tree node has up to two links.",
    "The [[guide:recursion|Recursion guide]]. Most tree code calls itself on the left and right subtrees.",
    "The [[binary-search]] lesson. A search tree halves the candidates at each node the same way."
  ],
  terms: [
    ["node", "One item in the tree. It holds a value, or key, and links to its children."],
    ["root", "The top node. Every other node is reached from it."],
    ["child and parent", "A node directly below another is its child. The node above is its parent. The root has no parent."],
    ["leaf", "A node with no children."],
    ["subtree", "A node together with everything below it. Each child of a node is the root of a subtree."],
    ["height", "The number of levels on the longest path from a node down to a leaf. A single node has height 1 in this course."],
    ["balanced", "Every node's left and right subtrees have nearly the same height, so the whole tree stays about log₂ n tall."],
    ["complete tree", "Every level is full except possibly the last, which fills from the left. A heap is always complete."],
    ["traversal", "Visiting every node once in a set order, such as pre-order, in-order, post-order or level order."],
    ["rotation", "Swapping a parent and child while keeping the left-to-right order of keys. It changes the shape, not the order."]
  ],
  cheat: {
    head: ["Structure", "Search", "Insert", "Delete or pop", "Find smallest"],
    rows: [
      ["Binary search tree (balanced)", "O(log n)", "O(log n)", "O(log n)", "O(log n)"],
      ["Binary search tree (sorted inserts)", "O(n)", "O(n)", "O(n)", "O(n)"],
      ["AVL tree", "O(log n)", "O(log n)", "O(log n)", "O(log n)"],
      ["Binary heap", "O(n)", "O(log n)", "O(log n)", "O(1)"],
      ["Any traversal", "O(n)", "n/a", "n/a", "n/a"]
    ]
  },
  patterns: [
    ["You need every key in sorted order.", "Store them in a search tree and walk it in-order. See [[tree-traversals]]."],
    ["You need fast lookups and also the keys in order, such as everything between 20 and 40.", "Use a search tree. See [[bst]]."],
    ["Keys may arrive sorted, and every operation must stay O(log n).", "Use a self-balancing tree. See [[avl-rotations]]."],
    ["You keep taking the smallest or largest item while new ones arrive.", "Use a heap as a priority queue. See [[binary-heap]]."],
    ["You must sort in O(n log n) with no extra memory.", "Use heap sort. See [[heap-sort]]."]
  ],
  tips: [
    "Most tree functions follow one shape. Handle the empty tree, then call the function on the left and right subtrees and combine the results.",
    "Draw the tree before writing code. Three or four nodes on paper catch most mistakes with left and right.",
    "A heap is not sorted. Only each parent and its children are in order, so do not search it.",
    "Level order needs a queue. The three depth-first orders need recursion or a stack.",
    "Most languages ship balanced trees, such as Java `TreeMap` and C++ `std::map`. Python has `heapq` for heaps but no built-in search tree."
  ],
  cases: [
    {
      title: "The folders on your disk",
      setting: "A file system stores folders inside folders. Each folder can hold files and more folders, and there is one top folder.",
      idea: "That is a tree. Listing everything walks it in pre-order. Working out each folder's size walks it in post-order, children before their parent.",
      why: "A folder's size is the sum of its contents, so the children must be measured first. Post-order gives exactly that order."
    },
    {
      title: "Picking the next job to run",
      setting: "An operating system has many jobs waiting for the processor. Some are urgent, and new ones arrive all the time.",
      idea: "Keep the waiting jobs in a heap keyed by priority. The most urgent job is always at the top, and adding or removing one costs O(log n).",
      why: "Sorting the whole list after every arrival would cost O(n log n) each time. The heap only keeps the one thing that matters, the top, correct."
    },
    {
      title: "Indexes in a database",
      setting: "A database table has millions of rows. A query asks for every order between two dates.",
      idea: "The database keeps an index, a balanced search tree of dates that point to rows. It finds the first date in O(log n), then reads forward in order.",
      why: "A hash table could find one date fast but not a range. A balanced tree does both, and stays short however the rows arrive."
    }
  ],
  hooks: {
    "tree-traversals": "Visit every node in pre-order, in-order, post-order and level order.",
    "bst": "Keep smaller keys left and larger keys right, so each operation follows one path.",
    "avl-rotations": "Rotate nodes after each insert so the tree never grows lopsided.",
    "binary-heap": "Keep the smallest item on top of a tree stored in an array.",
    "heap-sort": "Build a max-heap, then move its top to the end again and again."
  }
};

export default trees;

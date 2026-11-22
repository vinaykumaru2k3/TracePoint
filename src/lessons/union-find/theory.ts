import type { LessonTheory } from "../../theory/types";

const theory: LessonTheory = {
  definition:
    "Union-find keeps items in groups that only ever merge. Each group is a tree whose **root names the group**, `find` climbs to that root, and `union` hangs one root under another.",
  analogy:
    "Every club has a president. To learn which club you are in, ask your contact, who asks theirs, until someone says they are the president. Two clubs merge when one president starts reporting to the other.",
  steps: [
    "Start with every item as its own root: `parent[x] = x`, and each group has size 1.",
    "To join two groups, find both roots and hang one under the other. Their sizes add up.",
    "`find` climbs from an item through its parents until it reaches a node that is its own parent. That node is the root.",
    "Union by size hangs the smaller tree under the larger one. Trees stay shallow, so climbs stay short.",
    "Path compression points every node on a climb straight at the root. The next climb from any of them takes one hop.",
    "Two items are connected exactly when `find` returns the same root for both."
  ],
  shots: [2, 4, 8, 10, 16, 19],
  ops: [
    ["find, union, connected", "O(α(n))", "With both tricks, each costs about constant time. α grows so slowly it stays under 5 for any real input."],
    ["without the two tricks", "O(n)", "Unions can build one long chain, and a find climbs all of it."],
    ["parent and size", "O(n)", "Two arrays with one entry per item."]
  ],
  useWhen: [
    "Groups only grow and you keep asking whether two items are in the same one: network links, or pixels in one region.",
    "You add edges one by one and need to know whether each new edge closes a loop. See [[kruskal-and-prim]]."
  ],
  avoidWhen: [
    "Groups also need to split. Union-find has no cheap way to undo a union.",
    "You need to list every member of a group often. It knows each item's root, not each root's members."
  ],
  example: [
    "Union A B and union C D build two trees of size 2, rooted at A and C.",
    "Union B D climbs from B to A and from D to C, then hangs C under A.",
    "Find D climbs D, C, A. Compression then points D straight at A.",
    "Connected A D finds root A twice and says true. Connected A F finds roots A and E and says false."
  ],
  pitfalls: [
    "Hanging ~~one item~~ under another instead of one root under another. The groups then split apart in the tree.",
    "Comparing parents instead of roots. Two items in one group can have different parents.",
    "Skipping both tricks. Without union by size or compression, a chain of unions makes every find cost O(n)."
  ]
};

export default theory;

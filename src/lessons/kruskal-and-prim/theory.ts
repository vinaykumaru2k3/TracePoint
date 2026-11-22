import type { LessonTheory } from "../../theory/types";

const theory: LessonTheory = {
  definition:
    "A minimum spanning tree links every node of a weighted graph with **the least total edge weight and no loops**. Kruskal adds the cheapest safe edge anywhere, while Prim grows one tree outward from a start.",
  analogy:
    "A town needs roads so every house is reachable, at the lowest paving cost. Kruskal paves the cheapest road that joins two separate areas. Prim starts at the town hall and keeps paving the cheapest road out of the paved area.",
  steps: [
    "Kruskal sorts all edges from cheapest to dearest, and starts with every node in its own union-find group.",
    "Take the next edge. If its ends are in different groups, keep it and merge the groups.",
    "If both ends are already in one group, the edge would close a loop. Skip it.",
    "Stop after n - 1 kept edges. That many edges joins n nodes into one tree.",
    "Prim starts from one node and pushes its edges into a priority queue.",
    "Pop the cheapest edge. If its far end is already in the tree, skip it. Otherwise add that node and push its edges.",
    "Both finish with the same total. Each greedy choice is the cheapest edge across some cut, so it is always safe to keep."
  ],
  shots: [2, 3, 6, 8, 9, 12, 15],
  ops: [
    ["Kruskal", "O(e log e)", "Sorting the edges dominates. The union-find checks are nearly free."],
    ["Prim, binary heap", "O(e log n)", "Each edge can enter the heap once."],
    ["the tree", "O(n)", "A spanning tree on n nodes has n - 1 edges."]
  ],
  useWhen: [
    "You must connect everything at the lowest total cost: cables, pipes, roads, or links between clusters of data.",
    "Pick Kruskal when you already have an edge list. Pick Prim when the graph is dense or stored as adjacency lists."
  ],
  avoidWhen: [
    "You need the cheapest route between two nodes. That is a shortest path, which is a different problem. Use [[dijkstra]].",
    "The edges have direction. A spanning tree of a directed graph needs other algorithms."
  ],
  example: [
    "Edges A-B 4, A-C 1, B-C 2, B-D 5, C-D 8, C-E 9 and D-E 3.",
    "Kruskal keeps A-C 1, B-C 2 and D-E 3. A-B 4 would close the loop A, B, C, so it is skipped.",
    "Kruskal then keeps B-D 5. That is 4 edges for 5 nodes, with total 11.",
    "Prim from A adds C, then B, skips A-B, then adds D and E. Its total is also 11."
  ],
  pitfalls: [
    "Checking for a loop by ~~asking whether both ends were seen~~. Two seen nodes can be in separate pieces. Compare their union-find roots.",
    "Expecting one tree from a graph in pieces. Kruskal returns a forest, one tree per piece, and Prim spans only its start's piece.",
    "Confusing it with shortest paths. The tree minimises the total, not the distance from any one node."
  ]
};

export default theory;

import type { LessonTheory } from "../../theory/types";

const theory: LessonTheory = {
  definition:
    "Depth-first search, or DFS, follows **one path as deep as it can go**, then backs up to the last node with an unexplored edge. Recursion, or a stack, remembers the way back.",
  analogy:
    "Explore a cave by always taking the first passage you have not tried. At a dead end, walk back to the last fork and try its next passage.",
  steps: [
    "Mark the start as seen and visit it. Seen nodes are never visited again.",
    "Take the current node's first neighbour that is not yet seen, and call DFS on it. The call goes one level deeper.",
    "A neighbour already seen is skipped. That is what stops DFS from going round a loop forever.",
    "When a node has no unseen neighbours left, it is finished. Its call returns, and DFS backs up one level.",
    "Back at the earlier node, the loop carries on with its next neighbour. Most of them are already seen by now.",
    "When the start's own call returns, every node reachable from it has been visited exactly once."
  ],
  shots: [2, 3, 4, 15, 21, 23],
  ops: [
    ["time", "O(n + e)", "Each node is visited once and each edge is looked at from both ends."],
    ["seen and order", "O(n)", "One flag per node, plus the visit order."],
    ["call stack, worst case", "O(n)", "A long chain makes the recursion n calls deep."]
  ],
  useWhen: [
    "You need to reach everything, and the order does not matter: counting islands, finding connected pieces, or spotting a cycle.",
    "The answer depends on finishing a node after its neighbours, such as ordering tasks. See [[topological-sort]]."
  ],
  avoidWhen: [
    "You need the shortest path in edges. The first path DFS finds can be long. Use [[bfs]].",
    "The graph is a very long chain and the language limits recursion depth. Use a loop with an explicit stack instead."
  ],
  example: [
    "Edges A-B, A-C, B-D, C-D, C-E, D-F and E-F. Start at A.",
    "A goes to B, B goes to D, and D goes to C. Each step takes the first unseen neighbour.",
    "C goes to E and E goes to F. F has no unseen neighbours, so it finishes first.",
    "The calls unwind back to A. The visit order is A, B, D, C, E, F."
  ],
  pitfalls: [
    "Marking a node seen ~~after its recursive call~~. Loops then call it again before it is marked. Mark it on entry.",
    "Expecting DFS to find shortest paths. It finds a path, and the first one it finds can be the longest.",
    "Assuming one call reaches every node. A graph in pieces needs DFS started again from each unseen node."
  ]
};

export default theory;

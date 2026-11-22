import type { LessonTheory } from "../../theory/types";

const theory: LessonTheory = {
  definition:
    "Breadth-first search, or BFS, visits a graph **in rings around the start**, its neighbours first and then theirs. A queue keeps the order, and each node's ring number is its distance in edges.",
  analogy:
    "Drop a stone in a pond. The first ripple reaches everything one step away, the next ripple everything two steps away. Nothing is reached by the third ripple before the second has passed.",
  steps: [
    "Mark the start at distance 0 and put it in a queue. Every other node starts unseen.",
    "Take the oldest node from the front of the queue. Its distance is now final.",
    "For each neighbour not yet seen, set its distance to one more than the current node, and add it to the back of the queue.",
    "A neighbour already seen is skipped. It already has a distance that is at least as short.",
    "The queue always holds one ring and the start of the next, so the rings come out in order.",
    "Stop when the queue is empty. Every reachable node has its shortest distance, and the rest stay unseen."
  ],
  shots: [2, 3, 4, 7, 16, 23],
  ops: [
    ["time", "O(n + e)", "Each node enters the queue once, and each edge is looked at from both ends."],
    ["space", "O(n)", "The queue and the distance array hold at most one entry per node."],
    ["shortest path, unweighted", "O(n + e)", "The distance BFS finds is the fewest edges from the start."]
  ],
  useWhen: [
    "You need the fewest steps from one node to another, and every edge counts the same: moves in a maze or links between pages.",
    "You want everything within k steps of a start, such as friends of friends."
  ],
  avoidWhen: [
    "Edges have different weights. Fewest edges is then not cheapest. Use [[dijkstra]].",
    "The graph is very wide and you only need any path. The queue can grow huge, and [[dfs]] uses less memory there."
  ],
  example: [
    "Edges A-B, A-C, B-D, C-D, C-E, D-F and E-F. Start at A, at distance 0.",
    "A leaves the queue and finds B and C, both at distance 1.",
    "B finds D at distance 2. C finds E at distance 2, and skips D because D is already seen.",
    "D finds F at distance 3. The final answer is A0 B1 C1 D2 E2 F3."
  ],
  pitfalls: [
    "Marking a node seen ~~when it leaves the queue~~. It can then be added many times. Mark it when you add it.",
    "Using a stack instead of a queue. The order turns depth-first, and the distances stop being shortest.",
    "Forgetting nodes the start cannot reach. They keep distance ∞, so check for it before using a distance."
  ]
};

export default theory;

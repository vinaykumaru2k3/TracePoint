import type { LessonTheory } from "../../theory/types";

const theory: LessonTheory = {
  definition:
    "Dijkstra's algorithm finds the cheapest route from one node to every other when **no edge weight is negative**. It always settles the closest unsettled node next, using a priority queue.",
  analogy:
    "Water poured at the start spreads through pipes of different lengths. It reaches the nearest junction first, then the next nearest. When it first touches a junction, that arrival time is final.",
  steps: [
    "Set the start's distance to 0 and every other distance to ∞. Put the start in a priority queue keyed by distance.",
    "Take the entry with the smallest distance out of the queue. That node is settled, and its distance is final.",
    "Relax each edge of the settled node: if going through it gives a neighbour a smaller distance, record it and push the neighbour.",
    "A node can get cheaper more than once. Each improvement pushes a new entry, and the old one stays in the queue.",
    "An entry whose distance is larger than the recorded one is out of date. Skip it when it comes out.",
    "Stop when the queue is empty. Every reachable node has its cheapest distance, and the rest stay at ∞."
  ],
  shots: [2, 3, 5, 8, 15, 24],
  ops: [
    ["time, binary heap", "O(e log n)", "Each edge can push one entry, and each push or pop costs about log n."],
    ["heap entries, lazy", "O(e)", "Out-of-date entries stay until popped, so the heap can hold one per edge."],
    ["distances", "O(n)", "One distance per node."]
  ],
  useWhen: [
    "Edges have weights such as distance, time or price, and none of them is negative.",
    "You need the cheapest route from one start, to one target or to every node."
  ],
  avoidWhen: [
    "Some edge weights are negative. A settled node could later get cheaper, and the answer would be wrong. Use Bellman-Ford.",
    "Every edge costs the same. [[bfs]] gives the same answer without a heap."
  ],
  example: [
    "Edges A-B 4, A-C 1, C-B 2, B-D 5, C-D 8, D-E 3 and C-E 9. Start at A.",
    "A settles at 0 and pushes B:4 and C:1. C comes out first, at cost 1.",
    "Through C, B drops to 3, D becomes 9 and E becomes 10. B settles at 3 and lowers D to 8.",
    "B:4 and D:9 come out later and are skipped as out of date. The answer is A0 B3 C1 D8 E10."
  ],
  pitfalls: [
    "Settling a node ~~when it is first pushed~~. A cheaper route may still arrive. A node is final only when it is popped.",
    "Forgetting to skip out-of-date entries. The algorithm then relaxes from a wrong distance and wastes work.",
    "Using it with negative weights. It does not fail loudly, it returns wrong distances."
  ]
};

export default theory;

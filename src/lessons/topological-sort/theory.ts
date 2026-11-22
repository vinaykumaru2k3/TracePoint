import type { LessonTheory } from "../../theory/types";

const theory: LessonTheory = {
  definition:
    "A topological sort lists the nodes of a directed graph so that **every arrow points forward** in the list. It exists only when the graph has no cycle.",
  analogy:
    "Getting dressed has an order. Socks go on before shoes, and a shirt before a jacket. Any order that respects every before-rule works, and there is often more than one.",
  steps: [
    "Count the arrows into each node. That count is its in-degree, the number of tasks it still waits on.",
    "Put every node with in-degree 0 into a queue. Nothing has to happen before them.",
    "Take a node from the queue and add it to the output. Every task it was waiting on is already placed.",
    "Remove its outgoing arrows by lowering each target's in-degree. A target that drops to 0 is free and joins the queue.",
    "Stop when the queue is empty. If the output holds every node, it is a valid order. If not, the rest form a cycle."
  ],
  shots: [2, 3, 4, 7, 16],
  ops: [
    ["time", "O(n + e)", "Each node leaves the queue once and each arrow is lowered once."],
    ["space", "O(n)", "The in-degree array, the queue and the output."],
    ["detect a cycle", "O(n + e)", "Count the output. Fewer than n nodes means a cycle."]
  ],
  useWhen: [
    "Tasks depend on other tasks: build steps, course prerequisites, or cells in a spreadsheet that read other cells.",
    "You need to know whether a set of rules contains a loop. A short output proves one exists."
  ],
  avoidWhen: [
    "The edges have no direction. An undirected edge points both ways, so every edge would be a cycle.",
    "You need one specific order, such as alphabetical. Kahn's method gives some valid order, so sort the queue if you need a fixed one."
  ],
  example: [
    "Arrows A→C, B→C, B→D, C→E, D→E and E→F. A and B have in-degree 0.",
    "A leaves first and lowers C to 1. B leaves next and frees both C and D.",
    "C and D each lower E. The second one frees E, and E then frees F.",
    "The order is A, B, C, D, E, F, and every arrow points forward in it."
  ],
  pitfalls: [
    "Running it on a graph with a cycle and ~~trusting a partial order~~. Always check that the output has all n nodes.",
    "Reversing the arrows by mistake. Decide once whether `u → v` means u comes first, and store edges that way.",
    "Assuming the order is unique. Many graphs have several valid orders, so tests must not expect one fixed list."
  ]
};

export default theory;

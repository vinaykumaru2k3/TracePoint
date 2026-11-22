import type { LessonTheory } from "../../theory/types";

const theory: LessonTheory = {
  definition:
    "A graph is a set of **nodes joined by edges**. It is stored as an adjacency list, one list of neighbours per node, or as an adjacency matrix, one cell per pair.",
  analogy:
    "Picture a class phone list. The list form gives each student a page with the numbers they know. The matrix form is a big seating chart with a tick wherever two students know each other.",
  steps: [
    "Give every node a number from 0 to n - 1. Then `adj[u]` is a list, and `mat[u][v]` is one cell of an n by n grid.",
    "An undirected edge u-v goes into both places at once: v joins u's list, u joins v's list, and both matching cells become 1.",
    "Ask the matrix whether u and v are joined by reading one cell. The answer costs one step, however large the graph is.",
    "Ask the list the same question by walking u's neighbours one by one, comparing each with v.",
    "Reach the end of u's list without meeting v, and the answer is no. That walk cost one step per neighbour.",
    "Listing all of a node's neighbours is where lists win. They hold only real edges, while a matrix row must check all n cells."
  ],
  shots: [2, 6, 7, 8, 10, 14],
  ops: [
    ["hasEdge, matrix", "O(1)", "Read the cell `mat[u][v]`."],
    ["hasEdge, list", "O(deg)", "Walk u's list. deg is u's degree, its number of neighbours."],
    ["neighbours, list", "O(deg)", "The list holds exactly the neighbours."],
    ["neighbours, matrix", "O(n)", "Check every cell in u's row, including the zeros."],
    ["space, list", "O(n + e)", "One list per node plus two entries per undirected edge."],
    ["space, matrix", "O(n²)", "Every pair of nodes gets a cell, joined or not."]
  ],
  useWhen: [
    "Use a list for most graphs. Real graphs are sparse: each node touches a few others, so lists stay small and walks stay short.",
    "Use a matrix when the graph is small or dense, and the main question is whether two given nodes are joined."
  ],
  avoidWhen: [
    "Avoid a matrix for a large sparse graph. A million nodes means a trillion cells, nearly all of them zero.",
    "Avoid a list when the algorithm keeps asking about one pair at a time, such as checking many candidate edges."
  ],
  example: [
    "Edges A-B, A-C, B-D, C-D and D-E give A the list `[B, C]` and D the list `[B, C, E]`.",
    "The matrix row for A reads `0 1 1 0 0`. The 1s sit under B and C.",
    "Is A joined to D? The matrix reads cell A,D, which is 0. The list walks B and C, finds no D, and also says no.",
    "D's neighbours come straight from its list: B, C and E. The matrix finds them only by checking all five cells."
  ],
  pitfalls: [
    "Adding an undirected edge to ~~one list only~~. Walks then work in one direction and fail in the other. Write both ends.",
    "Counting a matrix as cheap because each lookup is O(1). Building it already costs O(n²) time and memory.",
    "Mixing node names and indexes. Map each name to one index once, and use that index everywhere."
  ]
};

export default theory;

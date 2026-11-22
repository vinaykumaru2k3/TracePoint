import type { Guide } from "../types";

const graphs: Guide = {
  section: "graphs",
  tagline: "How to model anything made of connections, and walk, order, route and join it.",
  core: [
    "A graph is a set of **nodes joined by edges**. Cities and roads, people and friendships, tasks and the tasks they wait on are all graphs. An edge can have a direction, like a one-way street, and a weight, like a road's length.",
    "Most graph work starts with a walk. **BFS spreads out ring by ring** from a start and finds the fewest edges to every node. **DFS follows one path as deep as it goes** and backs up. Both visit each node and edge once, in O(n + e).",
    "The rest of the section builds on those walks. Topological sort orders tasks by their arrows. Dijkstra adds weights and a priority queue to find the cheapest routes. Union-find tracks which nodes are joined, and Kruskal and Prim use that to connect everything at the lowest total cost."
  ],
  analogy:
    "Think of a city map. The junctions are nodes and the streets are edges. Some streets are one-way, and each has a length. Every question on this map is a graph question: how to get there, in what order, and how cheaply.",
  prereqs: [
    "The [[queue]] lesson. BFS and topological sort hand out nodes in the order they arrived.",
    "The [[call-stack]] lesson. DFS is recursion that backs up when a path runs out.",
    "The [[binary-heap]] lesson. Dijkstra and Prim always take the cheapest entry next."
  ],
  terms: [
    ["node", "One item in the graph, such as a city. Also called a vertex. n is the number of nodes."],
    ["edge", "A link between two nodes. e is the number of edges. A directed edge, or arrow, goes one way only."],
    ["weight", "A number on an edge, such as distance, time or price."],
    ["neighbour", "A node one edge away. A node's degree is how many neighbours it has."],
    ["path", "A chain of edges from one node to another. A cycle is a path that returns to where it started."],
    ["connected", "Two nodes are connected when some path joins them. A graph in pieces has several connected parts."],
    ["spanning tree", "A set of n - 1 edges that joins all n nodes with no cycle."]
  ],
  cheat: {
    head: ["Question", "Use", "Time"],
    rows: [
      ["Fewest edges from a start", "[[bfs]]", "O(n + e)"],
      ["Visit everything, find pieces or cycles", "[[dfs]]", "O(n + e)"],
      ["Order tasks so each comes after what it needs", "[[topological-sort]]", "O(n + e)"],
      ["Cheapest route (weights not negative)", "[[dijkstra]]", "O(e log n)"],
      ["Are these two in the same group?", "[[union-find]]", "O(α(n))"],
      ["Join everything at least total cost", "[[kruskal-and-prim]]", "O(e log e)"]
    ]
  },
  patterns: [
    ["A grid, a maze or a network asks for the fewest moves.", "Treat each cell as a node and run BFS from the start. See [[bfs]]."],
    ["Items depend on other items and must go in order.", "Draw an arrow from each prerequisite and run a topological sort. See [[topological-sort]]."],
    ["Moves have different costs and you want the cheapest total.", "Run Dijkstra if no cost is negative. See [[dijkstra]]."],
    ["Links arrive one at a time and you ask who is joined.", "Keep a union-find and merge on each link. See [[union-find]]."]
  ],
  tips: [
    "Store most graphs as adjacency lists. A matrix needs n² cells, which is wasteful when each node has few neighbours.",
    "Mark a node seen when you first add it to the queue or stack, not when you take it out. Otherwise it gets added many times.",
    "A graph in pieces needs one walk per piece. Loop over every node and start a new walk from each one still unseen.",
    "Before using a distance, check for ∞. A node the start cannot reach keeps its starting value.",
    "Use BFS when every edge costs the same. Dijkstra gives the same answer, only slower."
  ],
  cases: [
    {
      title: "Turn-by-turn directions",
      setting: "A maps app must find the fastest route between two addresses. The road network has millions of junctions, and each road has a travel time.",
      idea: "Junctions are nodes, roads are weighted edges, and the route is a cheapest path. Real apps run Dijkstra with extra tricks that steer the search toward the target.",
      why: "Travel times are never negative, so Dijkstra's settled distances are final. The heap keeps the search on the closest junctions first."
    },
    {
      title: "Build order for a project",
      setting: "A build tool must compile hundreds of modules. Each module needs some others compiled first, and a loop in those needs is a mistake to report.",
      idea: "Draw an arrow from each module to the ones that need it, and take a topological sort. Modules left over form a cycle.",
      why: "The sort gives a valid order in one pass over the arrows, and the same pass proves whether a cycle exists."
    },
    {
      title: "Laying cable",
      setting: "A company must connect every office with fibre. Each possible link has a price, and any connected layout works.",
      idea: "Run Kruskal or Prim on the links and their prices. The result is a minimum spanning tree.",
      why: "Each greedy choice is the cheapest link across some split of the offices, so it is always safe to keep."
    }
  ],
  hooks: {
    "representations": "Store the same graph as adjacency lists and as a matrix, and see which questions each answers fast.",
    "bfs": "Spread from a start ring by ring, and read off the fewest edges to every node.",
    "dfs": "Follow one path as deep as it goes, then back up and try the next.",
    "topological-sort": "Free the tasks nothing waits on, one at a time, until all are placed or a cycle remains.",
    "dijkstra": "Settle the closest node, relax its edges, and skip the entries that went out of date.",
    "union-find": "Merge groups by hanging roots, and flatten every climb toward the root.",
    "kruskal-and-prim": "Connect every node at the least total cost, edge by edge or tree outward."
  }
};

export default graphs;

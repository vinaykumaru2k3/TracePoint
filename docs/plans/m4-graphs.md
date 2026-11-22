# M4: Graphs — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (the user asked for no subagents). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the 7 lessons of curriculum section 08 (Graphs) playable, then give the section a guide and every lesson a theory tab.

**Order:** the trace module comes first for every lesson (Tasks 1–7), then the theory (Tasks 8–9), as in M3.

**Architecture:** Each lesson is a folder `src/lessons/<id>/` that follows the M2 and M3 pattern:
- a pure `generate.ts`;
- `index.ts` (`defineLesson`) and `generate.test.ts`;
- `code/Main.java|main.py|main.cpp` with `@a` anchors;
- `theory.ts`.

Three shared pieces are new:
- `src/iso/GraphNodes.tsx` draws a graph on the floor. Nodes are the same square slabs as `TreeNodes`, placed by screen column and row. Edges run centre to centre at mid-slab height. An edge can carry a weight badge at its midpoint and an arrowhead where it meets the target slab. Edge states are `default`, `active`, `dim` and `tree`; `tree` marks an edge the algorithm keeps (a BFS tree edge, a shortest-path edge, an MST edge).
- `src/lessons/graphkit.ts` holds the parser, the layouts and the memory view:
  - `parseGraph(text, { directed, weighted })` reads `A-B 4, B-C 1, start A`. Nodes are letters A to H. At most 8 nodes and 12 edges. Self-loops, repeated edges and weights outside 0–99 are rejected with a sentence that says why.
  - `ringLayout(ids)` puts nodes on an ellipse, so no edge runs through a node it does not touch.
  - `forestLayout(parent)` lays out union-find trees, roots on top.
  - `adjMemory(title, s, note)` lists each node's adjacency list as one memory cell.
- `src/lessons/GraphScene.tsx` draws `GraphNodes` and an optional `Strip` under it, like `TreeScene`. `Strip` gains `labels?: string[]`, so its index row can read `[A] [B]` instead of `[0] [1]`.

**Tech Stack:** React 18, TypeScript strict, Vite `?raw` imports, Vitest. Isometric SVG via `src/iso/`.

**Spec:**
- `C:\Users\vinay kumar\.claude\plans\we-can-follow-a-pure-sphinx-of-a7378d36-37fe-4085-9053-14f3f1f52add.md`, the cycle-1 plan: "M4: section 8 (graphs)".
- `docs/specs/theory-layer.md` for the theory and guide writing rules.
- `CLAUDE.md`, sections "How a lesson works" and "Design rules".

## Global Constraints

- Lesson ids equal the curriculum slugs: `representations`, `bfs`, `dfs`, `topological-sort`, `dijkstra`, `union-find`, `kruskal-and-prim`, all in section `graphs`.
- The lesson contract holds: pure `generate()`; first step `problem`, last `recap`, at least 6 steps; the same anchor set in all three languages; notes keyed by a used anchor; `op` of 14 characters or fewer, or a `short`; every learn item reachable from the default input or a preset.
- Default runs stay at about 40 steps or fewer, the largest input at 80 or fewer.
- Neighbours are visited in adjacency-list order: edges in the order typed, appended to both ends when undirected. That is what the code does, so every run matches it.
- No raw colours. States come from `BlockState`, edge states from `GEdge["state"]`, legends use `s-<state>`.
- Theory and guide follow `docs/specs/theory-layer.md`; `checkTheory` / `checkGuide` pass.
- Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Test command: `npx vitest run`, plus `npm run build`.

## Review Focus

1. **A node no edge reaches** (`A-B, C-D`): BFS and DFS leave it unvisited with a clear recap, Dijkstra keeps its distance at ∞. Tests in Tasks 2, 3 and 5.
2. **A cycle in a directed graph**: topological sort must stop with fewer nodes than the graph has and say a cycle blocks it, not loop or crash. Test in Task 4.
3. **A stale priority-queue entry** in Dijkstra: an entry whose distance has since improved is popped and skipped, not processed twice. Test in Task 5.
4. **Union of two nodes already in one set**, and **connected on a node that was never unioned**: both answer from the roots with no crash. Tests in Task 6.
5. **A graph that is not connected** given to Kruskal and Prim: Kruskal ends with a forest, Prim spans only the start's part, and both say so. Test in Task 7.

---

### Task 0: Shared pieces

- [ ] `src/iso/GraphNodes.tsx`: `GraphNodes({ nodes, edges, pointers })`, `graphFrame(c0, c1, rows)`. `GEdge = { from; to; state?: "default" | "active" | "dim" | "tree"; w?: number | string; dir?: boolean }`. Nodes reuse `TNode`.
- [ ] `Strip` in `src/iso/TreeNodes.tsx` takes `labels?: string[]` for the index row.
- [ ] `src/lessons/graphkit.ts`: `GraphState`, `parseGraph`, `ringLayout`, `forestLayout`, `adjMemory`, `graphView`.
- [ ] `src/lessons/GraphScene.tsx`.
- [ ] CSS: `.edge.e-tree`, `.arrow-head` per state, `.edge-w` badge.

### Task 1: Representations

- [ ] **Input:** an undirected graph. Default `A-B, A-C, B-D, C-D, D-E`.
- [ ] **Steps:** one `add` step per edge, writing it into both adjacency lists and both matrix cells. Then the matrix row of A, `hasEdge` through the matrix (one look) and through the list (a walk), and `neighbours(D)` through the list.
- [ ] **Tests:** the lists after the build; `hasEdge(A, D)` is false both ways; `neighbours(D)` is `[B, C, E]`.

### Task 2: BFS

- [ ] **Input:** undirected graph, optional `start X` (default the first letter). Default `A-B, A-C, B-D, C-D, C-E, D-F, E-F`.
- [ ] **Steps:** enqueue the start; per node one `remove` (poll) step, then one step per neighbour: `add` when it is new (distance + 1, tree edge), `check` when it was already seen. The strip is the queue. Tags show distances.
- [ ] **Tests:** distances `A0 B1 C1 D2 E2 F3`; an island node stays unreached.

### Task 3: DFS

- [ ] **Input:** as BFS. Default `A-B, A-C, B-D, C-D, C-E, D-F, E-F`.
- [ ] **Steps:** recursive DFS. Enter a node (`add`), one step per neighbour (`move` into a new one, `check` for a seen one), and a `remove` step on return. The strip is the call stack.
- [ ] **Tests:** visit order `A B D C E F`; the stack is empty at the end; an island stays unvisited.

### Task 4: Topological sort

- [ ] **Input:** a directed graph, `A-B` read as A → B. Default `A-C, B-C, B-D, C-E, D-E, E-F`.
- [ ] **Steps:** Kahn's algorithm. Count in-degrees, queue the zeros, then pop a node into the order and remove each of its out-edges, queueing a node when its in-degree reaches 0. Tags show in-degrees. The strip is the output order.
- [ ] **Tests:** order `A B C D E F`; a cycle stops early with a `cycle` step.

### Task 5: Dijkstra

- [ ] **Input:** an undirected weighted graph, weights 0–99. Default `A-B 4, A-C 1, C-B 2, B-D 5, C-D 8, D-E 3, C-E 9`.
- [ ] **Steps:** lazy priority queue. Pop the smallest entry (`remove`), skip it if stale, then relax each edge: `add` when the distance improves, `check` when it does not. Tags show distances. The strip is the queue in distance order.
- [ ] **Tests:** distances `A0 B3 C1 D8 E10`; a stale entry is skipped; an island stays ∞.

### Task 6: Union-Find

- [ ] **Input:** ops `union X Y`, `find X`, `connected X Y`, up to 10. Default `union A B, union C D, union B D, union E F, find D, connected A D, connected A F`.
- [ ] **Steps:** union by size, find with path compression. One step per parent hop, one per compressed link, one for the link or the same-root answer. The scene is the forest, child → parent arrows. The strip is the parent array.
- [ ] **Tests:** `find(D)` returns A and compresses D's link to A; `connected(A, F)` is false; a second `union A B` answers already joined.

### Task 7: Kruskal and Prim

- [ ] **Input:** an undirected weighted graph. Default `A-B 4, A-C 1, B-C 2, B-D 5, C-D 8, C-E 9, D-E 3`.
- [ ] **Steps:** Kruskal first: sort the edges, then take or skip each one using union-find. Then Prim from the start: each step adds the cheapest edge leaving the tree. The strip is the sorted edge list, then the candidate edges.
- [ ] **Tests:** both totals are 11 with edges `AC BC DE BD`; a disconnected graph ends with a forest.

### Task 8: Theory for the 7 lessons

- [ ] One `theory.ts` per lesson, with shots pointing at the default run.

### Task 9: Guide for `graphs`

- [ ] `src/theory/guides/graphs.ts`, registered in `GUIDES`. The "unfinished section" tests move from `graphs` to `dp`.
- [ ] CLAUDE.md: 8 sections, 40 lessons, the graph kit.

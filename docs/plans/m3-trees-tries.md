# M3: Trees, Heaps and Tries — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (the user asked for no subagents). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the 7 lessons of curriculum sections 06 (Trees) and 07 (Tries) playable, then give both sections a guide and every lesson a theory tab.

**Order:** the trace module comes first for every lesson (Tasks 1–7), then the theory (Tasks 8–9). That is how the user asked for it.

**Architecture:** Each lesson is a folder `src/lessons/<id>/` that follows the M2 pattern:
- a pure `generate.ts`;
- a `Scene.tsx` built from `src/iso/` pieces;
- `index.ts` (`defineLesson`) and `generate.test.ts`;
- `code/Main.java|main.py|main.cpp` with `@a` anchors;
- `theory.ts`.

Three shared pieces are new:
- `src/iso/TreeNodes.tsx` draws a rooted tree. The nodes are square slabs laid out in screen space: x is a column, y is the depth. Edges are undirected lines whose `d` animates, so a rotation slides the nodes and their edges together. Nodes take an optional small tag under them, such as a balance factor or `h2`, and pointer flags.
- `src/lessons/treekit.ts` holds the binary search tree model the tree lessons share: `BNode`, `insert`, `inorderCols` (in-order columns) and `depthOf`. It also has `levelCols` (complete-tree layout by array index) and `leafCols` (tidy layout for n-ary trees, the trie).
- `src/lessons/HeapScene.tsx` draws the heap as a tree of `a[0..size)` above the array as a `CellRow`. `binary-heap` and `heap-sort` share it.

**Tech Stack:** React 18, TypeScript strict, Vite `?raw` imports, Vitest. Isometric SVG via `src/iso/`.

**Spec:**
- `C:\Users\vinay kumar\.claude\plans\we-can-follow-a-pure-sphinx-of-a7378d36-37fe-4085-9053-14f3f1f52add.md`, the cycle-1 plan. It says "M3: sections 6–7 (trees, heaps, tries)".
- `docs/specs/theory-layer.md` for the theory and guides, including the writing rules.
- `CLAUDE.md`, sections "How a lesson works" and "Design rules".

## Global Constraints

- Lesson ids must equal the curriculum slugs: `tree-traversals`, `bst`, `avl-rotations`, `binary-heap`, `heap-sort` (section `trees`) and `trie`, `autocomplete` (section `tries`).
- The M2 lesson contract still holds:
  - `generate()` is pure.
  - The first step is `problem`, the last is `recap`, and every run is at least 6 steps.
  - Anchors exist in all three languages, and the three files define the same anchor set.
  - Notes are keyed by a used anchor.
  - `op` is 14 characters or fewer, or the step sets `short`.
  - Every learn item is reachable from the default input or a preset.
- Default runs stay at about 40 steps or fewer, and the largest input stays at 80 or fewer.
- No raw colours. States come from `BlockState`, legends use `s-<state>`, and no unicode glyph is used as an icon.
- Theory and guides follow `docs/specs/theory-layer.md`, and `checkTheory` / `checkGuide` must pass.
- Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Test command: `npx vitest run`, plus `npm run build` (typecheck and bundle).

## Review Focus

1. **Sorted input to a BST** (`1 2 3 4 5 6`) becomes a path as deep as the input is long. The scene must still fit through the camera, and the AVL lesson must turn the same input into a balanced tree. Covered in Tasks 2 and 3.
2. **Duplicates.** A BST and an AVL tree ignore a duplicate insert with a clear step. A heap keeps duplicates. Tests in Tasks 2, 3 and 4.
3. **Deleting the root and a node with two children** must keep the in-order sequence sorted. Test in Task 2.
4. **Pop from an empty heap, and a search for a missing word or a prefix with no words,** must give a clear `empty` step and not crash. Tests in Tasks 4, 6 and 7.
5. **A word that is a prefix of another** (`car` / `cart`): search must use the end-of-word mark, not merely reaching the node. Test in Task 6.

---

### Task 0: Shared pieces

- [ ] `src/iso/TreeNodes.tsx`:
  - `TreeNodes({ nodes, edges, pointers })` and `treeFrame(cols, depth)`.
  - `TNode = { id; v; col; depth; state?; tag?; ring? }`. `ring` marks an end-of-word node in the trie.
  - `TEdge = { from; to; state? }`.
  - Layout: column spacing `COL` px, depth spacing `ROW` px. A screen point turns into grid coordinates through the inverse of `project`.
- [ ] `src/lessons/treekit.ts` with the BST helpers, plus `levelCols(i, size)` and `leafCols(tree)`.
- [ ] `src/lessons/HeapScene.tsx` and `heapkit.ts`: `HeapState = { a; size; marks; done; ptrs; … }`.

### Task 1: Tree traversals

- [ ] **Input:** distinct values, 1–9, inserted into a BST to fix the shape. Default `4 2 6 1 3 5 7`.
- [ ] **Steps:** each traversal gets a header step, then one `visit` step per node. The current recursion path is marked `visited`.
  - Pre-order, in-order and post-order are recursive.
  - Level-order uses a queue, shown in `vars`.
- [ ] **Output:** an `out` CellRow under the tree.
- [ ] **Tests:**
  - The default gives pre-order `4 2 1 3 6 5 7`, in-order `1 2 3 4 5 6 7`, post-order `1 3 2 5 7 6 4` and level-order `4 2 6 1 3 5 7`.
  - Nine sorted values give 80 steps or fewer.

### Task 2: BST

- [ ] **Ops:** `insert N`, `search N`, `delete N`, up to 9 inserts.
- [ ] **Steps:**
  - Each compare is one step.
  - Delete covers three cases: a leaf, one child, and two children (via the in-order successor).
- [ ] **Tests:**
  - Search returns true and false.
  - Deleting a node with two children keeps the in-order sequence sorted.
  - Deleting the root works.
  - A duplicate insert is ignored.

### Task 3: AVL rotations

- [ ] **Input:** values to insert, 1–8 of them. Default `10 20 30 25 28 5 4`, which needs the RR, LR and LL cases. The preset `10 30 20` needs RL.
- [ ] **Steps per insert:**
  - The walk down to the new leaf.
  - A height and balance check on the way back up.
  - Rotation steps, which say which case applies.
- [ ] **Tags:** each node shows its balance factor.
- [ ] **Tests:**
  - The default ends with in-order `4 5 10 20 25 28 30` and the root 20.
  - `1 2 3 4 5 6 7` ends perfectly balanced, with height 3.
  - All four cases appear across the default input and the presets.

### Task 4: Binary heap (min-heap)

- [ ] **Ops:** `push N` and `pop`, up to 10 items.
- [ ] **Steps:** push adds the value at the end and sifts it up. Pop takes the root, moves the last item to the root and sifts it down. There is one step per sift level.
- [ ] **Tests:**
  - The pops come out sorted.
  - Pop on an empty heap gives an `empty` step that returns `null`.

### Task 5: Heap sort

- [ ] **Input:** 2–8 numbers. Default `5 1 4 2 8 3`.
- [ ] **Steps:**
  - Build a max heap with sift-downs from `n/2 - 1` to 0.
  - Then, n - 1 times, swap the root into the sorted tail and sift down.
- [ ] **Tests:**
  - The default sorts, and so does an input with duplicates.
  - Eight reversed values give 80 steps or fewer.

### Task 6: Trie

- [ ] **Ops:** `insert word`, `search word`, `prefix word`. Words are a–z, 1–6 letters, with up to 10 ops and 24 nodes.
- [ ] **Steps:** one per character: follow an edge or create one. Insert ends by marking the end of the word.
- [ ] **Tests:**
  - After `cart` is inserted, `search car` is false, and true once `car` is inserted.
  - A prefix test is true and a missing branch is false.

### Task 7: Autocomplete

- [ ] **Input:** `words…, prefix p`. Default `car cart care cat dog, prefix ca`.
- [ ] **Steps:**
  - One step per inserted word.
  - Walk the prefix.
  - Depth-first collect: one step per node, alphabetical, with each word found emitted to the `out` list.
- [ ] **Tests:**
  - The default suggests `car, care, cart, cat`.
  - A prefix with no node gives an `empty` step and `[]`.

### Task 8: Theory for the 7 lessons

- [ ] Write a `theory.ts` per lesson, with `shots` that point at real steps of the default run.

### Task 9: Guides for `trees` and `tries`

- [ ] `src/theory/guides/trees.ts` and `tries.ts`, registered in `GUIDES`.
- [ ] `theory.test.ts` uses a section that is still "soon" (`graphs`) for its soon checks.
- [ ] CLAUDE.md: update the current state (M3, 33 lessons) and `src/` layout for the new shared pieces.

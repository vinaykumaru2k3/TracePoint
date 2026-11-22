# M5: Dynamic programming and Advanced — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (the user asked for it). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the 9 lessons of curriculum sections 09 (Dynamic programming) and 10 (Advanced) playable, give both sections a guide and every lesson a theory tab. After M5 every lesson in `src/curriculum.ts` is live.

**Order:** shared pieces (Task 0), the trace modules (Tasks 1–9), then theory (Tasks 10–11) and the guides (Task 12), as in M3 and M4.

**Architecture:** Each lesson is a folder `src/lessons/<id>/` in the established pattern (read `src/lessons/bfs/` and `src/lessons/selection-sort/` as references before writing one):
- a pure `generate.ts`;
- `index.ts` (`defineLesson`) and `generate.test.ts`;
- `code/Main.java|main.py|main.cpp` with `@a` anchors;
- `theory.ts` (added in Tasks 10–11; until then a lesson's `theory` may be omitted only if the registry tests allow it — otherwise add a minimal valid theory and replace it later).

New shared pieces:
- `src/iso/GridTable.tsx` draws a 2D DP table on the floor: a grid of `IsoPlate` cells (row `r` at grid y `r * step`, column `c` at grid x `c * step`), a header label per column above row 0 and per row left of column 0, and an optional `pointers` list (`{ r, c, label }`). `gridFrame(rows, cols, step?)` returns frame points for `SceneFit`, like `rowFrame`.
- `src/lessons/dpkit.ts`:
  - `Grid = Cell[][]` (`Cell` from `iso/CellRow`), `blankGrid(rows, cols)` (all `v: null`, drawn stale);
  - `paint(grid, cells: [r, c][], state)` returns a copy with those cells set to the state;
  - `tableMemory(title, grid, rowHead, colHead, note)` lists each row as one memory cell (`row i: 0 1 1 2 …`);
  - `parseInts(text, { min, max, maxCount })` and `parseWords(text, { maxLen, count })` that reject bad input with a sentence that says why.
- `src/lessons/DPScene.tsx` draws either a 1D table (`CellRow`) or a 2D table (`GridTable`), plus an optional labelled `Strip` (call stack, coins, chosen items) under it. Cell states: `active` the cell being written, `compare` the cells it reads, `found` the answer and the traceback path, `stale` not computed yet, `default` computed.

**Tech Stack:** React 18, TypeScript strict, Vite `?raw` imports, Vitest. Isometric SVG via `src/iso/`.

**Spec:**
- `C:\Users\vinay kumar\.claude\plans\we-can-follow-a-pure-sphinx-of-a7378d36-37fe-4085-9053-14f3f1f52add.md`, the cycle-1 plan: "M5: DP/advanced".
- `docs/specs/theory-layer.md` for the theory and guide writing rules.
- `CLAUDE.md`, sections "How a lesson works", "Theory layer" and "Design rules".

## Global Constraints

- Lesson ids equal the curriculum slugs: `fibonacci`, `climbing-stairs`, `coin-change`, `knapsack`, `lcs`, `edit-distance` in section `dp`; `bit-manipulation`, `greedy-intervals`, `segment-tree` in section `advanced`.
- The lesson contract holds: pure `generate()`; first step `problem`, last `recap`, at least 6 steps; the same anchor set in all three languages; notes keyed by a used anchor; `op` of 14 characters or fewer, or a `short`; every learn item reachable from the default input or a preset. Step kinds are only `problem | add | remove | peek | empty | check | move | found | recap`.
- Default runs stay at about 40 steps or fewer, the largest accepted input at 80 or fewer. Input limits below are chosen to hold that; the parser enforces them.
- Rail names must differ from their neighbours: when a step's `op` would repeat the previous step's op (e.g. every step `dp[i]`), give it a `short` such as `dp[4]`, `coin 3`, `take B`.
- No raw colours. States come from `BlockState`; legends use `s-<state>`.
- Theory and guide follow `docs/specs/theory-layer.md`; `checkTheory` / `checkGuide` pass.
- JetBrains Mono only; no new fonts, no new colour tokens unless added to `tokens.css` with a dark value.
- Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Test command: `npx vitest run`, plus `npm run typecheck` and `npm run build`.

## Review Focus

1. **Smallest inputs**: `fibonacci` with n = 0 and 1, `climbing-stairs` with n = 1, `coin-change` with amount 0, `lcs` / `edit-distance` with an empty word, `segment-tree` over one element. Each still runs from problem to recap with the right answer. Tests in the owning tasks.
2. **No answer exists**: `coin-change` with coins `2` and amount 3 ends with −1 and a recap that says the amount cannot be made. Test in Task 3.
3. **An item heavier than the capacity** in `knapsack` is never taken; its row copies the row above. Test in Task 4.
4. **Bit overflow**: `bit-manipulation` works on 8 bits; `200 << 1` keeps only the low 8 bits (144) and the step says a bit fell off. Test in Task 7.
5. **Touching intervals** (`1-3, 3-5`) in `greedy-intervals` count as compatible, both taken. Test in Task 8.

---

### Task 0: Shared DP pieces

- [ ] `src/iso/GridTable.tsx`: `GridTable({ grid, rowHead, colHead, pointers?, step? })`, `gridFrame(rows, cols, step?)`.
- [ ] `src/lessons/dpkit.ts`: `blankGrid`, `paint`, `tableMemory`, `parseInts`, `parseWords` as above, with unit tests in `src/lessons/dpkit.test.ts` (paint does not mutate its input; parseInts rejects out-of-range and too many values with a message).
- [ ] `src/lessons/DPScene.tsx`.
- [ ] Any CSS needed for header labels reuses `.plate-index` / scene label styles.

### Task 1: Fibonacci

- [ ] **Input:** `n`, 0–15. Default `6`.
- [ ] **Steps:** top-down with a memo. Calling `fib(k)` pushes a frame (`add`); a memo hit answers at once (`found`); `k < 2` is the base case (`check`); after both children return, the sum is stored in `memo[k]` (`add`) and the frame pops (`remove`). The 1D table is the memo; the strip is the call stack.
- [ ] **Tests:** `fib(6) = 8`; memo is `0 1 1 2 3 5 8`; exactly 11 calls for n = 6, 3 of them memo hits (base cases `k < 2` return before the memo is read, so they are not hits); n = 0 and n = 1 answer at once.

### Task 2: Climbing stairs

- [ ] **Input:** `n`, 1–20. Default `6`.
- [ ] **Steps:** bottom-up `ways[i] = ways[i-1] + ways[i-2]`, `ways[0] = ways[1] = 1`. Per `i`: one `check` step reading the two cells (compare), one `add` step writing `ways[i]` (active).
- [ ] **Tests:** `ways(6) = 13`; n = 1 gives 1; the table is `1 1 2 3 5 8 13`.

### Task 3: Coin change

- [ ] **Input:** `coins 1 3 4, amount 6`. Coins 1–20, up to 4 coins; amount 0–12.
- [ ] **Steps:** `dp[0] = 0`, rest ∞. For each amount `a`, try each coin `c ≤ a`: `check` when `dp[a-c] + 1` does not beat `dp[a]`, `add` when it does. Then trace the coins back from `dp[amount]` (`found` steps). The strip shows the coins; ∞ cells show `∞`.
- [ ] **Tests:** amount 6 with `1 3 4` needs 2 coins (`3 3`); amount 0 needs 0; coins `2`, amount 3 gives −1.

### Task 4: 0/1 knapsack

- [ ] **Input:** items `w:v` and a capacity: `2:3, 3:4, 4:5, 5:6 cap 5`. Up to 4 items, weights 1–8, values 1–20, capacity 1–8.
- [ ] **Steps:** table `(items + 1) × (cap + 1)`, row 0 zeros. Each cell is one step: `check` when the item does not fit or skipping wins (copy from above), `add` when taking wins (`v + dp[i-1][w-wi]`); the read cells are `compare`. Then the traceback marks taken items (`found`), listed in the strip.
- [ ] **Tests:** best value 7, items 1 and 2 (`2:3`, `3:4`); an item heavier than cap is never taken and its row equals the row above.

### Task 5: LCS

- [ ] **Input:** two words, A–Z, each up to 6 letters: `AGCAT GAC`.
- [ ] **Steps:** table `(|a| + 1) × (|b| + 1)`, row and column 0 zeros. Each cell is one step: `add` with a diagonal +1 when letters match, `check` taking the max of up and left otherwise. Traceback from the corner (on a tie, move up) marks the path `found` and spells the subsequence in the strip.
- [ ] **Tests:** length 2 for `AGCAT GAC`, and the spelled result is a subsequence of both; an empty word gives 0 with no table cells to fill.

### Task 6: Edit distance

- [ ] **Input:** two words, a–z, each up to 6 letters: `horse ros`.
- [ ] **Steps:** table with row 0 = 0..|b| and column 0 = 0..|a|. Each cell is one step: match copies the diagonal (`check`), otherwise 1 + min of replace (diagonal), delete (up), insert (left) (`add`), naming the winning edit. Traceback lists the edits in the strip (`found`).
- [ ] **Tests:** `horse → ros` is 3; `abc → abc` is 0; an empty word gives the other's length.

### Task 7: Bit manipulation

- [ ] **Input:** up to 6 ops on values 0–255: `13 & 6, 13 | 6, 13 ^ 6, 13 << 1, 13 >> 2, count 13, pow2 16`.
- [ ] **Steps:** the scene is rows of 8 bit plates (bit 7 on the left), labelled with the value. A binary op is one step showing both inputs and the result row, with the bits that decide it `active`. `count` clears the lowest set bit with `n & (n - 1)` one step per bit. `pow2` answers from `n & (n - 1) == 0`. Shifts drop bits past 8 and say so.
- [ ] **Tests:** `13 & 6 = 4`, `13 | 6 = 15`, `13 ^ 6 = 11`, `13 << 1 = 26`, `13 >> 2 = 3`, `count 13 = 3` in 3 clearing steps, `pow2 16` true and `pow2 12` false, `200 << 1 = 144`.

### Task 8: Greedy intervals

- [ ] **Input:** up to 7 intervals `start-end`, 0–12, start < end: `1-3, 2-5, 4-7, 1-8, 5-9, 8-10`.
- [ ] **Steps:** activity selection. Sort by end (one `move` step showing the sorted rows), then per interval: `add` when its start ≥ the last taken end, `check` (rejected, shown dimmed/stale) when it overlaps. The scene draws each interval as a slab along a number line, one row per interval in sorted order, with a `last end` pointer.
- [ ] **Tests:** picks `1-3, 4-7, 8-10` (3); `1-3, 3-5` takes both.

### Task 9: Segment tree

- [ ] **Input:** an array of up to 8 values 0–99 and up to 3 ops: `array 2 1 5 3 4, query 1 3, update 2 0, query 1 3`. Indexes 0-based, `query l r` inclusive, l ≤ r, both in range.
- [ ] **Steps:** build bottom-up (one `add` per internal node), then each query walks the tree: `check` for a node fully inside or outside, `move` into a partial overlap, `found` for the sum. `update` walks root to leaf and fixes the sums back up (`add`). Reuse `treekit` layout and `TreeScene` (tree plus the array strip).
- [ ] **Tests:** first query 9, after `update 2 0` the query is 4; a one-element array answers its own value.

### Task 10: Theory for the 6 DP lessons

- [ ] One `theory.ts` per DP lesson, with shots pointing at the default run.

### Task 11: Theory for the 3 Advanced lessons

- [ ] One `theory.ts` per Advanced lesson, with shots pointing at the default run.

### Task 12: Guides for `dp` and `advanced`

- [ ] `src/theory/guides/dp.ts` and `src/theory/guides/advanced.ts`, registered in `GUIDES`.
- [ ] Tests that used `dp` as the unfinished section (`src/app/GuidePage.test.tsx` lines ~44 and ~56, `src/theory/theory.test.ts` line ~19) switch to a synthetic section id that is not in the curriculum, since every section is now live.
- [ ] CLAUDE.md: 10 sections, 49 lessons, the DP kit, milestone line says M5 done.

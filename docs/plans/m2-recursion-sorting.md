# M2: Recursion, Searching and Sorting — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the 11 lessons of curriculum sections 04 (Recursion) and 05 (Searching and sorting) playable on the existing lesson contract.

**Architecture:** Each lesson is a folder `src/lessons/<id>/` like `src/lessons/two-pointers/`. It has a pure `generate.ts`, a `Scene.tsx` built from `src/iso/` pieces, `index.ts` (`defineLesson`), `generate.test.ts`, and `code/Main.java|main.py|main.cpp` with `@a` anchors. Two shared pieces are added:
- `src/iso/FrameStack.tsx` draws recursion call frames.
- `src/lessons/sortkit.ts` / `SortScene.tsx` hold the array-sort state, scene and memory view that six sort lessons share.

Each task registers its lesson in `src/lessons/index.ts`, so `lessons.test.ts` checks it at once.

**Tech Stack:** React 18, TypeScript strict, Vite `?raw` imports, Vitest. Isometric SVG via `src/iso/`.

**Spec:**
- `C:\Users\vinay kumar\.claude\plans\we-can-follow-a-pure-sphinx-of-a7378d36-37fe-4085-9053-14f3f1f52add.md`, the cycle-1 plan. Its line 72–73 lists the section contents, and line 86 says "M2: sections 4–5".
- `CLAUDE.md`, sections "How a lesson works" and "Design rules".

## Global Constraints

- Lesson ids must equal the curriculum slugs in `src/curriculum.ts`:
  - `call-stack`, `backtracking`, `n-queens`
  - `linear-search`, `binary-search`
  - `bubble-sort`, `selection-sort`, `insertion-sort`, `merge-sort`, `quick-sort`, `counting-sort`
- `section` is `recursion` for the first three and `sorting` for the rest.
- `generate()` is pure. Step 0 has kind `problem`, the last step has kind `recap`, and the default run and every preset produce at least 6 steps (`lessons.test.ts`).
- Every anchor a step names exists in all three code files, and all three files define the same anchor set. A note key must be one of that step's anchors.
- `op` is the call or action shown in the rail and in `Next: <op>`. Keep it to 14 characters or fewer, or set `short`. Problem and recap steps have `op: null`.
- Every `learn` checklist item is reached by the default input or by a preset.
- Inputs are parsed with `parseNums` from `src/lessons/parseOps.ts`, values 0–99 unless a task says otherwise.
- Default runs should stay at or under about 40 steps.
- The text is plain language, with no unicode glyph icons (use `Icon`). No raw colours: scene states use `BlockState` ("default" | "active" | "found" | "compare" | "swap" | "visited" | "stale"), and legends use the `s-<state>` classes.
- Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Test command: `powershell -NoProfile -Command "cd D:\TracePoint\tracepoint-react; npm run typecheck; npx vitest run"`. Bash `npx` breaks on the space in the path.

## Review Focus

1. **A custom input at the max length** (8 values, or n=5 for queens) must give a finite run with a sane step count, under about 80, and a scene that fits through the camera. Each task's test pins its max input's step count.
2. **Duplicates in sort and search input** (`3 1 3 2`) must sort correctly and keep the scene states right. Each sort task tests a duplicate input.
3. **Already-sorted and single-element-like input** (`1 2`) must not crash or produce fewer than 6 steps. A preset or test covers it per sort.
4. **A search target that is absent**, including below the minimum or above the maximum, must return `-1` with a clear "empty" step. Tests in Tasks 4–5.
5. **Recursion base input** (`0` for factorial, `3` for queens) must still be a full lesson. Tests in Tasks 1 and 3.

---

### Task 1: Call stack (factorial) and the FrameStack scene piece

**Files:**
- Create:
  - `src/iso/FrameStack.tsx`
  - `src/lessons/call-stack/{generate.ts,Scene.tsx,index.ts,generate.test.ts,code/Main.java,code/main.py,code/main.cpp}`
- Modify: `src/lessons/index.ts` (register after `freqMap`)

**Interfaces:**
- Produces: `FrameStack` (default export) with props `{ frames: { label: string; state?: BlockState }[] }`. It draws frames as slabs stacked bottom-up, the newest on top, each labelled in mono. Also produces `frameStackBox(n: number): [number, number, number][]`, the points for `fitBox`. Task 2 reuses both.
- Produces: `CallStackState = { n: number; frames: { k: number; ret: number | null }[]; active: number }`.

- [ ] **Step 1:** Write `generate.test.ts`:
  - `rets(run(lesson, "4"))` equals `["1", "1", "2", "6", "24"]`.
  - `run(lesson, "0")` has a step with kind `found` whose `ret` is `"1"`, and its length is ≥ 6.
  - The maximum depth (`max frames.length`) for `"4"` is 5.
  - `run(lesson, "7")` has 18 steps or fewer.
- [ ] **Step 2:** Run the tests. Expected: FAIL (module not found).
- [ ] **Step 3:** Implement:
  - The parse is `parseNums(text, { min: 0, max: 7, minLen: 1, maxLen: 1 })`.
  - `defaultText` is `"4"`, and the presets are `"0"`, `"1"` and `"6"`.
  - Steps run in this order:
    - `problem`
    - one `add` step per call `fact(k)`, k = n down to 1
    - the base case `fact(0)`, kind `found` with `ret "1"`
    - one `remove` step per return, op `return <value>` with `ret` set to the value, k = 1 up to n
    - `recap`
  - Anchors are `cs.sig`, `cs.base`, `cs.rec` and `cs.ret`.
  - The scene is `FrameStack`, with the active frame `active` and returned frames `stale`.
  - The memory view shows one cell per frame, tagged `fact(k)`.
  - Learn items:
    - "each call pushes a new frame"
    - "the base case stops the recursion"
    - "returns pop frames in reverse order"
- [ ] **Step 4:** Register the lesson, then run the test command. Expected: PASS, and `lessons.test.ts` includes `call-stack`.
- [ ] **Step 5:** Commit with the message "M2: call stack lesson and FrameStack".

### Task 2: Backtracking (subsets)

**Files:**
- Create: `src/lessons/backtracking/{…same set…}`
- Modify: `src/lessons/index.ts`

**Interfaces:**
- Consumes: `FrameStack` and `frameStackBox` from Task 1, and `CellRow` from `src/iso/CellRow`.
- Produces: `SubsetsState = { items: number[]; path: number[]; depth: number; found: number[][]; choice: "take" | "skip" | null }`.

- [ ] **Step 1:** Write the tests:
  - The `found` rets of `run(lesson, "1 2 3")` equal `["[1, 2, 3]", "[1, 2]", "[1, 3]", "[1]", "[2, 3]", "[2]", "[3]", "[]"]`, which is take-first DFS order.
  - The count of `found` steps for `"1 2"` is 4.
  - `run(lesson, "1 2 3")` has 40 steps or fewer.
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3:** Implement:
  - The parse is `parseNums(text, { minLen: 1, maxLen: 3 })`, and duplicate values are rejected with the error "Use different numbers so every subset is distinct."
  - `defaultText` is `"1 2 3"`, and the presets are `"4 7"` and `"5"`.
  - Steps:
    - A `take` step: kind `add`, op `take <v>`.
    - At a leaf, record the subset: kind `found`, op `record`, with `ret` set to the subset.
    - Undoing a take is kind `remove`, op `undo <v>`. A `skip` step is kind `move`, op `skip <v>`.
  - Anchors are `bt.sig`, `bt.leaf`, `bt.take`, `bt.undo` and `bt.skip`.
  - The scene shows:
    - the items as a `CellRow` named "items", with the current index `active`;
    - the path as a `CellRow` named "path";
    - the frames as a `FrameStack` beside them, one frame per depth.
  - Learn items:
    - "take: add the item and go deeper"
    - "undo: remove it on the way back"
    - "skip: go deeper without it"
    - "a full path records one subset"
- [ ] **Step 4:** Register the lesson and run the test command. Expected: PASS.
- [ ] **Step 5:** Commit with the message "M2: backtracking subsets lesson".

### Task 3: N-Queens

**Files:**
- Create: `src/lessons/n-queens/{…}`
- Modify: `src/lessons/index.ts`

**Interfaces:**
- Consumes: `CellRow` with `y` offsets to draw the board as n rows.
- Produces: `QueensState = { n: number; cols: number[]; row: number; col: number | null; attacker: [number, number] | null; solved: boolean }`. `cols[r]` is the column of the queen in row r.

- [ ] **Step 1:** Write the tests:
  - `rets(run(lesson, "4"))` equals `["[1, 3, 0, 2]"]`.
  - `rets(run(lesson, "5"))` equals `["[0, 2, 4, 1, 3]"]`.
  - `rets(run(lesson, "3"))` equals `["[]"]`, and that step's kind is `empty`.
  - Both `run(lesson, "5")` and `run(lesson, "4")` have 60 steps or fewer.
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3:** Implement:
  - The parse is `parseNums(text, { min: 1, max: 5, minLen: 1, maxLen: 1 })`.
  - `defaultText` is `"4"`, and the presets are `"5"` and `"3"`.
  - Placement goes row by row, columns left to right, and stops at the first solution.
  - Steps:
    - A safe placement is kind `add`, op `place r,c`.
    - A blocked square is kind `check`, op `try r,c`, with `attacker` set to the queen that attacks it.
    - Backtracking is kind `remove`, op `lift r,c`.
    - The solution is kind `found`, op `solved`, with `ret` set to `cols`. No solution is kind `empty`, op `no solution`, `ret "[]"`.
  - Anchors are `nq.sig`, `nq.done`, `nq.loop`, `nq.safe`, `nq.place`, `nq.lift` and `nq.none`.
  - Scene states:
    - Queens are `found` when solved and `active` otherwise.
    - The tried square is `compare`, and the attacker is `swap`.
  - Learn items:
    - "a safe square gets a queen and we move to the next row"
    - "an attacked square is skipped"
    - "a dead end lifts the last queen"
    - "some boards have no solution"
- [ ] **Step 4:** Register the lesson and run the test command. Expected: PASS.
- [ ] **Step 5:** Commit with the message "M2: N-Queens lesson".

### Task 4: Linear search

**Files:**
- Create: `src/lessons/linear-search/{…}`
- Modify: `src/lessons/index.ts`

**Interfaces:**
- Produces: `LinearState = { nums: number[]; i: number; target: number; hit: boolean }`.

- [ ] **Step 1:** Write the tests:
  - `rets(run(lesson, "7 3 9 4 1 8 target 4"))` equals `["3"]`.
  - `rets(run(lesson, "7 3 9 target 5"))` equals `["-1"]`, and that step's kind is `empty`.
  - With duplicates, `"2 5 5 1 target 5"` returns `["1"]`, the first match.
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3:** Implement:
  - The parse is `parseNums(text, { minLen: 1, maxLen: 8, key: "target", keyMin: 0, keyMax: 99, keyRequired: true })`.
  - The presets are "Not there" `"7 3 9 4 1 target 5"` and "First match wins" `"2 5 5 1 target 5"`.
  - Steps: one `check` per index (op `a[i] == t?`), then `found` or `empty`.
  - Anchors are `ls.sig`, `ls.loop`, `ls.cmp`, `ls.hit` and `ls.none`.
  - Scene states: checked cells `stale`, the current cell `compare`, a hit `found`.
- [ ] **Step 4:** Register the lesson and run the test command. Expected: PASS.
- [ ] **Step 5:** Commit with the message "M2: linear search lesson".

### Task 5: Binary search

**Files:**
- Create: `src/lessons/binary-search/{…}`
- Modify: `src/lessons/index.ts`

**Interfaces:**
- Produces: `BinaryState = { nums: number[]; lo: number; hi: number; mid: number | null; target: number; hit: boolean }`.

- [ ] **Step 1:** Write the tests:
  - `rets(run(lesson, "1 3 4 6 8 11 14 17 target 11"))` equals `["5"]`.
  - Each of `"… target 5"`, `"… target 0"` and `"… target 99"` returns `["-1"]`.
  - The number of `check` steps for any target over 8 values is at most 4.
  - Unsorted input is sorted first, as in `two-pointers`.
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3:** Implement:
  - The parse is the same as Task 4, with `minLen: 1, maxLen: 8`.
  - Use `mid = lo + floor((hi - lo) / 2)`.
  - Steps: one `check` per probe, with op `mid = <i>` and a note comparing `a[mid]` with the target. Then `found` or `empty`.
  - Anchors are `bs.sig`, `bs.loop`, `bs.mid`, `bs.hit`, `bs.right`, `bs.left` and `bs.none`.
  - Scene: values outside `[lo, hi]` are `stale`, mid is `compare`, a hit is `found`. Use `window [lo, hi]` and pointers `lo`, `mid` and `hi`.
  - Learn items:
    - "a[mid] too small: drop the left half"
    - "a[mid] too big: drop the right half"
    - "a match returns mid"
    - "an empty range means not found"
- [ ] **Step 4:** Register the lesson and run the test command. Expected: PASS.
- [ ] **Step 5:** Commit with the message "M2: binary search lesson".

### Task 6: Sort kit and Bubble sort

**Files:**
- Create:
  - `src/lessons/sortkit.ts`
  - `src/lessons/SortScene.tsx`
  - `src/lessons/bubble-sort/{…}`
- Modify: `src/lessons/index.ts`

**Interfaces:**
- Produces, in `sortkit.ts`:
  - `SortState = { a: number[]; marks: Partial<Record<number, BlockState>>; done: number[]; ptrs: RowPointer[]; compares: number; swaps: number; aux?: (number | null)[]; auxName?: string; auxIndexFrom?: number; auxPtrs?: RowPointer[] }`
  - `fmt(a: number[]): string`, which returns `"[1, 2, 3]"`
  - `parseSort(text: string, max = 99): ParseResult<NumsInput>`, which is `parseNums` with `minLen: 2, maxLen: 8`
  - `sortMemory(title: string, s: SortState): MemoryView`
  - `sortMetrics(s: SortState): Metric[]`, which shows Compares, Swaps (or Writes) and Sorted (`done.length`)
- Produces, in `SortScene.tsx`: the default export `SortScene({ step }: { step: Step<SortState> })`.
  - It draws `a` as a `CellRow` named "a".
  - Cells in `done` are `found`, `marks` override, and everything else is `default`.
  - When `aux` is set, it draws a second row named `auxName` below, with index tags starting at `auxIndexFrom`.
  - The viewBox uses `fitBox` over both rows.
  - Tasks 7–11 reuse all of these.

- [ ] **Step 1:** Write the tests:
  - `at(rets(run(lesson, "5 1 4 2 8")), -1)` equals `"[1, 2, 4, 5, 8]"`.
  - `"1 2 3 4 5"` has exactly 4 `check` steps (early exit after one clean pass).
  - The duplicate input `"3 1 3 2"` returns `"[1, 2, 3, 3]"`.
  - `"8 7 6 5 4 3 2 1"` has 80 steps or fewer.
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3:** Implement the kit, then bubble sort:
  - The default is `"5 1 4 2 8"`, and the presets are "Already sorted" `"1 2 3 4 5"` and "Reversed" `"6 5 4 3 2 1"`.
  - Steps:
    - A compare is kind `check`, op `a[j] > a[j+1]?`, short `cmp j`.
    - A swap is kind `move`, op `swap j,j+1`.
    - The end of a pass is kind `found`, op `pass k done`.
    - Early exit is kind `found`, op `no swaps`.
    - The final step sets `ret = fmt(a)` on the last non-recap step.
  - Anchors are `bb.sig`, `bb.pass`, `bb.cmp`, `bb.swap` and `bb.early`.
  - Learn items:
    - "a bigger left neighbour swaps right"
    - "each pass parks the largest at the end"
    - "a pass with no swaps stops early"
- [ ] **Step 4:** Register the lesson and run the test command. Expected: PASS.
- [ ] **Step 5:** Commit with the message "M2: sort kit and bubble sort lesson".

### Task 7: Selection sort

**Files:**
- Create: `src/lessons/selection-sort/{…}`
- Modify: `src/lessons/index.ts`

**Interfaces:**
- Consumes: everything from Task 6.

- [ ] **Step 1:** Write the tests:
  - `"5 1 4 2 8"` gives `"[1, 2, 4, 5, 8]"`.
  - The swap count (`at(steps, -1).state.swaps`) for `"6 5 4 3 2 1"` is at most 5.
  - The duplicates input `"3 1 3 2"` sorts correctly.
  - The `check` step count for `"5 1 4 2 8"` is exactly 10.
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3:** Implement:
  - Steps:
    - A compare is kind `check`, op `a[j] < min?`.
    - Each new minimum is kind `move`, op `min = a[j]`.
    - The swap into place is kind `add`, op `swap i,m`. Skip it, with a note, when `m === i`.
  - Anchors are `sl.sig`, `sl.outer`, `sl.cmp`, `sl.min` and `sl.swap`.
  - Pointers are `i`, `j` and `min`.
  - Learn items:
    - "scan the rest for the smallest"
    - "swap it into the front"
    - "at most n - 1 swaps"
- [ ] **Step 4:** Register the lesson and run the test command. Expected: PASS.
- [ ] **Step 5:** Commit with the message "M2: selection sort lesson".

### Task 8: Insertion sort

**Files:**
- Create: `src/lessons/insertion-sort/{…}`
- Modify: `src/lessons/index.ts`

**Interfaces:**
- Consumes: Task 6.

- [ ] **Step 1:** Write the tests:
  - `"5 1 4 2 8"` gives `"[1, 2, 4, 5, 8]"`.
  - `"1 2 3 4 5"` has exactly 4 `check` steps (best case, O(n)).
  - The duplicates input `"3 1 3 2"` sorts correctly.
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3:** Implement:
  - Steps:
    - Picking up `key = a[i]` is kind `remove`, op `key = a[i]`.
    - A compare is kind `check`, op `a[j] > key?`.
    - A shift right is kind `move`, op `shift a[j]`.
    - Dropping the key is kind `add`, op `a[j+1]=key`.
  - The cell of the key being moved shows `null` while it is lifted (stale) and is drawn in `aux` as one slot named "key".
  - Anchors are `in.sig`, `in.outer`, `in.key`, `in.cmp`, `in.shift` and `in.drop`.
  - Learn items:
    - "bigger values shift right"
    - "the key drops into the gap"
    - "sorted input needs one compare per item"
- [ ] **Step 4:** Register the lesson and run the test command. Expected: PASS.
- [ ] **Step 5:** Commit with the message "M2: insertion sort lesson".

### Task 9: Merge sort

**Files:**
- Create: `src/lessons/merge-sort/{…}`
- Modify: `src/lessons/index.ts`

**Interfaces:**
- Consumes: Task 6. `aux` is the merge buffer, named "tmp".

- [ ] **Step 1:** Write the tests:
  - `"5 1 4 2 8 3"` gives `"[1, 2, 3, 4, 5, 8]"`.
  - The duplicates input `"3 1 3 2"` sorts correctly.
  - `"8 7 6 5 4 3 2 1"` has 80 steps or fewer.
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3:** Implement top-down merge sort:
  - Steps:
    - A split is kind `move`, op `split l..r`. Show the range as `marks` `visited`.
    - A merge compare is kind `check`, op `L[i] <= R[j]?`.
    - A take into tmp is kind `add`, op `take <v>`.
    - Copying back is kind `found`, op `copy l..r`.
  - Single-element ranges get no step.
  - Anchors are `ms.sig`, `ms.base`, `ms.split`, `ms.cmp`, `ms.take`, `ms.rest` and `ms.copy`.
  - Learn items:
    - "split until one element"
    - "merge takes the smaller head"
    - "<= keeps equal values in order (stable)"
- [ ] **Step 4:** Register the lesson and run the test command. Expected: PASS.
- [ ] **Step 5:** Commit with the message "M2: merge sort lesson".

### Task 10: Quick sort (Lomuto)

**Files:**
- Create: `src/lessons/quick-sort/{…}`
- Modify: `src/lessons/index.ts`

**Interfaces:**
- Consumes: Task 6.

- [ ] **Step 1:** Write the tests:
  - `"5 1 4 2 8 3"` gives `"[1, 2, 3, 4, 5, 8]"`.
  - The duplicates input `"3 1 3 2"` sorts correctly.
  - The compare count for the sorted input `"1 2 3 4 5"` is exactly 10, the worst case n(n-1)/2.
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3:** Implement:
  - The pivot is `a[hi]`.
  - Steps:
    - Choosing the pivot is kind `peek`, op `pivot = <v>`.
    - A compare is kind `check`, op `a[j] < pivot?`.
    - A swap is kind `move`, op `swap i,j`.
    - Placing the pivot is kind `found`, op `pivot at <p>`, and that index is added to `done`.
  - The pivot cell is `swap` state, and the `< pivot` region is `visited`.
  - Anchors are `qs.sig`, `qs.base`, `qs.pivot`, `qs.cmp`, `qs.swap` and `qs.place`.
  - The presets include "Sorted input (worst case)" `"1 2 3 4 5"`.
  - Learn items:
    - "smaller values move left of the pivot"
    - "the pivot lands in its final place"
    - "sorted input is the worst case"
- [ ] **Step 4:** Register the lesson and run the test command. Expected: PASS.
- [ ] **Step 5:** Commit with the message "M2: quick sort lesson".

### Task 11: Counting sort

**Files:**
- Create: `src/lessons/counting-sort/{…}`
- Modify: `src/lessons/index.ts`

**Interfaces:**
- Consumes: Task 6. `aux` is the count array, named "count", with `auxIndexFrom` 0.

- [ ] **Step 1:** Write the tests:
  - `"3 1 2 3 0"` gives `"[0, 1, 2, 3, 3]"`.
  - The `aux` after the counting phase for that input is `[1, 1, 1, 2]`.
  - A value over 9 fails to parse.
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3:** Implement:
  - The parse is `parseSort(text, 9)`.
  - `aux` has length `max + 1`.
  - Steps:
    - A count step is kind `add`, op `count[<v>]++`.
    - A write step is kind `move`, op `write <v>`. It writes the output back into `a` in place, from the counts in ascending order.
  - Anchors are `cnt.sig`, `cnt.max`, `cnt.count`, `cnt.write` and `cnt.done`.
  - Learn items:
    - "each value bumps its counter"
    - "counters are read back in order"
    - "no comparisons: O(n + k)"
- [ ] **Step 4:** Register the lesson and run the test command. Expected: PASS.
- [ ] **Step 5:** Commit with the message "M2: counting sort lesson".

### Task 12: Docs

**Files:**
- Modify: `CLAUDE.md` ("Lessons done", "Layout of src/": FrameStack and sortkit), `README.md` (feature list: 26 lessons across five sections)

- [ ] **Step 1:** Update both files.
- [ ] **Step 2:** Run `npm run build`. Expected: build passes.
- [ ] **Step 3:** Commit with the message "docs: M2 lessons".

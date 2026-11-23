# Tracepoint: learner review (content and learning design)

Scope: read-only review of PRODUCT.md, `src/curriculum.ts`, `src/lessons/index.ts`, all 10 section guides (`src/theory/guides/*.ts`), the theory tab of about 40 of the 49 lessons (with every worked example and cost table checked by hand), and the step text in `generate.ts` for stack, binary search, quick sort, Dijkstra, knapsack, LCS and segment tree. I also read the app shell (`TopNav`, `App.tsx` routes, `Walkthrough`, `LessonPage` learn list, `useProgress`) to see which learning mechanics exist today.

Ground truth first: **all 49 planned lessons are live** (`src/lessons/index.ts` registers every curriculum id). PRODUCT.md still says "15 live across sections 1-3", so that line is out of date. Practice and Quiz are disabled tabs (`src/app/TopNav.tsx:15-16`). What a learner gets today: a guide per section, and per lesson a theory tab (definition, analogy, numbered "how it works" linked to trace frames, cost table, use/avoid, worked example, pitfalls), a step-through trace with Java/Python/C++ code and a highlighted line, presets and custom input, a "what you saw" checklist (`lesson.learn`), and furthest-step progress in localStorage.

---

## Headline verdict

- **The content is unusually accurate.** I hand-checked every worked example I read: quick sort (9 compares), merge sort (11 compares, 16 writes), bubble, insertion, selection, heap build, Dijkstra distances, BFS/DFS orders, Kahn's order, Kruskal/Prim total 11, the 4-queens trace (8 placements, 4 lifts), knapsack, LCS, edit distance, coin change, segment tree query and update, open addressing probes, the AVL example and the bit tricks. All of them are correct. There are no wrong algorithms and no wrong complexities. The six problems I found are minor imprecisions, listed in section 3.
- **The prose is plain and disciplined.** A linter (`src/theory/check.ts`) enforces short sentences and bans words like "simply" and "obviously". Terms are defined where they are first used, and pitfalls name the wrong form explicitly (~~struck~~).
- **The weak side is the learning loop, not the content.** Today the site is a very good thing to *watch and read*. Nothing asks the learner to *produce* anything: no prediction, no recall, no problem solving. The product's own success measure ("a learner can predict what the next step will do") is never actually tested. For the interview persona, the curriculum also misses several of the highest-frequency patterns.

---

## Persona 1: the true beginner (knows loops and functions, no DSA)

### 1. First visit: expectations vs reality
**Expects:** "Where do I start? How long will this take? Can I follow it?"

**Gets:** `/` renders the Foundations *guide* (`src/app/App.tsx:26`). That page opens with a core idea, an analogy, 17 glossary terms, a cheat sheet with "O(1) amortized", patterns, tips and three case studies. It is well written, but it is a reference page, not an on-ramp. There is no "start here → Big-O by counting, 5 min" call to action above the fold, no course map with time estimates, and nothing that explains what a "trace" is or how to drive it. The "How to use" help is a popover behind an icon.

**Where I'd get lost or quit:**
- **On the Foundations guide itself.** The cheat-sheet rows for two pointers, sliding window and range-sum queries come before I have met any of them. Terms like "amortized" and "dynamic array" are front-loaded.
- **In the Big-O lesson.** It is the right first lesson. But it only covers O(n) and O(n²) loops (`lessons/big-o-by-counting/theory.ts`). O(log n) is defined in a glossary but never counted, and binary search (section 5) uses it heavily.
- **In two-pointers and sliding window**, which come before I know sorting or binary search. They work because the inputs are pre-sorted and the windows are fixed-size, but they feel like tricks without a reason yet.
- **On long traces.** Merge sort is 38+ steps and knapsack and LCS fill every cell. Pressing → forty times with nothing asked of me is where passive learners drift off. The `learn` checklist rewards *reaching* steps, not understanding them.
- **On theory tabs that are dense for a first read.** The text is accurate, but the theory tab mixes "how it works", costs, use/avoid, pitfalls and an example on one page. A beginner can't tell what must be learned now and what can wait.

### 2. Order and coverage for a beginner
The order is mostly right: Big-O → arrays → linear structures → hashing → recursion → search/sort → trees → tries → graphs → DP → advanced. Prerequisites are explicit in every guide, which is excellent.

Issues:
- **Two pointers, sliding window and prefix sums sit in section 01, before any sorting, binary search or recursion.** For a beginner they belong right after arrays *and* sorting. Alternatively, keep them but give each a one-paragraph "why this exists" problem first. (Interview persona: the placement is fine.)
- **Recursion (04) comes after hashing (03).** That's fine, but `call-stack` would serve beginners better before the linked lists. Recursion is the bigger conceptual hurdle, and linked lists are easier with a mental model of references.
- **Complexity practice is thin.** There is one counting lesson. Missing: an O(log n) loop (halving), O(n log n) from recursion (the level picture is in merge sort's theory, but it is never counted as an exercise), and amortized analysis traced as a lesson. Dynamic array growth is mentioned in five places and never shown.
- **Missing beginner staples:** reversing a linked list, balanced-brackets with a stack (it is named as a use case but never traced), recursion on trees (height, count nodes), and how to read a problem statement.

### 3. Explanation quality (beginner lens)
Plain, consistent and accurate (see the error list below). Two habits are especially good for beginners: every number in an example is checkable, and every pitfall shows the wrong form. Small wishes:
- Some step titles give the answer away ("6 < 14: drop the left half"). That is fine for reading, but it blocks prediction (see section 4).
- Two different heights coexist. The trees guide uses height-in-levels (a single node has height 1), while many textbooks and LeetCode use edges. The guide states its convention (`theory/guides/trees.ts`, "height" term), which is good. A beginner should be warned that other sources differ.

### 4. Does watching produce learning? (beginner)
Partly. The diagram, code line and explanation stay tied together, which is the best possible *worked example*. Research on worked examples supports this for novices. But the worked-example effect fades fast unless the learner has to self-explain or predict. Today nothing interrupts the playback to ask "what happens next?". A beginner can watch every step of Dijkstra and still not know why a stale entry is skipped. Missing, in order of value for this persona:
1. **Predict-the-next-step prompts** at decision steps. The data is already there: `StepKind` (`engine/types.ts:12`) was designed for this ("cycle 2 can build predict the next step from it").
2. **Retrieval quiz at the end of a lesson.** Three to five questions taken from the lesson's own `learn` items, `ops` costs and `pitfalls`.
3. **A "now you drive" task.** For example: "Give an input that makes quick sort hit its worst case", checked by running `generate` and testing the result (compares === n(n-1)/2). The custom-input box already exists.
4. **A visible roadmap and progress dashboard.** `useProgress` stores the furthest step reached. Show it per section, with "next up".
5. **Spaced review.** Resurface 3 old questions on each visit.

### 5. (Interview readiness is mostly the next persona's question.)

---

## Persona 2: developer with 6 weeks to FAANG-style interviews

### 1. First visit: expectations vs reality
**Expects:** "Show me the patterns, a 6-week plan, problems to solve, and let me skip what I know."

**Gets:** a well-organized textbook course with three-language code (a real plus for Java/C++ interviewees) and fast navigation (Ctrl-K search, URL-addressable steps). There is no interview track, no problem list, no "pattern → when to use" index across sections (each guide has a local `patterns` table, but nothing aggregates them), and no practice. **I'd use it as a lookup for a structure I'm fuzzy on, then leave for LeetCode/NeetCode within the first session.** The guide "patterns" tables and "cases" are the closest thing to interview value. They are good, but they are scattered across 10 pages.

### 2. Coverage vs interview patterns (checked against what exists)

| Pattern | Status | Gap |
|---|---|---|
| Hashing / frequency map / two-sum | Exists (3 lessons) | Fine. Missing: prefix-sum + hashmap ("subarray sum equals k"), the most common hashing medium. |
| Two pointers | Exists, opposite ends on a sorted pair only | Missing: same-direction pointers (remove duplicates, partition), 3-sum. |
| Sliding window | Exists, **fixed size k only** (`sliding-window/code` has no shrink loop) | **Missing the variable-size window** (longest substring without repeats, min window). This is the high-frequency version. |
| Prefix sums | Exists, 1D range sum | Missing 2D prefix and the prefix+hashmap combination. |
| Monotonic stack / deque | **Missing.** The deque guide mentions "maximum of a sliding window" but no lesson traces it. | Next greater element, daily temperatures, largest rectangle, sliding-window max. |
| Linked list patterns | Fast/slow cycle exists | **Missing in-place reversal** and merge two sorted lists (both top-10 interview questions). |
| Binary search | Exact-match only | **Missing lower/upper bound, binary search on the answer, rotated array.** Most interview binary search is one of these. |
| Heaps / priority queue | Binary heap exists | Missing top-k / k-way merge / two-heaps median as traced patterns. |
| Trees | Traversals, BST, AVL, heap | **Missing recursion-on-trees problems** (max depth, diameter, LCA, validate BST, path sum) and iterative traversal. AVL is low interview value for its cost. |
| Tries | Trie, autocomplete | Fine for interviews. Word search II would be a stretch. |
| Graphs | BFS, DFS, topo, Dijkstra, union-find, MST | Missing grid BFS/DFS (islands, rotting oranges, multi-source BFS), cycle detection in directed graphs via DFS colours, Bellman-Ford (named in Dijkstra's avoidWhen but absent). |
| Backtracking | Subsets, N-Queens | Missing permutations, combination sum (duplicates handling), word search. |
| DP | Fib, stairs, coin change, 0/1 knapsack, LCS, edit distance | Missing 1D "take or skip" (house robber), LIS (O(n²) and O(n log n)), grid paths, subset-sum/partition, interval/palindrome DP. |
| Intervals | Activity selection only | **Missing merge intervals, insert interval, meeting rooms II** (sort + heap). |
| Strings | Basics and palindrome | No KMP or rolling hash. That is lower priority, but anagram/palindrome-expansion patterns are missing. |
| Bit manipulation | Exists | Fine. Add single-number XOR. |
| Segment tree | Exists | Rarely asked. It is fine as "advanced", but lower priority than any row above. |
| Complexity analysis practice | One lesson | No "state the complexity of this snippet" drills, which interviewers ask on every problem. |

### 3. Explanation quality (interview lens)
Accurate and interview-safe. It covers the right gotchas: `lo + (hi - lo) / 2` overflow, mark-on-enqueue in BFS, stale-entry skip in Dijkstra, the coin-change sentinel overflow, `<=` for a stable merge, and tombstones. What's missing for interviews is the *spoken* layer: how to state the invariant, the brute force → optimized narrative, and edge-case checklists per pattern.

### 4. Does watching produce learning? (interview lens)
For this persona the trace is useful for one thing: repairing a fuzzy mental model (heap sift-down, Dijkstra staleness, DP fill order). It does not train **pattern recognition**, the skill interviews test: reading an unseen prompt and mapping it to a technique. Nothing on the site presents a problem statement without saying which technique it uses.

### 5. From "I understand the trace" to "I solve an unseen medium in 30 minutes and explain it"
These are needed, in order:
1. **Pattern-recognition drills.** Show a short problem statement and ask "which technique?" (multiple choice), then show the signal words. The guides' `patterns: [signal, move]` tables are already the answer key.
2. **A problem set per lesson, mapped to patterns.** Three to five LeetCode-style problems (by name/number and link, not copied text), tagged easy/medium, with a "this lesson's move" hint ladder (hint 1: technique, hint 2: invariant, hint 3: state/transition).
3. **Write-the-code exercises in the trace.** A "fill the blank line" mode: hide one anchored line (e.g. `qs.place`, `lo = mid + 1`) and ask for it. Then replay the trace to show the consequence of a wrong choice, such as `lo = mid` looping forever. This uses the existing anchors and keeps the code real.
4. **Complexity quizzes.** "Time and space of this snippet?", using the `ops` tables as the answer key.
5. **A 6-week study plan.** An ordered path through lessons + problems + quizzes per week, with progress.
6. **An explain-it scaffold.** After each problem: approach in one sentence, invariant, complexity, edge cases. The learner fills it in, and a model answer is shown afterwards.
7. **Timed mixed review.** Interleaved problems from finished sections (interleaving matters more than blocked practice for recognition).

The site can't replace actually writing code against tests. The honest goal is to be the *understanding and recognition* layer that sends the learner to the right problems and checks they can explain them.

---

## 3. Factual errors and imprecisions (file:line)

None of these changes an algorithm or a complexity class. In order of importance:

1. **Quick-sort trace and the code disagree on swaps.** `lessons/quick-sort/generate.ts:47` (`const moves = less && i !== j`) and `:71` (`if (p !== hi)`) skip self-swaps. The real code (`code/main.py`, `Main.java:8`) executes `qs.swap` on *every* `a[j] < pivot` and always executes `qs.place`. On those steps the trace highlights only `qs.cmp` while the swap line actually runs. The reported count, "9 comparisons and 5 swaps" (`lessons/quick-sort/theory.ts:36`), counts value-moving swaps, but the code performs 7 swap statements on that input. This breaks principle 3 ("the diagram never lies about the code"). Fix: show the self-swap as its own step ("i equals j, so the swap changes nothing"), or guard the code with `if (i != j)`.
2. **Stack: "like the standard libraries do"** (`lessons/stack/generate.ts:89`). C++ `std::stack::pop()`/`top()` on an empty stack is undefined behaviour and does not throw. Java and Python do throw/raise. Say "like Java's and Python's libraries; C++'s `std::stack` does not check".
3. **Union-find example skips a step.** `lessons/union-find/theory.ts:34` says "Connected A F finds roots A and E", but the example never performs `union E F` (the default run does; `union-find/index.ts:19`). A reader of the theory tab can't tell where E came from.
4. **α(n) without "amortized".** `lessons/union-find/theory.ts:18` and `theory/guides/graphs.ts:34` give O(α(n)) per operation. It is an amortized bound, and a single `find` can still cost O(log n). The hashing guide labels amortized costs carefully, so this table should too.
5. **Segment-tree case overstates locality.** `theory/guides/advanced.ts:70` says "Both operations touch about one node per level". That is true for an update. A query can visit up to four nodes per level, and the lesson's own pitfall says "at most two nodes per level split" (`lessons/segment-tree/theory.ts`, pitfalls). Say "a few nodes per level".
6. **Implementation stated as standard.** `lessons/heap-sort/theory.ts:25`: "C++ `std::sort` switches to heap sort when quick sort recurses too deep". This is true of the common introsort implementations (libstdc++, libc++) but not required by the standard. The sorting guide words it correctly ("usually introsort").
7. **Iterative DFS tip is imprecise.** `theory/guides/graphs.ts:46`: "Mark a node seen when you first add it to the queue or stack". This is right for BFS. For a stack-based DFS, marking on push gives a valid traversal but not true depth-first order (it differs from the recursive DFS the lesson shows). Scope the tip to BFS, or add "for DFS order, mark on pop".

Housekeeping: `PRODUCT.md` says "15 live across sections 1-3"; all 49 are live.

---

## 4. Prioritized roadmap: top 10 by learning impact per effort

Each item notes which product principle it serves: **calm**, **step is the unit**, **real code**, **learner drives**.

1. **Predict-the-next-step (cycle 2's headline).** At steps of kind `check`/`move`/`found`, pause and ask a 2–4 option question generated from the next step's state: "Which half is dropped?", "Where does the pivot land?", "Does D's distance change?". Hide the next title and the rail tooltip until the learner answers, then reveal with the existing text. Make it opt-in ("Predict mode" toggle, key P) so it stays calm. *Why:* it tests the product's own success metric directly, and it turns watching into retrieval. *Effort:* medium, because `generate` already produces the answer and only per-lesson question templates are needed. *Principles:* step is the unit, learner drives.
2. **End-of-lesson check (3–5 questions).** Generate the questions from existing data: `ops` (cost questions), `pitfalls` (spot the bug, using the ~~wrong form~~ as a distractor), `useWhen`/`avoidWhen` (pick the structure). Store the score next to progress. *Why:* cheap retrieval practice that reuses content already written. *Effort:* low–medium. *Principles:* calm (short, no timer).
3. **Fill-the-line code exercise.** Blank one anchored line in the code card (e.g. `lo = mid + 1`, `seen[x] = i` placed before or after the check, `<=` in merge). The learner picks or types it, then the trace *replays with their choice* and shows the consequence (infinite loop, self-pair, unstable order). *Why:* closes the gap from "I watched it" to "I can write it". It is the single most interview-relevant mechanic, and only Tracepoint can show *why* a wrong line is wrong. *Effort:* medium–high (wrong-variant generators for 10–15 lessons first). *Principles:* real code, the step is the unit.
4. **Fix the 7 accuracy items above, and update PRODUCT.md.** *Why:* trust is the product, and principle 3 is currently broken in quick sort. *Effort:* low.
5. **Fill the interview-pattern gaps (about 8 lessons).** In order: variable-size sliding window, monotonic stack (next greater / daily temperatures), reverse a linked list, binary search on bounds/answer, merge intervals (+ meeting rooms with a heap), grid BFS / islands, permutations / combination sum, house robber / LIS. Each reuses an existing scene kit (array, linked list, sort, graph, DP). *Why:* these are among the most-asked mediums. Today the interview persona leaves for them. *Effort:* medium each, high in total, but each one fits the established lesson template. *Principles:* step is the unit.
6. **Pattern index plus recognition drills.** Aggregate every guide's `patterns: [signal, move]` into one "Patterns" page (the Practice tab's first content). Add a drill: show a one-paragraph problem prompt, the learner picks the technique, then the signal words are shown with a link to the lesson. *Why:* recognition is the skill interviews test, and the answer key already exists. *Effort:* low for the index, medium for about 60 drill prompts. *Principles:* calm, learner drives.
7. **Problem set per lesson, mapped to patterns.** Three to five external problems (name and number, linked, never copied), each with a three-rung hint ladder (technique → invariant → state/transition) and a "trace a sample input here" button that opens the lesson with `?in=` prefilled. *Why:* bridges to real practice while keeping Tracepoint as the place you come back to when stuck. *Effort:* low–medium (content only). *Principles:* learner drives, real code.
8. **A start-here landing and two tracks.** Replace `/` = Foundations guide with a short page: "New to DSA → Beginner path (with time estimates)" and "Interview in N weeks → 6-week plan". Each track is an ordered list of lessons, drills and problems, with a progress bar built on `useProgress`, plus a "Next up" button. *Why:* both personas currently land on a reference page with no direction. *Effort:* low–medium. *Principles:* calm.
9. **Complexity drills.** "State the time and space of this snippet" with 30–40 short snippets, including halving loops, recursion trees, amortized appends and nested loops with dependent bounds. Add a traced "dynamic array growth" lesson (the most-cited concept that is never shown). *Why:* the beginner needs it to make Big-O stick, and the interviewee is asked it on every problem. *Effort:* low–medium. *Principles:* step is the unit (count the steps).
10. **Spaced review.** On each visit, offer 3 due questions from completed lessons (Leitner boxes in localStorage, or a shared store later). Mix sections (interleaving) for the interview track. *Why:* retention over a 6-week plan, and recognition across topics. *Effort:* low once items 2 and 6 exist. *Principles:* calm (three questions, dismissible).

Deliberately *not* ranked: more advanced structures (Fenwick, KMP, Floyd), gamification (streaks, XP) that cuts against "calm", and an in-browser code runner. A runner is valuable but expensive, and items 3 and 7 capture most of its learning value at a fraction of the cost.

---

## One-paragraph summary
Tracepoint's content is accurate, plain and carefully cross-linked, better than most free DSA material I have checked. It is currently a superb *worked-example* library with no *practice* layer. The beginner needs an on-ramp and prediction prompts to stay engaged. The interviewee needs about 8 missing high-frequency patterns, recognition drills, problems mapped to lessons, and a plan. The cheapest high-impact moves reuse data that already exists: `StepKind` and `generate` for predictions, `ops`/`pitfalls`/`patterns` for quizzes and drills, anchors for fill-the-line exercises, and `useProgress` for a roadmap.

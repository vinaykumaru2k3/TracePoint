# Theory Layer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every live folder a readable guide (core idea, prerequisites, key terms, cheat sheet, patterns, tips, case studies) and every live lesson a theory tab (definition, analogy, how it works, costs, when to use, worked example, pitfalls), so a learner meets the idea before the trace.

**Architecture:** Content is typed TypeScript data, not Markdown, so the compiler and a contract test can check every piece: no new dependency, and no parser beyond a small inline markup.
- `src/theory/` holds the types, the inline renderer, the content checker and the five guides.
- Each lesson gets `src/lessons/<id>/theory.ts`, attached through a new `theory` field on `defineLesson`.
- Two views render the content: `GuidePage` at `#/guide/:sectionId`, and `TheoryView` in a new theory tab at `#/:lessonId/learn`.

**Tech Stack:** React 18, TypeScript strict, react-router-dom 6 (`HashRouter`; tests use `MemoryRouter`), Vitest with `renderToStaticMarkup`.

**Spec:** `docs/specs/theory-layer.md`, plus `CLAUDE.md` ("Design rules", "How a lesson works").

## Global Constraints

- The parts, their order and their minimum counts are exactly the two tables in the spec. The checker in Task 2 enforces the counts.
- Writing rules 1–8 from the spec bind all content. Rules 3, 4, 7 and the "no `!`" part of 8 are enforced by `checkText`.
- Banned words (whole word, case-insensitive): simply, obviously, clearly, just, trivial, trivially, easy.
- Sentence ≤ 25 words; paragraph (one `Inline` string) ≤ 80 words.
- Inline markup is only `` `code` ``, `**bold**` and `[[target]]` / `[[target|label]]`, where target is a live lesson id or `guide:<sectionId>` of an existing guide.
- "At a glance" renders `lesson.costs` and nothing else; theory text must not contradict it.
- Guides and theory never touch `useProgress`.
- Design: CLAUDE.md design rules. Tokens only, `Icon` only, JetBrains Mono, prose 14px / line-height 1.65 / `max-width: 70ch`, no text under 11px, contrast 4.5:1, and no horizontal page scroll at 375px (wide tables scroll inside their own wrapper).
- Test command for every task: `powershell -NoProfile -Command "cd D:\TracePoint\tracepoint-react; npm run typecheck; npx vitest run"`. Expected: typecheck prints nothing after `tsc --noEmit`, and every file passes.

## Review Focus

1. **A lesson added later (M3+) without theory, or a new live section without a guide**, must fail the suite, not ship a blank tab. Task 10 makes `theory` required and adds the coverage test.
2. **A link to a "soon" lesson or a misspelled id** (`[[binary-serach]]`, `[[trees]]`) must fail `checkText`, not render a dead link. Task 2 tests it.
3. **A custom run (`?in=`) and the tabs:** going theory → trace must keep the learner's `?in=`, and so must trace → theory. Task 5 tests the tab hrefs.
4. **Unknown and not-yet-written guides:** `#/guide/nope` redirects to `/`, and `#/guide/trees` (a real section with no guide) shows a "coming with this section" notice with a link to the course start. Task 4 tests both.
5. **The theory tab must not react to the trace's keys** (arrow keys, space), and a wide cheat-sheet table at 375px must scroll inside its wrapper, not the page. Task 5 tests that the keyboard is disabled; Tasks 4–5 check the 375px width in the browser.

---

### Task 1: Theory types and inline markup

**Files:**
- Create: `src/theory/types.ts`, `src/theory/inline.tsx`, `src/theory/inline.test.tsx`
- Modify: `src/engine/types.ts` (add `theory?: LessonTheory` to `Lesson`)

**Interfaces:**
- Produces, in `src/theory/types.ts`:
  ```ts
  export type Inline = string; // may contain `code`, **bold**, [[target]] or [[target|label]]
  export interface Guide {
    section: string;                       // curriculum section id
    tagline: Inline;
    core: Inline[];                        // 1–3 paragraphs
    analogy: Inline;
    prereqs: Inline[];
    terms: [term: string, meaning: Inline][];
    cheat: { head: string[]; rows: Inline[][] };
    patterns: [signal: Inline, move: Inline][];
    tips: Inline[];
    cases: { title: string; setting: Inline; idea: Inline; why: Inline }[];
    hooks: Record<string, Inline>;         // lesson id -> one-line hook
  }
  export interface LessonTheory {
    definition: Inline;
    analogy: Inline;
    steps: Inline[];
    ops?: [op: Inline, cost: Inline, note: Inline][];
    useWhen: Inline[];
    avoidWhen: Inline[];
    example: Inline[];
    pitfalls: Inline[];
  }
  ```
- Produces, in `src/theory/inline.tsx`:
  - `type Token = { t: "text" | "code" | "bold"; v: string } | { t: "link"; target: string; label: string }`
  - `parseInline(s: Inline): Token[]`
  - `linkTargets(s: Inline): string[]`
  - `Rich({ text }: { text: Inline })`, which renders tokens: code as `<code>`, bold as `<strong>`, a lesson link as `<Link to="/<id>/learn">` and a guide link as `<Link to="/guide/<id>">`. A label defaults to the lesson's title or "<Section name> guide".

- [ ] **Step 1: Write the failing tests** in `src/theory/inline.test.tsx`:
  - `parseInline("a `x` and **b**")` → `[{t:"text",v:"a "},{t:"code",v:"x"},{t:"text",v:" and "},{t:"bold",v:"b"}]`
  - `parseInline("see [[stack]] or [[guide:hashing|the guide]]")` → link tokens `{target:"stack",label:""}` and `{target:"guide:hashing",label:"the guide"}`
  - An unclosed marker is text: `parseInline("a `b")` → `[{t:"text",v:"a `b"}]`
  - `linkTargets("[[stack]] [[guide:linear]]")` → `["stack","guide:linear"]`
  - `renderToStaticMarkup(<MemoryRouter><Rich text="[[stack]]" /></MemoryRouter>)` contains `href="/stack/learn"` and the text `Stack`
- [ ] **Step 2: Run.** Expected: FAIL, cannot find module `./inline`.
- [ ] **Step 3: Implement** the types, then `parseInline` as a single left-to-right scan. Add `theory?: LessonTheory` to `Lesson` in `src/engine/types.ts`.
- [ ] **Step 4: Run the test command.** Expected: PASS.
- [ ] **Step 5: Commit** "theory: types and inline markup".

### Task 2: Content checker and contract test

**Files:**
- Create: `src/theory/check.ts`, `src/theory/check.test.ts`, `src/theory/index.ts`, `src/theory/theory.test.ts`

**Interfaces:**
- Consumes: `Guide`, `LessonTheory`, `linkTargets` (Task 1); `CURRICULUM` (`src/curriculum.ts`); `LESSONS`, `LESSON_BY_ID` (`src/lessons`).
- Produces:
  - `src/theory/index.ts`: `export const GUIDES: Record<string, Guide>` (empty object in this task) and `export const linkIds = (): Set<string>`, which holds every live lesson id plus `guide:<id>` for each key of `GUIDES`.
  - `src/theory/check.ts`:
    - `checkText(text: Inline, where: string, links: Set<string>): string[]`
    - `checkGuide(g: Guide, liveIds: string[], links: Set<string>): string[]`
    - `checkTheory(t: LessonTheory, where: string, links: Set<string>): string[]`
    - Each returns error strings prefixed with `where`; empty means valid.
  - The checkers enforce the spec tables' counts and limits, and run `checkText` on every `Inline` they hold.
  - `checkGuide` also requires `Object.keys(g.hooks)` to equal `liveIds` as a set, and `cheat.rows[i].length === cheat.head.length`.

- [ ] **Step 1: Write the failing tests** in `check.test.ts`. A valid fixture guide and theory return `[]`. Each of these returns exactly one error, matched with `toMatch`:
  - a 26-word sentence → `/sentence over 25 words/`
  - an 81-word paragraph made of short sentences → `/paragraph over 80 words/`
  - `"This is just a stack."` → `/banned word "just"/`
  - `"Done!"` → `/exclamation mark/`
  - `[[binary-serach]]`, and `[[trees]]` (a soon lesson) → `/unknown link/`
  - a guide with 3 terms → `/terms: need at least 4/`
  - a cheat row with 2 cells under a 3-cell head → `/cheat row 1 has 2 cells/`
  - a guide missing a hook for a live lesson → `/hooks: missing stack/`
  - a theory with 1 pitfall → `/pitfalls: need at least 2/`
  - a definition of 3 sentences → `/definition: over 2 sentences/`

  Sentence split rule: split on `.`, `?` or `:` followed by a space or the end of the text, after removing inline code spans. Count words as whitespace-separated runs.
- [ ] **Step 2: Write `theory.test.ts`.** For each entry of `GUIDES`, expect `checkGuide(g, liveIdsOf(section), linkIds())` toEqual `[]`. For each lesson with `theory`, expect `checkTheory` toEqual `[]`. Also: every `GUIDES` key is a curriculum section id, and `g.section === key`.
- [ ] **Step 3: Run.** Expected: FAIL, cannot find module `./check`.
- [ ] **Step 4: Implement** `check.ts` and `index.ts`.
- [ ] **Step 5: Run the test command.** Expected: PASS.
- [ ] **Step 6: Commit** "theory: content checker and contract test".

### Task 3: Foundations content

**Files:**
- Create: `src/theory/guides/foundations.ts`, and `src/lessons/<id>/theory.ts` for `big-o-by-counting`, `arrays`, `strings`, `two-pointers`, `sliding-window`, `prefix-sums`
- Modify: `src/theory/index.ts` (register the guide), and each of those lessons' `index.ts` (`theory`)

**Interfaces:** Consumes `Guide`, `LessonTheory` (Task 1); `GUIDES` (Task 2).

Content each piece must state correctly. Wording is the implementer's, under the spec's writing rules:
- **Guide prerequisites:** variables, `if`, loops and arrays in any one language. Nothing else.
- **Terms:** algorithm, data structure, input size `n`, time complexity, space complexity, Big-O, index, contiguous, subarray, window, prefix sum.
- **Core idea:** an algorithm is judged by how its step count grows with `n`, not by seconds. Arrays give instant access by index because the items sit side by side in memory.
- **Cheat rows:**
  - read `a[i]`: O(1)
  - search unsorted: O(n)
  - append to a dynamic array: O(1) amortized
  - insert or delete in the middle: O(n)
  - two pointers on a sorted array: O(n) time, O(1) space
  - sliding window: O(n)
  - build prefix sums: O(n); range-sum query: O(1)
- **Patterns:**
  - a sorted array and a pair that must meet a target → two pointers
  - a contiguous run under a condition → sliding window
  - many range-sum questions on fixed data → prefix sums
  - nested loops over one array → ask whether a pointer or window removes one loop
- **Cases:**
  - running balances on a bank statement (prefix sums)
  - "requests in the last 60 seconds" for a rate limiter (sliding window)
  - merging two sorted logs by time (two pointers)
- **Each lesson's theory** agrees with that lesson's `costs`.

- [ ] **Step 1: Write the content.** The Task 2 contract test is the failing test: run it after registering the guide and before the content is complete, and expect FAIL with checker errors.
- [ ] **Step 2: Run the test command.** Expected: PASS, with `theory.test.ts` covering 1 guide and 6 theories.
- [ ] **Step 3: Commit** "theory: foundations guide and lesson theory".

### Task 4: Guide page, explorer README entries, home and search

**Files:**
- Create: `src/app/GuidePage.tsx`, `src/app/GuidePage.test.tsx`
- Modify: `src/app/App.tsx` (routes), `src/app/CourseSidebar.tsx` (README entry), `src/app/SearchDialog.tsx` (guide hits), `src/app.css`

**Interfaces:**
- Consumes: `GUIDES` (Task 2), `Rich` (Task 1), `CURRICULUM`, `folderName`, `sectionOf`, `LESSON_BY_ID`.
- Produces:
  - `GuideView({ guide }: { guide: Guide })`, pure. It renders the parts in spec order. Each part is a `<section>` with an `h2` and an `id` (`core`, `prereqs`, `terms`, `cheat`, `patterns`, `tips`, `cases`, `lessons`).
  - `GuidePage`, the route component for `/guide/:sectionId`.
  - Behaviour:
    - Unknown section → `<Navigate to="/" replace />`.
    - Known section without a guide → a notice that says this section's guide arrives with its lessons, with a link to `/guide/foundations`.
    - Head: crumb `dsa / <folder> / README.md`, h1 `<Section name>`, then the tagline.
    - Right column: "On this page" links to the part ids, and "Lessons here".
    - "Lessons here" shows a live lesson as a link to `/<id>/learn` with its hook, and a soon lesson as plain text with a `soon` tag.

- [ ] **Step 1: Write the failing tests** in `GuidePage.test.tsx`:
  - `GuideView` with `GUIDES.foundations` contains the `h2` texts in spec order: "Core idea", "Analogy", "Before you start", "Key terms", "Cheat sheet", "When you see…", "Tips and traps", "Case studies", "Lessons here".
  - The cheat sheet renders as a `<table>` inside a `.table-wrap` element.
  - `MemoryRouter initialEntries={["/guide/nope"]}` with `App`'s routes renders the default route's content, not a guide.
  - `/guide/trees` renders the notice text "arrives with its lessons".
  - `/` renders the Foundations guide h1.
  - `CourseSidebar` markup has, inside each folder, a first entry `README.md` with `href="#/guide/<id>"` (or `/guide/<id>` under MemoryRouter).
  - `SearchDialog.tsx` exports `SEARCH_ITEMS: { name: string; section: string; to: string }[]` (lessons keep `to: "/<id>/1"`), and it includes `{ name: "Foundations guide", section: "Foundations", to: "/guide/foundations" }`.
- [ ] **Step 2: Run.** Expected: FAIL, cannot find module `./GuidePage`.
- [ ] **Step 3: Implement.**
  - Routes: add `/guide/:sectionId`, and change `/` and `*` to navigate to `/guide/foundations`.
  - The `README.md` entry uses `Icon name="file"`; add the icon to `ui.tsx` if it is missing. It gets the signal bar (`on` class and `aria-current="page"`) when that guide is open.
  - Search lists guides first when the query matches a section name.
  - CSS: `.prose` (14px, line-height 1.65, `max-width: 70ch`); `.table-wrap { overflow-x: auto }`; hairline table rules; cheat rows striped with `--surface-2`.
- [ ] **Step 4: Run the test command.** Expected: PASS.
- [ ] **Step 5: Check in the browser** at `#/guide/foundations`: desktop, then 375px wide, light and dark. Expected: no horizontal page scroll, and the table scrolls in its wrapper.
- [ ] **Step 6: Commit** "theory: guide page, README entries, home and search".

### Task 4b: Folder colours

**Files:** `src/design/tokens.css`, `src/curriculum.ts`, `src/app/CourseSidebar.tsx`, `src/app/GuidePage.tsx` (crumb swatch), `src/app.css`, `src/app/sidebar.test.tsx` (create, or extend an existing sidebar test)

**Interfaces:**
- Produces:
  - Tokens `--sec-01` … `--sec-10` in `tokens.css`, each with a dark value in both dark blocks (the `prefers-color-scheme` block and the `data-theme="dark"` block).
  - The ten hues are distinct from each other, warm-leaning and muted, and sit in the slab family.
  - `Section.color` in `curriculum.ts` becomes `var(--sec-NN)`, using the section's own `n`, so all ten differ.
  - Each folder `<details className="sec">` carries `style={{ "--sec": sec.color }}`.
  - CSS fills the folder icon's path with `var(--sec)` and keeps the stroke at `currentColor`. The `ul` inside an open folder gets a `border-left: 1px solid var(--sec)` indent guide.
  - The `GuidePage` crumb gets a 8×8 `--radius`-rounded swatch in the section's hue, `aria-hidden`.

- [ ] **Step 1: Write the failing tests:**
  - Every `CURRICULUM` section's `color` matches `/^var\(--sec-\d\d\)$/`, and all ten values are unique.
  - `tokens.css`, imported `?raw`, defines `--sec-01` … `--sec-10` at least three times each: light, the dark media block and the `data-theme` dark block.
  - The `CourseSidebar` markup contains `--sec:var(--sec-01)` on the foundations folder.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.** Also update CLAUDE.md's design rules: folder hues are the one identity colour, decorative fills only, never text.
- [ ] **Step 4: Run the test command.** Expected: PASS.
- [ ] **Step 5: Check in the browser.** Look at the explorer in light and dark. Expected: ten distinguishable folder fills. Folder labels keep 4.5:1 contrast, and the icon outline reads on both themes.
- [ ] **Step 6: Commit** "explorer: colour-coded folders".

### Task 5: Lesson theory tab

**Files:**
- Create: `src/app/TheoryView.tsx`, `src/app/TheoryView.test.tsx`
- Modify: `src/app/App.tsx` (route `/:lessonId/learn`), `src/app/LessonPage.tsx` (tabs, view switch, keyboard off), `src/app/CourseSidebar.tsx` (link target), `src/app.css`

**Interfaces:**
- Consumes: `LessonTheory`, `Rich` (Task 1); `AnyLesson`; `useProgress`'s progress record, read-only.
- Produces:
  - `TheoryView({ lesson, search }: { lesson: AnyLesson; search: string })`, which renders the theory parts in spec order:
    - "At a glance" is `lesson.costs` as a two-column table.
    - It ends with a primary button-styled `Link` reading "Watch it run" to `/<id>/1<search>`.
    - When `lesson.theory` is missing (only possible before Task 10), it renders nothing but that link.
  - `LessonTabs({ id, view, search })`: a `<nav aria-label="Lesson view">` holding two underline tabs, `theory` → `/<id>/learn<search>` and `trace` → `/<id>/1<search>`, with `aria-current="page"` on the current one.
  - `LessonPage` takes `view: "theory" | "trace"`:
    - In theory view, the lesson column shows the head (crumb, h1, meta, tabs) and `TheoryView`.
    - The right column keeps the CODE pane with no highlighted lines and hides TRACE and Checkpoints.
    - `useKeyboard` is not active.
  - Explorer: a live lesson links to `/<id>/learn` when the progress record has no entry for it, else `/<id>/1`.

- [ ] **Step 1: Write the failing tests** in `TheoryView.test.tsx`:
  - For `LESSON_BY_ID["stack"]`, the markup has the h2 texts "Definition", "Analogy", "How it works", "At a glance", "Use it when", "Avoid it when", "Worked example", "Pitfalls" in order. "How it works" is an `<ol>`.
  - The "At a glance" table contains every `lesson.costs` value.
  - `LessonTabs` with `search="?in=1%202"`: the theory href ends `/stack/learn?in=1%202` and the trace href ends `/stack/1?in=1%202`.
  - Rendering `/stack/learn` inside `MemoryRouter` with the App routes shows "Watch it run" and no element with class `timeline`.
  - The sidebar link for an unstarted lesson ends `/learn`. With progress `{ stack: <any recorded value> }` it ends `/stack/1`.
  - Keyboard: `src/hooks/useKeyboard.ts` exports a pure `makeKeyHandler(handlers, enabled: boolean): (e: KeyboardEvent) => void`, and the hook uses it. With `enabled` false, calling the handler with `new KeyboardEvent("keydown", { key: "ArrowRight" })` does not call `handlers.next`. With `enabled` true, it does. `LessonPage` passes `enabled = view === "trace"`.
- [ ] **Step 2: Run.** Expected: FAIL, cannot find module `./TheoryView`.
- [ ] **Step 3: Implement.** Add the route `<Route path="/:lessonId/learn" …view="theory">` before `/:lessonId/:step`. The tabs sit under the h1, styled like the top nav's underline editor tabs.
- [ ] **Step 4: Run the test command.** Expected: PASS.
- [ ] **Step 5: Check in the browser** at `#/stack/learn`, desktop and 375px. Click "Watch it run", then the theory tab. Expected: the page round-trips, and `?in=` survives when it is set.
- [ ] **Step 6: Commit** "theory: lesson theory tab".

### Task 6: Linear structures content

**Files:** `src/theory/guides/linear.ts`, plus `theory.ts` and the `index.ts` wiring for `stack`, `queue`, `deque`, `singly-linked-list`, `doubly-linked-list`, `fast-and-slow-pointers`. Register the guide.

Must state:
- **Prerequisites:** [[guide:foundations]] and arrays.
- **Terms:** LIFO, FIFO, push, pop, peek, enqueue, dequeue, node, pointer (reference), head, tail, null, cycle.
- **Cheat rows:**
  - stack push, pop, peek: O(1)
  - queue enqueue, dequeue: O(1) with a linked list or a circular buffer
  - deque at either end: O(1)
  - linked list insert at head: O(1)
  - linked list access the k-th item: O(k), worst O(n)
  - singly list delete given the previous node: O(1)
  - doubly list delete given the node itself: O(1)
  - fast and slow cycle check: O(n) time, O(1) space
- **Patterns:**
  - matching brackets or undo → stack
  - handle in arrival order, or level by level → queue
  - add and remove at both ends (a sliding window's max) → deque
  - a cycle, or the middle of a list → fast and slow pointers
- **Cases:**
  - the browser back button (stack)
  - a printer or job queue (queue)
  - an LRU cache (a doubly linked list plus a hash map; link [[guide:hashing]] only after Task 7 registers it, otherwise say "a hash map" without a link)

- [ ] **Step 1:** Write the content. Run and expect FAIL until it is complete.
- [ ] **Step 2:** Run the test command. Expected: PASS.
- [ ] **Step 3:** Commit "theory: linear structures guide and lesson theory".

### Task 7: Hashing content

**Files:** `src/theory/guides/hashing.ts`, plus `theory.ts` and wiring for `hash-table-chaining`, `open-addressing`, `frequency-map-and-two-sum`.

Must state:
- **Prerequisites:** arrays, and [[guide:linear]] for chaining's lists.
- **Terms:** key, value, hash function, bucket, collision, load factor, chaining, open addressing, linear probing, tombstone, resize (rehash).
- **Cheat rows:**
  - insert, lookup, delete: O(1) average, O(n) worst
  - resize: O(n) once, O(1) amortized per insert
  - count frequencies: O(n)
  - two-sum with a map: O(n) time and O(n) space, against O(n²) for checking every pair
- **Patterns:**
  - "have I seen this before?" → set or map
  - count how often things appear → frequency map
  - find a partner value fast → store what you need, look it up
- **Cases:**
  - checking whether a username is taken
  - caching a slow lookup
  - counting word frequency in a text
- **Tips:** a bad hash function makes everything collide, and deleting under open addressing needs a tombstone.
- **Back-link:** after this task, add the [[guide:hashing]] link to the LRU case in `linear.ts` if Task 6 left it unlinked.

- [ ] Steps as in Task 6. Commit "theory: hashing guide and lesson theory".

### Task 8: Recursion content

**Files:** `src/theory/guides/recursion.ts`, plus `theory.ts` and wiring for `call-stack`, `backtracking`, `n-queens`.

Must state:
- **Prerequisites:** functions, and [[stack]] (the call stack is a stack).
- **Terms:** recursion, base case, recursive case, call stack, frame, return value, stack overflow, backtracking, choice, pruning, search tree.
- **Cheat rows:**
  - factorial: O(n) time, O(n) stack space
  - all subsets: O(n·2ⁿ) time to list them, O(n) depth
  - N-Queens: worst case grows like n!, and pruning cuts most branches
  - recursion space = the deepest chain of calls
- **Patterns:**
  - a problem defined by a smaller copy of itself → recursion
  - list every subset, combination or arrangement → backtracking
  - place things under rules → backtracking with pruning
- **Cases:**
  - summing a folder's size through its subfolders
  - a sudoku solver
  - reading nested data such as JSON
- **Tips:** always reach a base case, and undo exactly what you did before trying the next choice.

- [ ] Steps as in Task 6. Commit "theory: recursion guide and lesson theory".

### Task 9: Searching and sorting content

**Files:** `src/theory/guides/sorting.ts`, plus `theory.ts` and wiring for `linear-search`, `binary-search`, `bubble-sort`, `selection-sort`, `insertion-sort`, `merge-sort`, `quick-sort`, `counting-sort`.

Must state:
- **Prerequisites:** [[arrays]], [[guide:recursion]] (for merge sort and quick sort), and [[big-o-by-counting]].
- **Terms:** sorted, comparison, swap, in place, stable, pivot, partition, divide and conquer, logarithm (log₂ n is "how many halvings reach 1").
- **Cheat rows** (one per algorithm; columns: algorithm, best, average, worst, extra space, stable):

  | Algorithm | Best | Average | Worst | Extra space | Stable |
  |---|---|---|---|---|---|
  | Linear search | O(1) | O(n) | O(n) | O(1) | n/a |
  | Binary search (sorted input only) | O(1) | O(log n) | O(log n) | O(1) | n/a |
  | Bubble sort (with early exit) | O(n) | O(n²) | O(n²) | O(1) | yes |
  | Selection sort | O(n²) | O(n²) | O(n²) | O(1) | no |
  | Insertion sort | O(n) | O(n²) | O(n²) | O(1) | yes |
  | Merge sort | O(n log n) | O(n log n) | O(n log n) | O(n) | yes |
  | Quick sort | O(n log n) | O(n log n) | O(n²) | O(log n) stack on average | no |
  | Counting sort (k = largest value + 1) | O(n + k) | O(n + k) | O(n + k) | O(k) | n/a: this version rewrites values instead of moving records |

- **Also state:** no comparison sort beats O(n log n) in the worst case, and counting sort escapes that by not comparing.
- **Patterns:**
  - sorted data and a lookup → binary search
  - small or nearly sorted input → insertion sort
  - must be stable with a guaranteed n log n → merge sort
  - small whole-number range → counting sort
- **Cases:**
  - `git bisect` finding a bad commit (binary search)
  - sorting a spreadsheet by one column after another (stability)
  - a library's default sort choosing between these
- **Consistency:** each lesson's theory agrees with its `costs`. If a lesson's `costs` disagrees with this table, fix `costs` in the same task and ledger a ruling.

- [ ] Steps as in Task 6. Commit "theory: searching and sorting guide and lesson theory".

### Task 10: Make theory required, coverage and docs

**Files:** `src/engine/types.ts`, `src/theory/theory.test.ts`, `src/app/TheoryView.tsx`, `CLAUDE.md`, `README.md`

- [ ] **Step 1: Write the failing coverage tests** in `theory.test.ts`:
  - Every curriculum section with at least one live lesson has `GUIDES[section.id]`.
  - Every lesson in `LESSONS` has `theory`.

  Temporarily remove one lesson's `theory` from its `index.ts` and run. Expected: FAIL naming that lesson. Restore it.
- [ ] **Step 2:** Make `theory: LessonTheory` required on `Lesson`, and delete `TheoryView`'s missing-theory branch.
- [ ] **Step 3: Docs.**
  - CLAUDE.md: "Add a lesson" gains `theory.ts`, and a new section with a live lesson needs a guide in `src/theory/guides/`. Add a short "Theory layer" paragraph to "How a lesson works" (routes, the spec's writing rules, and `checkText`). The design rules gain the prose and table rules from the spec. The `src/` layout gains `theory/`.
  - README: features gain folder guides and theory tabs. The `src/` table gains `src/theory/`.
- [ ] **Step 4:** Run the test command, then `npm run build`. Expected: both pass.
- [ ] **Step 5:** Commit "theory: required for every lesson; docs".

## Final review instructions (for the whole-branch reviewer)

Beyond code review, **fact-check every technical claim** in the five guides and 26 theories:
- complexities, stability and in-place claims;
- definitions;
- the steps of each procedure;
- the case studies' accuracy.

Also read three theories as a complete beginner, and flag any term used before it is defined.

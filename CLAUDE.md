# Tracepoint

Interactive, step-through lessons for learning data structures and algorithms, styled like a debugger. The name comes from the debugger tracepoint: a spot where you record what happened. Here the learner records every operation, one step at a time.

## Current state (milestone M2: recursion, searching and sorting)

React 18 + Vite 5 + TypeScript (strict), react-router-dom 6 `HashRouter`, Vitest. Font: JetBrains Mono for everything (`--font`, with `--mono` pointing at it). Commands: `npm run dev`, `npm run typecheck`, `npm test`, `npm run build` (typecheck + vite build, output `dist/`, Vercel-ready).

Lessons done (M0–M2): sections 1–5, 26 lessons. Foundations: big-o-by-counting, arrays, strings, two-pointers, sliding-window, prefix-sums. Linear: stack, queue, deque, singly/doubly linked list, fast-and-slow-pointers. Hashing: hash-table-chaining, open-addressing, frequency-map-and-two-sum. Recursion: call-stack, backtracking, n-queens. Searching and sorting: linear-search, binary-search, bubble-sort, selection-sort, insertion-sort, merge-sort, quick-sort, counting-sort. The rest of the curriculum (`src/curriculum.ts`) shows as "soon". `COURSE` there is the `DSA` root of the explorer tree, and `folderName()` makes folder names like `01-foundations/`.

Roadmap: M0 platform → M1 … M5 DP/advanced, one branch and PR each. Cycle 2: predict-the-next-step, quizzes, case studies.

## Layout of `src/`

- `app/` shell: `App`, `TopNav` (course button on narrow screens, search, "How to use" popover, theme), `CourseSidebar`, `CourseDrawer` (the course tree as a modal `<dialog>` on narrow screens), `SearchDialog` (Ctrl+K, native `<dialog>`), `LessonPage` (route `/:lessonId/:step?`, step is 1-based in the URL, `#/stack/5`; a custom run adds `?in=<input>` so it can be shared), `CodeCard` (language tablist, highlighted lines scroll inside the code box only).
- `engine/` `types.ts` (the lesson contract), `anchors.ts`, `usePlayer.ts` (autoplay over a URL-owned index).
- `hooks/` `useKeyboard`, `useTheme`, `useProgress`, `useLang`. All persisted in localStorage (`tracepoint-*`) inside try/catch.
- `iso/` isometric SVG primitives: `project.ts` (2:1 projection), `IsoScene`, `IsoBlock`/`IsoPlate`, `IsoPointer`, `Blocks` + `useGhosts` (enter/leave animation), `fitBox` for a fallback viewBox. `SceneFit` draws every step of the run off-screen once and reports each step's bounds; `IsoScene` runs a camera (`camera.ts`, `follow`) through `CameraContext` that glides to each step: it holds the shot while the drawing fits, pans just enough when it does not, zooms out when the drawing outgrows the stage, and zooms back in only for a real gain (never past `MAX_SCALE`). The grid floor is drawn in scene units inside the SVG, so it moves with the camera. Reusable scene pieces: `CellRow` (`rowFrame`, indexed cells, null draws stale), `LinkedNodes` (`listFrame`, next/prev links, back links curve), `Buckets` (`bucketFrame`), `FrameStack` (call frames, newest on top).
- `lessons/<id>/` `generate.ts` (pure), `Scene.tsx`, `index.ts` (`defineLesson`), `generate.test.ts`, `code/Main.java|main.py|main.cpp`. Registry in `lessons/index.ts`. `parseOps.ts` parses the "type your own values" input. `sortkit.ts` (`SortState`, `SortTrace` snapshot builder whose `finish()` adds the closing sorted step, `sortMetrics`, `sortMemory`) and `SortScene.tsx` (array row plus an optional aux row such as tmp, key or count) are shared by every sort. `testkit.ts` has `run`, `at` (no `Array.at` in the TS lib) and `rets` for generator tests.
- `design/` `tokens.css`, `ui.tsx`. `app.css` is the layout.

## How a lesson works

`generate(input)` returns `Step[]`, problem step first and recap last. A step holds a title, text, key idea, op, `anchors`, `notes`, and a `state` that only the lesson's `Scene` understands. The renderer draws one snapshot, so going back is free.

Code is shown in Java, Python and C++. Each source file tags lines with `// @a name` (or `# @a name`). Steps name anchors, never line numbers, so highlights follow the selected language tab. Tests check that every anchor a step uses exists in all three languages.

### Add a lesson

1. Add it to `curriculum.ts` if it is not there.
2. Create `src/lessons/<id>/` with `generate.ts`, `Scene.tsx`, the three code files, `index.ts`, and a test.
3. Register it in `src/lessons/index.ts`. `lessons.test.ts` then checks parse defaults, anchors, learn checklist and curriculum membership.

## Design rules

Tracepoint looks like a debugger in warm graphite: espresso-tinted neutrals (not beige paper), hairline borders (`--line`), no card shadows. The only shadow is `--float-shadow`, on popovers and dialogs. `--signal` is an ember orange and marks things only, never text: the logo dot, the current-lesson bar and the timeline playhead. `--done` (green) is completion: the progress rings, the done checks and the progress bar. The current state is inverted with `--inv-bg` / `--inv-fg`: the primary button and the selected code tab. `--radius` is 6px.

Type is JetBrains Mono everywhere (`--font`; `--mono` is the same stack and stays as the token for code, values, ops, paths, counts, kbd and scene labels). Body is 13px, nothing under 11px, ligatures off.

The lesson page is flat panes, each with a `.pane-title` bar: EXPLORER (the course tree), TRACE (the explanation) and CODE. The explorer is a tree under `DSA/` with folders like `01-foundations/`; the current lesson has a 2px signal bar on `--surface-2`. Each lesson shows its status as a mark: an empty ring (not started), a ring that fills with the share of steps reached (in progress), or a closed green ring with a stroked check inside (complete), and the lesson name goes muted. A lesson finished in this session closes its ring and draws its check once (not with reduced motion). A folder shows `done/live` completed lessons, with a green check before it once every live lesson in it is complete; empty folders say `soon`. The lesson head is a mono path crumb (`dsa / <section> / <lesson>`), the h1 and one meta line (`N min · level · N steps`). Below the stage is the TIMELINE: one stop per step on a track, with the step number above and the op below each node. Executed steps are filled ink nodes and the track is filled up to the playhead; the current step is an ember disk ringed in the pane colour; steps ahead are hollow (a darker ring once seen). Each stop is a button (`aria-current="step"` on the current one), and the track scrolls sideways so the playhead stays in view. The TRACE pane opens with `#NN op`, shows the key idea as a `watch` block, then Back / `Next: op`. The checklist reads `Checkpoints · n/m hit`. The top nav is a signal dot, a lowercase mono "tracepoint" and underline editor tabs.

Scenes are flat faces with 1px outlines and warm neutral slabs (`--slab-*`) on a dot grid floor. The floor is drawn in scene units, so it is locked to the camera. The footprint is a dashed 1px outline, with no fill. Pointers are flat flags. Colour appears only for state (amber active, green found, blue compare). The one exception is identity: each explorer folder has a hue (`--sec-01` … `--sec-10`) that fills its icon, tints the open folder's indent guide and the guide crumb swatch; these are decorative fills only and never carry text.

Light and dark themes via tokens (`prefers-color-scheme` plus `data-theme`); every colour, including scene state fills (`--st-*`) and syntax (`--syn-*`), is a token with a dark value, and no raw colours live outside `tokens.css` (except the luminance-mask white in `IsoScene`). Text holds 4.5:1 and is never below 11px, including muted text on `--surface-2` and the inverted pairs. Icons come from `Icon` in `design/ui.tsx`, never unicode glyphs. No card inside a card. Layout: top nav, then EXPLORER | lesson (head, stage = controls bar / drawing / legend bar, step timeline that scrolls sideways, input, memory) | TRACE + CODE + Checkpoints (the right column). Below 1120px wide or 680px tall: one column, lesson first (head, stage, explanation, timeline, code, input, memory, checkpoints), the course tree in a drawer, the page scrolls. Respect `prefers-reduced-motion`. Draw order in scenes follows array order (list back to front); no depth sorting.

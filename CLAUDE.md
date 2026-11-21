# Tracepoint

Interactive, step-through lessons for learning data structures and algorithms, styled like a debugger. The name comes from the debugger tracepoint: a spot where you record what happened. Here the learner records every operation, one step at a time.

## Current state (milestone M0: platform)

React 18 + Vite 5 + TypeScript (strict), react-router-dom 6 `HashRouter`, Vitest. Fonts: IBM Plex Sans (UI) and IBM Plex Mono (code and data). Commands: `npm run dev`, `npm run typecheck`, `npm test`, `npm run build` (typecheck + vite build, output `dist/`, Vercel-ready).

Lessons done (M0 + M1): sections 1–3. Foundations: big-o-by-counting, arrays, strings, two-pointers, sliding-window, prefix-sums. Linear: stack, queue, deque, singly/doubly linked list, fast-and-slow-pointers. Hashing: hash-table-chaining, open-addressing, frequency-map-and-two-sum. The rest of the curriculum (`src/curriculum.ts`) shows as "soon". `COURSE` there is the `DSA` root of the explorer tree, and `folderName()` makes folder names like `01-foundations/`.

Roadmap: M0 platform → M1 … M5 DP/advanced, one branch and PR each. Cycle 2: predict-the-next-step, quizzes, case studies.

## Layout of `src/`

- `app/` shell: `App`, `TopNav` (course button on narrow screens, search, "How to use" popover, theme), `CourseSidebar`, `CourseDrawer` (the course tree as a modal `<dialog>` on narrow screens), `SearchDialog` (Ctrl+K, native `<dialog>`), `LessonPage` (route `/:lessonId/:step?`, step is 1-based in the URL, `#/stack/5`; a custom run adds `?in=<input>` so it can be shared), `CodeCard` (language tablist, highlighted lines scroll inside the code box only).
- `engine/` `types.ts` (the lesson contract), `anchors.ts`, `usePlayer.ts` (autoplay over a URL-owned index).
- `hooks/` `useKeyboard`, `useTheme`, `useProgress`, `useLang`. All persisted in localStorage (`tracepoint-*`) inside try/catch.
- `iso/` isometric SVG primitives: `project.ts` (2:1 projection), `IsoScene`, `IsoBlock`/`IsoPlate`, `IsoPointer`, `Blocks` + `useGhosts` (enter/leave animation), `fitBox` for a fallback viewBox. `SceneFit` draws every step of the run off-screen once and reports each step's bounds; `IsoScene` runs a camera (`camera.ts`, `follow`) through `CameraContext` that glides to each step: it holds the shot while the drawing fits, pans just enough when it does not, zooms out when the drawing outgrows the stage, and zooms back in only for a real gain (never past `MAX_SCALE`). The grid floor is drawn in scene units inside the SVG, so it moves with the camera. Reusable scene pieces: `CellRow` (`rowFrame`, indexed cells, null draws stale), `LinkedNodes` (`listFrame`, next/prev links, back links curve), `Buckets` (`bucketFrame`).
- `lessons/<id>/` `generate.ts` (pure), `Scene.tsx`, `index.ts` (`defineLesson`), `generate.test.ts`, `code/Main.java|main.py|main.cpp`. Registry in `lessons/index.ts`. `parseOps.ts` parses the "type your own values" input. `testkit.ts` has `run`, `at` (no `Array.at` in the TS lib) and `rets` for generator tests.
- `design/` `tokens.css`, `ui.tsx`. `app.css` is the layout.

## How a lesson works

`generate(input)` returns `Step[]`, problem step first and recap last. A step holds a title, text, key idea, op, `anchors`, `notes`, and a `state` that only the lesson's `Scene` understands. The renderer draws one snapshot, so going back is free.

Code is shown in Java, Python and C++. Each source file tags lines with `// @a name` (or `# @a name`). Steps name anchors, never line numbers, so highlights follow the selected language tab. Tests check that every anchor a step uses exists in all three languages.

### Add a lesson

1. Add it to `curriculum.ts` if it is not there.
2. Create `src/lessons/<id>/` with `generate.ts`, `Scene.tsx`, the three code files, `index.ts`, and a test.
3. Register it in `src/lessons/index.ts`. `lessons.test.ts` then checks parse defaults, anchors, learn checklist and curriculum membership.

## Design rules

Tracepoint looks like a debugger. Graphite neutrals, hairline borders (`--line`), no card shadows. The only shadow is `--float-shadow`, on popovers and dialogs. `--signal` is breakpoint red and marks things only: the logo dot, the current-lesson bar, the current rail dot, the breakpoint marker. The current state is inverted with `--inv-bg` / `--inv-fg`: the primary button, the current rail entry and the selected code tab. `--radius` is 6px.

Type is split. IBM Plex Sans is the body at 14px (`--font`). IBM Plex Mono (`--mono`) is for code, values, ops, paths, counts, kbd and scene labels.

The lesson page is flat panes, each with a `.pane-title` bar: EXPLORER (the course tree), TRACE (the explanation) and CODE. The explorer is a tree under `DSA/` with folders like `01-foundations/`; the current lesson has a 2px signal bar on `--surface-2`. The lesson head is a mono path crumb (`dsa / <section> / <lesson>`), the h1 and one meta line (`N min · level · N steps`). The rail is a trace log of `NN name` mono entries; the current one is inverted with a signal dot. The TRACE pane opens with `#NN op`, shows the key idea as a `watch` block, then Back / `Next: op`. The checklist reads `Checkpoints · n/m hit`. The top nav is a signal dot, a lowercase mono "tracepoint" and underline editor tabs.

Scenes are flat faces with 1px outlines and cool neutral slabs (`--slab-*`) on a dot grid floor. The floor is drawn in scene units, so it is locked to the camera. The footprint is a dashed 1px outline, with no fill. Pointers are flat flags. Colour appears only for state (amber active, green found, blue compare).

Light and dark themes via tokens (`prefers-color-scheme` plus `data-theme`); every colour, including scene state fills (`--st-*`) and syntax (`--syn-*`), is a token with a dark value, and no raw colours live outside `tokens.css`. Text holds 4.5:1 and is never below 11px, including muted text on `--surface-2` and the inverted pairs. Icons come from `Icon` in `design/ui.tsx`, never unicode glyphs. No card inside a card. Layout: top nav, then EXPLORER | lesson (head, stage = controls bar / drawing / legend bar, trace-log rail that scrolls sideways, input, memory) | TRACE + CODE. Below 1120px wide or 680px tall: one column, lesson first (head, stage, explanation, rail, code, input, memory), the course tree in a drawer, the page scrolls. Respect `prefers-reduced-motion`. Draw order in scenes follows array order (list back to front); no depth sorting.

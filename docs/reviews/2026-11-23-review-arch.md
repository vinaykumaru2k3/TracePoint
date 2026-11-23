# Tracepoint architecture and React review (HEAD e5ec558)

Scope: the whole codebase at HEAD, read-only. I read `src/engine/*`, `src/lessons/index.ts`, `parseOps.ts`, several lesson `index.ts` and `Scene.tsx` files, `src/app/*` (LessonPage, App, CodeCard, SearchDialog, CourseDrawer, CourseSidebar, Walkthrough, TheoryView, GuidePage head), `src/iso/IsoScene.tsx`, `SceneFit.tsx`, `useGhosts.ts`, `src/hooks/*`, `src/theory/useInk.ts` and `inline.tsx`, `index.html`, `vite.config.js`, `package.json`, and the test list.

What I ran:
- `npm run build`: passes. It emits **one 939 kB JS chunk (281.8 kB gzip)** with the >500 kB warning. There is no code splitting.
- `npx vitest run`: 64 files and 816 tests pass, in 45 s.
- I wrote a scratch fuzz script (vite-node) with about 89k mutated inputs per lesson token vocabulary across all 49 lessons. Each one went through parse, generate, and metrics/memory/vars/learn on every step. It found **no throws**. The largest step count was 74 (fibonacci n=15), and all others stayed under 70. Generation takes 0–2 ms.
- Huge `?in=` input: a 400 kB string takes 50–190 ms to parse in 23 lessons. It is rejected, but slowly (see Minor).

## Strengths

- **A clean lesson contract.** `Lesson<I,S>` in `engine/types.ts` separates pure `generate` from `Scene`, `metrics`, `memory` and `vars`. `defineLesson` type-checks each lesson internally before it is erased into the registry. Steps are full snapshots, so going back costs nothing and the URL can own the index.
- **Anchors instead of line numbers.** `anchors.ts` and `lessons.test.ts` check that every anchor exists in all three languages. This is the right design for the "lit line" requirement.
- **Input validation is strict and well bounded.** `parseOps` and `parseNums` cap op counts, value ranges and lengths, and errors say what to do. Fuzzing found no crash, and step counts cannot explode. There is no exponential generator, because fibonacci is memoised and n-queens is capped at 5.
- **Good sharing across lessons.** sortkit, treekit, graphkit and dpkit, with SortScene, TreeScene, GraphScene and DPScene, cover most lessons. The 49 bespoke Scene files add up to only 536 lines in total.
- **No `dangerouslySetInnerHTML` anywhere.** `CodeCard.colour` builds React nodes, and `Rich` parses a small markup into nodes. A malicious `?in=` only ever reaches React text nodes and an input `value`.
- **Persistence is defensive.** Every localStorage access is in try/catch. `useProgress.load` and `parseExplorer` filter malformed values instead of trusting `JSON.parse`.
- **Hooks are mostly correct.** `useKeyboard` uses a ref to avoid stale closures and registers its listener once. `usePlayer` arms one timer per step and clears it on cleanup. `IsoScene` cancels its rAF and disconnects its ResizeObserver. `useInk` disconnects its observer and removes its listener. `LessonPage` keys `LessonView` by lesson id, so per-lesson state resets cleanly.
- **Accessibility work is above average.** The scrubber has a slider role with valuetext, there is a roving tabindex on the code tabs, native `<dialog>` for search and the drawer, a single-column reading order on narrow screens, and reduced-motion is honoured.

## Issues

### Critical

None. I found nothing that loses data, breaks the main flow, or opens an injection path.

### Important

**I1. No error boundary: any render error blanks the whole app.**
- Where: `src/main.tsx:11-17` and `src/app/App.tsx:59-65`. A grep for `ErrorBoundary` or `componentDidCatch` finds nothing.
- What is wrong: if a Scene, a `metrics`/`memory` callback, a theory renderer or a guide throws, React unmounts the whole tree. The learner gets a white page with no nav, no search and no way back except editing the URL. Fuzzing shows generators are robust, but Scenes and SceneFit are not fuzzed, and every future lesson adds new render code.
- Why it matters: this is a long-session learning tool. One bad step should not cost the learner the app.
- Fix: add one class boundary around `<AppRoutes>`, keyed on `location.pathname + search`, so navigating away recovers. Add a second boundary around `<lesson.Scene>` in the stage that shows "This diagram could not be drawn" while the explanation and code still work.

**I2. No code splitting. Everything loads and every default run executes before first paint.**
- Where: `src/lessons/index.ts:1-50` (49 static imports, each pulling in three `?raw` source files and a theory), `src/lessons/index.ts:88-93` (`DEFAULT_STEP_COUNT` runs `parse` and `generate` for all 49 lessons at module load), and `vite.config.js` (no `manualChunks`).
- What is wrong: a learner opening `#/stack/1` on a phone downloads and parses 282 kB gzip of JS, including all 49 lessons' code, theory and scenes. It then runs 49 simulations before React renders.
- Why it matters: PRODUCT.md says the app should be usable on phones. On a mid-range phone this is roughly a second or more of main-thread time before anything shows.
- Fix: split each lesson into light metadata (id, title, section, `defaultStepCount`) and a heavy part loaded by `import()`. Load the heavy part with `React.lazy` or `Suspense` in `LessonPage`, and the Thumb and Walkthrough in guides. The sidebar, search and GuidePage only need the metadata. Precompute `DEFAULT_STEP_COUNT` in a test-checked constant, or compute it lazily. Even a simple `manualChunks` that puts `src/lessons/*` in a separate chunk is a start.

**I3. Every step change re-renders every off-screen copy of the run.**
- Where: `src/app/LessonPage.tsx:233` and `src/iso/SceneFit.tsx:65-70`. Also `LessonPage.tsx:126,167` (`setPeek` on scrubber hover) and `:142` (copy state).
- What is wrong: `SceneFit` stays mounted and renders `steps.map(s => <Scene step={s}/>)`, which is up to 74 full SVG scenes. Neither SceneFit nor any Scene is `memo`'d, and LessonView re-renders on every step, hover tick, play tick and copy. Each re-render reconciles all N off-screen scenes, and each runs its `useGhosts` layout effect (`Blocks` gets a fresh array every time). The measurement in `useLayoutEffect` only depends on `steps`, so the re-renders do nothing useful.
- Why it matters: autoplay and scrubbing do about 50–75 times the necessary render work. This hits low-end devices hardest, where smooth animation matters most.
- Fix: wrap `SceneFit` in `React.memo`. Its props (`steps`, `Scene`, `onFit = setBoxes`) are already stable. Alternatively, unmount the copies after measuring and keep only the boxes, and re-measure on font load by keeping a "measuring" flag. Moving the scrubber, with its own `peek` state, into a child component also stops hover from re-rendering the page.

**I4. `LessonView` is a 330-line component that owns too much.**
- Where: `src/app/LessonPage.tsx:40-367`.
- What is wrong: one function handles URL-to-input parsing, error state, the step-count clamp, the player, keyboard, progress reporting, custom-run progress, draft syncing, scroll effects, copy-link, scrubber pointer math, peek state, and four layouts (theory/trace × narrow/wide). It assembles those layouts from JSX values with manual `key`s.
- Why it matters: the issues in I3 and M2 come straight from this coupling. Every state change re-renders everything, and run-related state (`customMax`, `error`) is reset by hand in `run()` instead of following `text`. Cycle 2 (predict-the-next-step, quizzes) will land here.
- Fix: extract `useLessonRun(lesson)`, which returns text, steps, idx, setIdx, query and the parse error, keyed by `text`. Extract `<Scrubber>` (owns peek and pointer state), `<RunForm>` (owns draft, check and copy state) and `<Stage>`. Then LessonView is only layout.

**I5. Every page has the same document title.**
- Where: `index.html:7`. A grep for `document.title` in src finds nothing.
- What is wrong: every lesson, step and guide shows "Tracepoint" in the tab, browser history and bookmarks.
- Why it matters: PRODUCT.md says learners "come back to a lesson later through a URL that names the step". Bookmarks and history entries all look identical, so a learner cannot tell which one is which. With hash routing this is also the only per-page signal there is.
- Fix: a `useEffect(() => { document.title = \`${lesson.title} · step ${idx+1} – Tracepoint\` }, …)` in LessonView, and the same in GuidePage.

### Minor

- **M1. An out-of-range step URL marks a lesson complete and is not normalised.** `LessonPage.tsx:60-61,84`. `#/bst/999` clamps to the last step, calls `onVisit(last)` and closes the ring. The URL keeps saying 999. This matches the "furthest reached" model (End does the same), but a shared late-step link silently completes the lesson. Fix: `navigate(..., {replace:true})` to the clamped step. Consider counting progress only from steps reached by stepping, not from the landing step.
- **M2. Custom-run state does not follow `text` on Back/Forward.**
  - `LessonPage.tsx:80,85,113`: `customMax` is reset only in `run()`. After browser Back from run B to run A, `reached` (the "seen" ticks and the Checkpoints hits at line 311) uses B's maximum.
  - `LessonPage.tsx:50-51`: the "link's input could not run" error is computed only at mount, so navigating back to a bad `?in=` silently shows the default run.
  - Fix: key this state by `text`, for example a `useLessonRun` keyed component or `useState` reset during render.
- **M3. `lesson.parse(asked)` runs on every render, with no length cap.** `LessonPage.tsx:46`, which is not memoised. Line 54 parses it again. With a pasted 400 kB `?in=`, each render (including every hover tick) costs 50–190 ms. Fix: memoise it, and reject `asked.length > 1000` before parsing, since no valid input is longer than about 200 chars.
- **M4. Progress has no schema version.** `useProgress.ts:3-12`. Progress is stored as "furthest index into the current default run". If a lesson's default run changes length, saved progress changes meaning: lengthening a lesson un-completes it. Fix: store `{v:1, lessons:{id:{max, of}}}` and treat `max >= of-1` as done, or store a `done` flag.
- **M5. Unknown lessons redirect silently.** `LessonPage.tsx:36` sends any unknown id (including `#/guide` with no section) to big-o step 1 with no notice. Fix: a small "No lesson called X" notice with search, or redirect to `/`.
- **M6. The trace tab always opens at step 1.** `TheoryView.tsx` `LessonTabs` links to `/${id}/1`, so after reading the theory a learner loses their place. Fix: link to the furthest step reached, or remember the last step.
- **M7. Code and logic are duplicated.**
  - The "done" rule appears in both `CourseSidebar.tsx:11-12` and `GuidePage.tsx:104`. Put it in one `isLessonDone()`.
  - `reduced()` is defined in 4 files (`LessonPage.tsx:30`, `IsoScene.tsx:28`, `CodeCard.tsx:30`, `useInk.ts`).
  - The default run is generated in three places (`DEFAULT_STEP_COUNT`, `Walkthrough.defaultRun`, `LessonView`) with no shared cache.
  - The localStorage try/catch boilerplate repeats in 5 files and could be one `storage.get/set` helper.
- **M8. Circular import between GuidePage and TheoryView.** `GuidePage.tsx:15` imports from `TheoryView`, and `TheoryView.tsx:8` imports `Part` from `GuidePage`. It works because the imports are used only at render time, but it is fragile. Move `Part`, `MarkList` and `Analogy` to `theory/parts.tsx`.
- **M9. CodeCard reveal does not reset on a new run at the same idx.** `CodeCard.tsx:47-50`: the reveal resets on an `idx` change only. Running a new input while on step 1 (idx 0 → 0) keeps the old `shown` count until the timers fire, so the old lit lines flash briefly. `colour()` also re-tokenises every line on every render and could be memoised per `[parsed, lang]`.
- **M10. `AnyLesson = Lesson<any, any>` leaks `any`.** `engine/types.ts:90`. As a result, `LessonPage.tsx:199,223,279,399` hand-annotate callback parameters, and `step.state` is `any` in the shell. This is acceptable, since lessons are typed inside `defineLesson`. A cleaner option is an existential wrapper: `defineLesson` returns `{ meta, run(text) → { steps: Step<unknown>[], Scene, … } }` with the generics closed over.
- **M11. Small leaks and cleanup gaps.** `useGhosts.ts:11,20`: the `timers` array is never pruned, so it grows for the life of a Scene. `LessonPage.tsx:146`: the copy-state `setTimeout` is not cleared on unmount. Both are harmless in React 18.
- **M12. Docs have drifted from the code.**
  - CLAUDE.md "Design rules" still describes the timeline as "a tape of tiles … each tile is a button (`aria-current="step"`) … `.rail` must stay `position: relative`". The code is now a single `role="slider"` scrubber (`LessonPage.tsx:238-268`).
  - PRODUCT.md says "15 live across sections 1-3".
  - Stale agent docs will mislead the next change.
- **M13. Page shell gaps.**
  - There is no favicon (no `public/`), so the browser makes a 404 request.
  - Google Fonts is a render-blocking third-party stylesheet. It is a privacy (IP leak) and offline cost; self-host JetBrains Mono with `@fontsource` or a woff2 in `public/`.
  - There is no CSP or headers config for Vercel.
- **M14. No interaction tests.** About 64 test files exist, but the component tests use `renderToStaticMarkup` in node (`GuidePage.test.tsx:2`). No test runs effects or clicks, presses keys, plays the player, drags the scrubber, or checks the `?in=` round trip and progress writes. There is no e2e. Several "css" tests regex `app.css` text, which is brittle. Add jsdom with @testing-library for LessonPage (step via keys, Run with a bad input, Back/Forward, progress saved). Add one Playwright smoke test per section with a phone viewport.

## Recommendations (in order)

1. Add error boundaries (I1) and per-page `document.title` (I5). Both take about an hour.
2. `React.memo(SceneFit)` and pull out `<Scrubber>` (I3). This is a small change with a large render saving.
3. Refactor LessonView into `useLessonRun` and child components (I4). This fixes M2, M3 and M9 as a side effect, and prepares for cycle-2 features.
4. Split lessons into metadata and lazy content (I2), and self-host the font (M13). Then measure on a throttled phone profile.
5. Version the progress shape before real users accumulate data (M4).
6. Add jsdom interaction tests for the lesson page and one Playwright smoke test (M14).
7. Dependencies: React 18.3, Router 6.30, Vite 5.4 and Vitest 2.1 are all still fine. React 19 gives nothing this app needs (it has no actions or server components). Router v7 in library mode is a drop-in but brings no gain for a HashRouter SPA. Upgrade Vite to 6 or 7 when Vite 5 leaves security support, and do Vitest 3 alongside it. None of these upgrades is urgent. TypeScript is already 7.

## Declined to judge

- **SEO.** A hash-routed SPA is essentially invisible to crawlers beyond the home page. That only matters if organic discovery is a goal, and PRODUCT.md is silent on it. If it becomes one, the fix is `BrowserRouter` plus prerendering, not meta tags.
- **PWA and offline.** The spec does not ask for them. They would be nice for long study sessions, but they are not a defect.
- **Analytics.** Their absence is fine, as the brief says.
- **Visual and design fidelity, and the correctness of each lesson's teaching content.** These are outside this review's scope.
- **Actual frame timings of I3.** I did not profile in a browser. That finding rests on reading the render tree, not on a measurement.

## Assessment

This is a well-structured, carefully defended codebase. It has a clean lesson contract, strong input validation (fuzzing found no crash and no step explosion), no injection surface, and defensive persistence. It is not production-ready yet for two reasons: one bad render blanks the app (no error boundary), and the single 939 kB bundle, which also runs all 49 simulations at startup, weighs on the phone experience. The main maintainability risk is the oversized `LessonView`, and its unmemoised off-screen SceneFit re-renders on every step. With I1–I5 fixed, it would be in good shape to ship.

# Batch 3: Trace-page hierarchy and first-visit on-ramp. Implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On the trace page, a first-time learner looks at the explanation first. Every power panel is still one click away. A first visit to `/` shows what a trace is before the Foundations README.

**Architecture:** The visual world stays the same: warm graphite, JetBrains Mono, hairlines, and colour only for state. Batch 3 changes **weight, not content**:
- A three-tier type scale, set as tokens, makes the explanation the loudest text on the page.
- Three panels (the run form, the memory strip and the key legend) start folded, and each remembers the learner's choice through one shared stored-flag hook.
- A small intro block on `/` and a one-line tip on the first trace visit act as the on-ramp.

**Tech Stack:** React 18.3, Vite 5.4, TypeScript strict, HashRouter, and Vitest 2.1. Tests are node SSR: `renderToStaticMarkup` with `MemoryRouter` and `vi.stubGlobal("window")`. CSS files are read with `node:fs` behind `// @ts-expect-error`.

**Spec:** this plan is its own spec. It is built from:
- `docs/reviews/2026-11-23-review-ui.md`, the P1 "Trace page density", P2 discoverability, P2 first-run and the P3 polish items. Items Batch 1 already shipped are excluded: phone fold, live region, title, focus and scene description.
- The user's decisions of 2026-11-23:
  - Scope is "Hierarchy + on-ramp".
  - Disclosure is "Re-weight + fold".
  - Home is "Intro block above README".

---

## Design brief (impeccable shape)

1. **Job and audience.** There are two equal personas (PRODUCT.md):
   - A CS student meeting DSA for the first time.
   - A developer revising for interviews.
   The trace page is **Operate** mode: the visitor steps through a run. The guide and `/` are **Read** mode.
2. **Outcome and proof.**
   - On any trace step, the eye lands first on the step title and its sentence. Then it goes to the diagram, then to the lit code line.
   - Today 10 regions carry near-equal weight. On Dijkstra, 438 visible leaf texts are at 11px, and the explanation body is 13px.
   - Success is measured in Task 6:
     - The explanation body is ≥15px and its title is ≥20px.
     - A first visit shows 7 regions, not 10.
     - The critique heuristic "Aesthetic and minimalist design" goes from 2 to 4.
     - "Recognition rather than recall" goes from 2 to 4.
3. **Selected direction.**
   - The incumbent world is kept and remains the visual authority (CLAUDE.md design rules; there is no DESIGN.md).
   - Structural thesis: a **focal column plus quiet chrome**:
     - The explanation card is the focal moment.
     - The stage toolbar, metrics, memory and form recede to the chrome tier: 12px, muted.
     - Nothing is removed. Everything a power user needs stays one click or one key away, and the fold choice is remembered.
4. **Scope and boundaries.**
   - **In scope:** the trace page (desktop and phone), the stage toolbar, the explanation card, the run form, the memory strip, the code card header, the top-nav "soon" tags, the guide definition lists, `/` (intro block) and a skip link.
   - **Untouched:**
     - lesson content, `generate.ts`, theory text and scene geometry
     - the scrubber's look (redesigned four times; the user approved it)
     - colours, the font and the iso scene kit
     - the Batch 1 phone guarantees
   - **Anti-goals:**
     - no modal tour
     - no gamification
     - no new colour
     - no `!important`
     - no hiding of information that a screen reader currently gets
     - no second layout to maintain (there is no Focus/Full toggle)
5. **States and ranges.**
   - Steps run from 3 to 60+ per run; metrics from 1 to 4.
   - Memory strips run from 1 to 64+ cells (DP tables use the table layout).
   - Input labels can be long ("Weighted edges").
   - The state matrix:
     - a first visit with empty storage
     - a returning visitor with stored choices
     - a custom run (`?in=`)
     - a bad link (`linkError`)
     - private mode (storage throws)
     - reduced motion
     - forced colours
     - light and dark themes
     - coarse pointers
6. **Interaction and layout.**
   - Folds use native `<details>`, the same as the memory strip today.
   - A fold is open when the learner opened it before, and also whenever its content is the thing in play: a custom run or a bad link opens the run form.
   - The key legend hides itself after the learner's first keyboard step and never shows on `(hover: none)`.
   - The tip disappears on dismiss or on reaching step 3.
   - The intro shows until the learner has any progress or dismisses it.
   - On the phone, the step order from Batch 1 stays as it is.
7. **Constraints and open decisions.**
   - WCAG 2.2 AA, with 44px targets on coarse pointers (Batch 2).
   - The CSP allows no inline script (`vercel.json`).
   - Everything in storage goes through try/catch.
   - Decided here, so the builder does not invent it:
     - **Token names and sizes:** see Global Constraints.
     - **Storage keys:** see Global Constraints.
     - **The Next label:** see Task 3.
     - **The intro's mini-trace:** see Task 5. It shows 3 steps of the stack lesson. The learner drives it, and it never autoplays.

## Global Constraints

- **Type tokens** in `src/design/tokens.css` `:root`:
  - `--fs-title: 20px`
  - `--fs-content: 15px`
  - `--fs-chrome: 12px`
  - `--fs-micro: 11px`
  - `--lh-content: 1.6`
- **Where the sizes go:**
  - The explanation title uses `--fs-title`; the body and the `watch` note use `--fs-content`.
  - Toolbars, labels, metrics, the memory head and form hints use `--fs-chrome`.
  - Only indices, kbd caps and "soon" tags use `--fs-micro`.
- **Storage keys** (all read and written through `useStoredFlag`):
  - `tracepoint-run-open`
  - `tracepoint-memory`. This key already exists. Its default changes to folded, with `"1"` = open.
  - `tracepoint-keys-seen`
  - `tracepoint-tip-seen`
  - `tracepoint-intro-hidden`
  - `tracepoint-whole` (existing, migrated to the hook).
- **No `!important`.** Use logical properties for any new sizing.
- **Copy rules:** short plain sentences, as checkText enforces for theory; new UI copy follows the same rules. The exact strings are given in the tasks.
- **Batch 1 phone guarantee holds.** At 375×812, on all 49 lessons at steps 1–3:
  - the step sentence starts at or above 674px
  - the sticky step bar sits at 755px
  - nothing overflows sideways
- **Desktop guarantee.** At 1440×900, the code card shows ≥10 code lines on Dijkstra step 5.
- **Git.**
  - The branch is `batch3-hierarchy-onramp` and the work ships as one PR; it is not merged without the user's word.
  - Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **A bad shared link folds the error away.** When `?in=` fails, the run form must render open with the error visible, whatever `tracepoint-run-open` says. Test in Task 2.
2. **Private mode.** When `localStorage` throws, every fold falls back to its default and the toggles still work for the visit. Test in Task 2 (hook).
3. **Phone budget.** The bigger explanation text must not push the phone sentence below 674px. The phone block keeps its own sizes, and this is checked in the browser in Task 6.
4. **Screen readers lose nothing.**
   - Folded `<details>` content is still in the DOM.
   - `#scene-state` and the live region are untouched.
   - The Show all button, now always rendered, is announced as disabled when nothing is cropped.
   Test in Task 3.
5. **Returning learners are not reset.** A stored `tracepoint-memory = "1"` keeps the strip open, and the intro never shows to anyone with progress. Tests in Tasks 2 and 5.

---

### Task 1: Type scale; the explanation becomes the focal point

**Files:**
- Modify: `src/design/tokens.css`
- Modify: `src/app.css`:
  - `.explain`, `.explain h2`, `.explain p`, `.idea`, `.explain .head`, `.stephead`
  - `.metric small` / `.metric b`
  - `.result`
  - `.memhead`, `.run label`, `.run .hint`
  - the code-card variables row
  - `.gbody dl.terms dd`
  - the phone block
- Modify: `src/app/CodeCard.tsx` (the variables readout moves to its own row)
- Test: `src/design/scale.test.ts`

**Interfaces:**
- Produces: the CSS custom properties `--fs-title`, `--fs-content`, `--fs-chrome`, `--fs-micro` and `--lh-content`. Tasks 2–5 use them for any new text.

- [x] **Step 1: Write the failing test.** `scale.test.ts` reads `tokens.css` and `app.css` as text and asserts:
  - `tokens.css` defines `--fs-title: 20px`, `--fs-content: 15px`, `--fs-chrome: 12px`, `--fs-micro: 11px` and `--lh-content: 1.6`.
  - The `.explain h2` rule uses `var(--fs-title)`, and the `.explain p` rule uses `var(--fs-content)`.
  - The `.idea` rule uses `var(--fs-content)`.
  - The `.metric small` rule uses `var(--fs-chrome)`.
  - The `.result` rule has no `border` and no `background` (detector `nested-cards`).
  - The `dl.terms dd` rule has `text-wrap: pretty` and a `max-inline-size` of `62ch`.
- [x] **Step 2:** Run `npx vitest run src/design/scale.test.ts`. Expected: FAIL.
- [x] **Step 3: Implement.**
  - Add the tokens.
  - Explanation card:
    - `h2` uses `--fs-title` with weight 600.
    - The body uses `--fs-content` with `--lh-content` in `--ink`.
    - The `watch` note uses `--fs-content` in `--muted`, keeping its left rule.
    - The `#05 op` head and the kind chip use the chrome tier.
  - Metrics become one quiet line: labels in chrome-tier muted, values in chrome tier plus 2px (14px) in ink, with no tall stacked cards.
  - `.result` becomes an unboxed readout on the stage foot.
  - The code-card variables (`pq = …  dist = …`) move from the tab row to their own row under the tabs. That row is one line at chrome tier and may wrap, and it never squeezes the tabs.
  - Guide `dd`: ink colour, `max-inline-size: 62ch`, `text-wrap: pretty`.
  - **Phone block (≤560px):** pin the explanation body at 14px and its title at 17px with explicit rules, so the Batch 1 budget holds.
- [x] **Step 4:** Run `npx vitest run`. Expected: all pass, including the existing phone and font tests.
- [x] **Step 5: Check in the browser** at 1440×900 on `#/dijkstra/5`. Expected:
  - the computed `.explain p` font-size is 15px and `.explain h2` is 20px
  - the code card shows ≥10 lines
  - no horizontal overflow
- [x] **Step 6: Commit.** `feat(ui): three-tier type scale; the explanation leads the trace page`

### Task 2: Folds that remember (run form, memory strip, key legend)

**Files:**
- Create: `src/hooks/useStoredFlag.ts` and `src/hooks/useStoredFlag.test.ts`
- Modify:
  - `src/app/RunForm.tsx`: wrap it in `<details className="run-fold">`
  - `src/app/LessonParts.tsx`: `MemoryStrip` uses the hook, folded by default
  - `src/app/LessonPage.tsx`: the key legend and `WHOLE_KEY` move to the hook
  - `src/hooks/useKeyboard.ts`: calls `onStep` when the learner steps with a key
  - `src/app.css`
- Test: `src/app/RunForm.test.tsx` (new) and additions to `src/app/explorer.test.tsx` or a new `src/app/folds.test.tsx`

**Interfaces:**
- Produces: `useStoredFlag(key: string, fallback: boolean): [boolean, (v: boolean) => void]`.
  - It reads `"1"`/`"0"` and falls back to the default on a missing value or a throw.
  - The setter writes and swallows errors.
- Produces: the new `RunForm` props `open?: boolean` (forced open) and `custom?: boolean`.
- Consumes: the `.run` form markup as it is today. Its inside does not change.

- [x] **Step 1: Write the failing tests.**
  - **Hook:**
    - It returns the fallback when the key is missing.
    - It returns the fallback when `localStorage.getItem` throws.
    - It returns `true` for `"1"` and `false` for `"0"`.
  - **RunForm:**
    - With no stored value and `custom=false`, the markup has `<details class="run-fold">` without `open`.
    - With `linkError` set, it renders `open` and contains `role="alert"`.
    - With `custom=true`, it renders `open`.
    - The summary text is `Try your own input`, followed by the input label in muted text: `Try your own input · Weighted edges`.
  - **MemoryStrip:**
    - With no stored value, it renders without `open`.
    - With a stored `"1"`, it renders `open`.
    - Folded, it still contains every `.cell` (the content stays in the DOM).
  - **Key legend:** with `tracepoint-keys-seen = "1"`, the `.keys` paragraph is absent.
- [x] **Step 2:** Run the new test files. Expected: FAIL.
- [x] **Step 3: Implement.**
  - The run form is open when any of these is true: `stored || custom || !!linkError`.
  - Toggling the fold stores the choice only when neither `custom` nor `linkError` forced it open.
  - `useKeyboard` gains `onStep?()`. It is called for the prev, next, first and last keys, and `LessonPage` passes a setter that stores `tracepoint-keys-seen`.
  - The `.keys` paragraph also gets `@media (hover: none) { display: none }`.
  - The summary of each fold is ≥44px tall on coarse pointers and uses the chrome tier.
- [x] **Step 4:** Run `npx vitest run`. Expected: all pass.
- [x] **Step 5: Check in the browser.**
  - Cleared storage on `#/stack/3`: the form and memory are folded and the legend shows.
  - Press →: the legend is gone after a reload.
  - Open `#/stack/1?in=bogus%25%25`: the form is open with its error.
- [x] **Step 6: Commit.** `feat(ui): run form, memory strip and key legend fold and remember`

### Task 3: Controls that say what they do

**Files:**
- Modify: `src/app/LessonPage.tsx`, `src/app.css` (lines 25–27 `cue`; 442 `.tab small`; 633 breakpoint), and `src/app/TopNav.tsx` if needed
- Test: `src/app/controls.test.tsx` (new)

**Interfaces:**
- Consumes: `railName(i)` (LessonPage.tsx:132) and `player.speed`.

- [x] **Step 1: Write the failing tests** (SSR of the trace page at `/stack/1` and at `/dijkstra/5`):
  - The speed button's visible text is `Speed 1×`.
  - The Show all button is rendered on every step. When nothing is cropped it has `disabled`, and it keeps `aria-pressed`.
  - The Next button reads `Next: ${railName(idx + 1)}`. On Dijkstra step 5 it no longer reads `Next: dijkstra(A)`. The test asserts that the button text equals `Next: ` plus the scrubber's stop name for step 6, taken from the rendered scrubber markup.
  - The `cue` class is present on step 1 and absent on step 2.
  - `app.css` has no `max-width: 1119px` or `max-height: 679px`.
  - The `.tab small` rule is not set to `display: none` inside the ≤1120px block.
- [x] **Step 2:** Run the tests. Expected: FAIL.
- [x] **Step 3: Implement.**
  - Speed label: `Speed {n}×`, keeping the aria-label.
  - Show all is always rendered: `disabled={!cropped && !whole}`, with the title unchanged. The toolbar no longer reflows.
  - Next uses `railName`, on desktop only; the phone step bar keeps "Next".
  - `cue` is applied only while `idx === 0 && !player.playing`, so the pulse stops once the learner moves.
  - The breakpoint `1119/679` becomes `1120/680` (the walk-fig sticky rule).
  - The "soon" tags stay at ≤1120px; at ≤560px the Practice/Quiz tabs are hidden instead.
- [x] **Step 4:** Run `npx vitest run`. Expected: pass.
- [x] **Step 5: Commit.** `fix(ui): label speed, keep Show all in place, name the next step, calm the Next pulse`

### Task 4: Skip link; the fit pass lets go of its scenes

**Files:**
- Modify: `src/app/App.tsx` (skip link), `src/app/LessonPage.tsx` (`id="step-controls"` on the explanation `.nav` and on the phone `.stepbar`), `src/iso/SceneFit.tsx` and `src/app.css` (`.skip`)
- Test: `src/app/skip.test.tsx` (new) and `src/iso/SceneFit.test.tsx` (new or extended)

**Interfaces:**
- Produces: the `SceneFit` behaviour. Once it has measured after `document.fonts.ready` (or immediately when `fonts` is absent), it renders nothing until `steps` or `Scene` change.

- [x] **Step 1: Write the failing tests.**
  - On a lesson route, the first focusable element in the app markup is `<a class="skip" href="#step-controls">Skip to step controls</a>`. The link is absent on guide routes.
  - The trace page markup contains exactly one `id="step-controls"`.
  - `SceneFit`'s first render (SSR) contains one `svg.iso` per step, so the fit pass still measures. The decision to drop them is pinned through an exported pure helper, `fitScenes<S>(steps: S[], measured: boolean): S[]`. It returns `steps` when `measured` is false and `[]` when it is true. Test both branches.
- [x] **Step 2:** Run the tests. Expected: FAIL.
- [x] **Step 3: Implement.**
  - The skip link is visually hidden until it is focused (the existing `.sr` pattern plus `:focus-visible` styles). With HashRouter, focusing must not change the route, so `onClick` calls `preventDefault`, then `document.getElementById("step-controls")?.querySelector("button")?.focus()`.
  - `SceneFit` keeps a `measured` flag. The `steps` and `Scene` identity reset it to false.
- [x] **Step 4:** Run `npx vitest run`. Expected: pass.
- [x] **Step 5: Check in the browser.**
  - Tab once on `#/stack/3`: the skip link shows, and Enter focuses Back/Next.
  - On `#/lcs/10`, `.scene-fit svg` count is 0 a second after load.
  - The camera still follows the steps.
- [x] **Step 6: Commit.** `feat(a11y): skip to step controls; perf: drop off-screen fit scenes once measured`

### Task 5: On-ramp: intro on `/` and the first-visit trace tip

**Files:**
- Create: `src/app/Intro.tsx` and `src/app/Intro.test.tsx`
- Modify: `src/app/App.tsx` (pass `progress` to the home guide), `src/app/GuidePage.tsx` (render `<Intro>` above the head when `home`), `src/app/LessonPage.tsx` (the tip under the rail) and `src/app.css`

**Interfaces:**
- Consumes: `LazyLesson` (`src/lessons/load.tsx`), `linesFor` and `parseAll` (`src/engine/anchors`), `useStoredFlag`, and `Progress`.
- Produces: `Intro({ progress }: { progress: Progress })`, which renders null when progress has any key or when `tracepoint-intro-hidden` is set.

**Copy (exact):**
- **Intro heading:** `Watch an algorithm run, one line at a time.`
- **Intro body:** `Each step shows the picture, the sentence that explains it, and the line of code that ran. You can type your own input and watch that run too.`
- **Mini-trace controls:** `Back`, `Next`, and a counter `Step n of 3`.
- **Intro buttons:** `Start the course` → `#/big-o-by-counting/1`, and `Hide`.
- **Trace tip (fine pointer):** `Step with ← and →, drag the timeline, or open "Try your own input" below.`
- **Trace tip (coarse pointer):** `Tap Next, or drag the timeline.`
- **Tip dismiss:** a button with `aria-label="Dismiss tip"`.

- [x] **Step 1: Write the failing tests.**
  - `Intro` with `progress = {}` and empty storage contains the heading text, `href="#/big-o-by-counting/1"` and `Step 1 of 3`.
  - With `progress = { stack: 2 }` it renders `""`.
  - With `tracepoint-intro-hidden = "1"` it renders `""`.
  - The home route `/` renders the intro before the guide's `h1`, and `/guide/foundations` does not render it.
  - The trace page with empty storage shows the tip on step 1. It does not show with `tracepoint-tip-seen = "1"`, and it does not show at step index ≥2.
- [x] **Step 2:** Run the tests. Expected: FAIL.
- [x] **Step 3: Implement.**
  - **Mini-trace:**
    - It loads `stack` through `LazyLesson`.
    - It uses default-run steps 1–3 (`push 4`, `push 9`, `push 2`).
    - For each step it shows `lesson.Scene` in a fixed-height frame (no CLS), the step title and text, and the lit Java line(s) from `linesFor(parseAll(lesson.code).java, step.anchors)` as one read-only code row.
    - It has no autoplay, and the Back/Next buttons are ≥44px on coarse pointers.
    - Its local live region is quiet on mount and announces only on a step change.
  - **Intro block layout:** it is a single card at the top of the centre column, with the mini-trace to the right of the copy on ≥1120px and stacked below it on narrow screens.
  - **Trace tip:** it sits under the scrubber as one line at chrome tier. It is stored as seen on dismiss or when `idx >= 2`.
- [x] **Step 4:** Run `npx vitest run`. Expected: pass.
- [x] **Step 5: Check in the browser.**
  - With cleared storage on `#/`, the intro shows; stepping the mini-trace works with a keyboard; Hide removes it for good.
  - Opening any lesson to step 2 and returning to `#/` shows no intro.
  - At 375×812 there is no overflow.
- [x] **Step 6: Commit.** `feat(onboard): intro on the home page and a first-visit trace tip`

### Task 6: Verify, document, re-score

**Files:** `CLAUDE.md` (type tiers, fold rules, storage keys), `docs/plans/batch3-hierarchy-onramp.md` (tick the boxes), plus screenshots in the scratchpad.

- [x] **Step 1:** Run `npx tsc --noEmit && npx vitest run && npm run build`. Expected: all clean.
- [x] **Step 2:** Run `impeccable detect --json` on the changed files and on `#/dijkstra/5`, `#/stack/3`, `#/guide/foundations` and `#/`. Expected: no new findings; `nested-cards` and `straggler` are gone.
- [x] **Step 3:** Run `impeccable shot` at 1440×900, 1024×768 and 375×812 in light and dark for `#/`, `#/stack/3`, `#/dijkstra/5` and `#/lcs/10`.
- [x] **Step 4: Run the Batch 1 phone sweep script** (all 49 lessons, steps 1–3, at 375×812). Expected: every sentence top is ≤674px and nothing overflows. Then reset the viewport to desktop.
- [ ] **Step 5: Re-run the critique** on the trace page with the same rubric as the November review. Expected: H6 and H8 are each ≥4, and the total is ≥36/40. List anything under 4 as a follow-up.
- [x] **Step 6:** Update `CLAUDE.md`. Commit `docs: Batch 3 hierarchy rules`. Push and open the PR, then call `get_status` and bind it.

## Out of scope (parked, with where they go)

- **Scene tag minimum sizes** (Dijkstra `d=…`, edge weights). They touch the iso kit and camera, so they get their own small batch after this one.
- **Predict mode, the end-of-lesson check, fill-the-line, recognition drills and the study tracks.** These are cycle 2: the learning loop (learner review, roadmap items 1–3 and 6–10).
- **Missing interview-pattern lessons.** These are content milestones after cycle 2 starts.
- **Manifest PNG icons and the two RunForm/loading minors parked in PR #25.**

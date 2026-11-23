# Batch 4: Critique Gap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lift the trace page's Impeccable critique from 34/40 to at least 36/40, with H8 (aesthetic and minimal) at 4 and H1–H5 at 4, by closing the follow-ups listed in PR 26.

**Architecture:** Most of this is copy and chrome. Step names move out of `LessonPage` into a pure `stepName` helper, so a lesson-wide test can hold every lesson to readable names, and the grid-DP and graph generators set `short`. Chrome changes (metrics, memory summary, tags, stage height) are CSS plus small markup changes. Recovery and consistency fixes (H3–H5) are local to `RunForm`, `TopNav` and `LessonPage`.

**Tech Stack:** React 18, Vite 5, strict TypeScript, Vitest SSR tests (`renderToStaticMarkup`, no jsdom), plain CSS in `src/app.css`.

**Spec:** PR 26's body (follow-ups list) and the Batch 3 critique round 2, summarized in this plan's Global Constraints and tasks. No separate spec document; rulings in this plan are provisional against those two sources.

## Global Constraints

- Font: JetBrains Mono only (`var(--mono)` and the body stack already set). No new fonts.
- Type tiers only: `--fs-title` 20px, `--fs-content` 15px, `--fs-chrome` 12px, `--fs-micro` 11px, `--lh-content` 1.6. No new font-size literals outside these, except SVG text inside the scene.
- No `!important`.
- Colour marks state only (CLAUDE.md design rules). No new decorative colour.
- Breakpoints stay 1120px and 680px (and the 560px phone layout). No new breakpoints except the 561–1120px block that already exists.
- Stored flags go through `useStoredFlag` with the existing keys: `tracepoint-run-open`, `tracepoint-memory`, `tracepoint-keys-seen`, `tracepoint-tip-seen` (`TIP_KEY` in `src/hooks/useTip.ts`), `tracepoint-intro-hidden`, `tracepoint-whole`.
- Writing rules (CLAUDE.md, `src/theory/check.ts`): plain words, sentences of 25 words or fewer, no exclamation marks.
- A step's short name is 24 characters or fewer and never a bare coordinate such as `i3 j3`, `a5 c2` or `back i2 j1`.
- Each task commits with a message ending in `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- One branch (`batch4-critique-gap`) and one PR. Do not merge.

## Review Focus

- A custom input on a grid-DP lesson (`?in=` with letters or numbers the presets never use) must still give readable step names. Task 1's lesson-wide test runs every preset; Task 1 adds one odd custom input per DP lesson.
- A one-letter or repeated-letter LCS or edit-distance input (`"A"` and `"A"`; `"AAA"` and `"AA"`) must not produce duplicate or empty names. Task 1 covers it.
- Phone width (375px) with long names: the step bar and Next button must ellipsize, not wrap or overflow. Task 7 re-runs the phone sweep.
- "Show tips again" pressed on the home page and on a lesson page: both the key legend and the intro tip must come back without a reload. Task 5 tests the same-tab sync.
- Dark theme: the quieter metrics line and the graph tags must keep AA contrast on `--surface`. Task 7 checks both themes.

---

### Task 1: Readable step names

**Files:**
- Create: `src/engine/stepName.ts`
- Create: `src/engine/stepName.test.ts`
- Modify: `src/app/LessonPage.tsx:131-143` (use the helper)
- Modify: `src/lessons/lcs/generate.ts`, `src/lessons/edit-distance/generate.ts`, `src/lessons/knapsack/generate.ts`, `src/lessons/coin-change/generate.ts`
- Modify: `src/lessons/bfs/generate.ts`, `src/lessons/dijkstra/generate.ts`, and any of `dfs`, `union-find`, `kruskal-and-prim`, `representations` that the new test fails on
- Test: `src/lessons/lessons.test.ts`

**Interfaces:**
- Produces: `export function runOpOf(steps: Step[]): string | null` and `export function stepName(steps: Step[], i: number, runOp: string | null): string` in `src/engine/stepName.ts`. Same behaviour as today's `label` / `runOp` / `railName` in `LessonPage`: `short`, else the kind when the op is the run-wide op (40% or more of steps), else the op, else `"start"` for step 0 and `"recap"` otherwise.
- Produces: `export const COORD = /\b[a-z]\d+ [a-z]\d+\b|^back i\d|^[a-z]\d+$/` in the same file, the pattern a name must not match.

- [ ] **Step 1: Write the failing tests**

In `src/engine/stepName.test.ts`: `stepName` returns `short` when set; returns the kind when the op is the run op; returns `"start"` / `"recap"` for op-less first and last steps; `runOpOf` returns null when no op reaches 40%.

In `src/lessons/lessons.test.ts`, inside the `describe.each`:

```ts
it("names every step readably", () => {
  for (const t of texts) {
    const r = lesson.parse(t);
    if (!r.ok) throw new Error(r.error);
    const steps = lesson.generate(r.input);
    const op = runOpOf(steps);
    steps.forEach((_, i) => {
      const n = stepName(steps, i, op);
      expect(n.length, `${t} / ${i}`).toBeLessThanOrEqual(24);
      expect(n, `${t} / ${i}`).not.toMatch(COORD);
    });
  }
});
```

Plus, in a new `describe("grid DP names")` block: LCS on `"AB"` / `"AB"` names a match cell `A = A` and a mismatch cell `A ≠ B`; LCS on `"A"` / `"A"` and `"AAA"` / `"AA"` passes the readable-name test; knapsack cell names read `item 2, room 5`; coin-change cell names read `amount 5, coin 2`.

- [ ] **Step 2: Run and see them fail**

Run: `npx vitest run src/engine/stepName.test.ts src/lessons/lessons.test.ts`
Expected: FAIL (`stepName` not defined, then lcs/knapsack/coin-change/edit-distance names matching `COORD`).

- [ ] **Step 3: Implement**

Move the logic into `stepName.ts` and have `LessonPage` call it (keep `railName` as the local name, `useMemo` around `runOpOf`). Set `short` on cell and traceback steps:
- lcs and edit-distance cells: `` `${a} = ${b}` `` on a match, `` `${a} ≠ ${b}` `` otherwise; traceback: `` `back to ${a}` `` or `back up` / `back left` for gap moves.
- knapsack cells: `` `item ${i}, room ${w}` ``; `take i${i}` → `` `take item ${i}` ``.
- coin-change cells: `` `amount ${a}, coin ${c}` ``; `pick c@a` → `` `use coin ${c}` ``.
- bfs and dijkstra distance steps: `` `dist ${x} = ${d}` ``.
- Any other lesson the test fails on: the smallest `short` that names what changed.

`op` values stay as they are (code anchors and tests may read them).

- [ ] **Step 4: Run and see them pass**

Run: `npx vitest run`
Expected: all PASS.

- [ ] **Step 5: Commit**

`git commit -m "feat: readable step names for grid DP and graph lessons"` with the trailer.

---

### Task 2: Quiet metrics line and memory summary

**Files:**
- Modify: `src/app.css:43` (`.metric small`), `src/app.css:171-172` (`.metrics`), and the `.memhead .lbl` rule
- Modify: `src/app/LessonParts.tsx:35-38` (memory summary text)
- Test: `src/app/folds.test.tsx`

**Interfaces:**
- Consumes: nothing new. `lesson.memory(step).title` stays as written in each lesson.

Decisions:
- Metrics become one muted line at chrome tier: `label value · label value`, labels in sentence case (no `text-transform`, no letter-spacing), values in `--ink`, weight 600. The `.metric` card look (min-width 86px, columns) goes; the phone grid at `src/app.css:493-495` becomes the same inline line, wrapping on `·` boundaries.
- Memory summary: lesson titles are already sentence case (`In memory: int[] data`); only the `.lbl` class uppercases them. The summary's title span gets its own class `memtitle` (chrome tier, weight 600, no `text-transform`, no letter-spacing) instead of `lbl`.

- [ ] **Step 1: Write the failing tests**

In `folds.test.tsx` (it renders routes through `AppRoutes` in a `MemoryRouter`): on `/stack/2`, the metrics markup has a `<span class="sep" aria-hidden="true">·</span>` between metric items and none before the first; the memory summary's title span has class `memtitle` and not `lbl`; `src/app.css` has no `text-transform` in the `.metric small` rule.

- [ ] **Step 2: Run and see them fail**

Run: `npx vitest run src/app/folds.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement** the markup in `MetricCard`/metrics row and the CSS above.

- [ ] **Step 4: Run and see them pass**

Run: `npx vitest run`
Expected: PASS.

- [ ] **Step 5: Commit**

`git commit -m "style: quiet metrics line and sentence-case memory summary"` with the trailer.

---

### Task 3: Short watch notes and readable graph tags

**Files:**
- Modify: lesson generators whose `idea` exceeds 160 characters (5 today)
- Modify: `src/iso/IsoScene.tsx` (expose the screen scale)
- Modify: `src/app.css:388-396` (`.edge-w`, `.tree-tag`)
- Test: `src/lessons/lessons.test.ts`, `src/iso/SceneFit.test.tsx`

**Interfaces:**
- Produces: IsoScene sets a CSS custom property `--px` on its `<svg>` (scene units per screen pixel, `aimed.w / size.w`, the value `CropCues` already uses), updated when the camera lands.

Decisions:
- Watch notes: cap at 160 characters by rewriting copy, not by clamping in CSS (no hidden text). The longest today is 195.
- Graph and tree tags: `.edge-w` and `.tree-tag` groups scale by `max(1, var(--px))` so their text never renders below 11 CSS px, whatever the zoom. Use `scale` (the individual transform property) so it composes with the inline `transform` that positions the tag.

- [ ] **Step 1: Write the failing tests**

`lessons.test.ts`: "keeps watch notes to 160 characters": every step's `idea` across presets has length ≤ 160.
`SceneFit.test.tsx`: IsoScene's server markup carries `--px` in the svg style.

- [ ] **Step 2: Run and see them fail**

Run: `npx vitest run src/lessons/lessons.test.ts src/iso/SceneFit.test.tsx`
Expected: FAIL (5 notes over 160; no `--px`).

- [ ] **Step 3: Implement**: rewrite the 5 notes (same meaning, writing rules hold), add `--px` (server default `1`), add the `scale` rule.

- [ ] **Step 4: Run and see them pass**

Run: `npx vitest run`
Expected: PASS.

- [ ] **Step 5: Check in the browser** (`tracepoint` preview, `#/dijkstra/4` at 1440×900 and 375×812): weight and distance tag text measures ≥ 11px (`getBoundingClientRect().height` of a tag `text` ≥ 11).

- [ ] **Step 6: Commit**

`git commit -m "fix: watch notes to 160 chars, graph tags never under 11px"` with the trailer.

---

### Task 4: Step sentence on the first screen at 1024×768

**Files:**
- Modify: `src/app.css:476` (`.stage` height in the ≤1120px block)
- Test: browser check only (layout cannot be measured in SSR)

Decision: below 1120px the stage height becomes `clamp(260px, 45vh, 540px)` (from `clamp(320px, 56vh, 540px)`). `.lesson-loading` at `src/app.css:146` uses the same value so the page does not jump on load.

- [ ] **Step 1: Measure before** at 1024×768, `#/lcs/3`: `.explain .say` top vs `.stepbar` top. Expected today: say top ≥ stepbar top (hidden under the bar).
- [ ] **Step 2: Change both clamps.**
- [ ] **Step 3: Measure after** at 1024×768 on `#/lcs/3`, `#/knapsack/3`, `#/dijkstra/3`, `#/stack/2`: say top + 24 < stepbar top on all four. At 375×812 the phone rule (`src/app.css:491`) still applies (unchanged).
- [ ] **Step 4: Commit**

`git commit -m "fix: stage caps at 45vh below 1120px so the step sentence shows"` with the trailer.

---

### Task 5: Recovery (H3): revert input, show tips again

**Files:**
- Modify: `src/hooks/useStoredFlag.ts` (same-tab sync)
- Modify: `src/app/RunForm.tsx`
- Modify: `src/app/TopNav.tsx` (help popover)
- Test: `src/hooks/useStoredFlag.test.ts` (create), `src/app/controls.test.tsx`

**Interfaces:**
- Produces: `useStoredFlag` instances with the same key stay in step within a tab: `set` dispatches `new CustomEvent("tracepoint-flag", { detail: { key, value } })` on `window`, and every instance listens and updates. Also listens to the `storage` event for other tabs.
- Produces: `export function resetTips(): void` in `src/hooks/useStoredFlag.ts`, which writes `"0"` to `tracepoint-keys-seen` and `tracepoint-tip-seen` and dispatches the event for each.

Decisions:
- RunForm: when `draft !== text`, a text button `Back to the running input` sits after the hint and sets `draft` to `text`, clears `fail` and `typed`.
- Help popover: a last row, button `Show tips again`, calls `resetTips()` and closes the popover (`hidePopover()` on `#help`).

- [ ] **Step 1: Write the failing tests**

`useStoredFlag.test.ts` (pure, no DOM render): with a stub `window` (an `EventTarget`) and stub `localStorage`, `resetTips()` writes `"0"` to both keys and dispatches two `tracepoint-flag` events with those keys.
`controls.test.tsx` (routes render through its `at(path)` helper; `?in=` sets RunForm's `asked`): `/stack/1?in=<a valid input other than the default>` shows a button `Back to the running input`; `/stack/1` does not. TopNav markup contains a button `Show tips again` inside `#help`.

- [ ] **Step 2: Run and see them fail**

Run: `npx vitest run src/hooks src/app/controls.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement** the event sync (subscribe in `useEffect`, unsubscribe on unmount), `resetTips`, the RunForm button and the popover button.

- [ ] **Step 4: Run and see them pass**

Run: `npx vitest run`
Expected: PASS.

- [ ] **Step 5: Check in the browser**: on `#/stack/1`, press Next (legend marked seen), open How to use, press Show tips again; the key legend shows again without reload. On `#/`, the intro tip shows again.

- [ ] **Step 6: Commit**

`git commit -m "feat: revert to the running input; show tips again"` with the trailer.

---

### Task 6: Consistency and states (H4, H5, H6)

**Files:**
- Modify: `src/app/LessonPage.tsx:170` (Play label), the stepbar theory link
- Modify: `src/app/RunForm.tsx` (Run button)
- Modify: `src/app/TopNav.tsx` (step kinds list), `src/design/ui.tsx:60-75` (`KIND_MEANING` export already exists)
- Modify: `src/app.css` (`.to-theory` visibility)
- Test: `src/app/controls.test.tsx`

Decisions:
- Play label: `Pause` while playing, `Replay` on the last step, `Play` everywhere else. "Play all" goes.
- Run button: `aria-disabled="true"` while `check` exists and `!check.ok`. It stays focusable and its submit still shows the alert (so the reason is announced). Styled by `[aria-disabled="true"]` with the existing disabled look.
- Theory/trace switch: `LessonTabs` is the switch. The stepbar `.to-theory` link shows only at ≤560px, where the tabs scroll away.
- Chip meanings (H6): the help popover gets a `Step kinds` section listing each `KIND_MEANING` entry, so touch and keyboard users can read what the coloured chips mean. The chip's `title` stays.

- [ ] **Step 1: Write the failing tests**

`controls.test.tsx`, via `at(path)`: `/stack/1` and `/stack/2` both render a button with text `Play` and none with `Play all`; `/stack/1?in=<an unparseable string>` renders the Run button with `aria-disabled="true"`, and with a valid string without it; TopNav markup has an `h3` `Step kinds` and one `dd` per `KIND_MEANING` key.

- [ ] **Step 2: Run and see them fail**

Run: `npx vitest run src/app/controls.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement** the four changes.

- [ ] **Step 4: Run and see them pass**

Run: `npx vitest run`
Expected: PASS.

- [ ] **Step 5: Commit**

`git commit -m "fix: stable Play label, Run aria-disabled, one view switch, step kinds in help"` with the trailer.

---

### Task 7: Verify, re-score, document, open the PR

**Files:**
- Modify: `CLAUDE.md` (step-name rule, 160-char watch notes, `--px` tags, `resetTips`)

- [ ] **Step 1: Static checks**

Run: `npx tsc -b && npx vitest run && npx vite build`
Expected: no type errors, all tests pass, build succeeds.

- [ ] **Step 2: Detector**

Run: `"/c/Users/vinay kumar/.claude/plugins/cache/impeccable/impeccable/4.10.0/skills/impeccable/scripts/impeccable" detect src`
Expected: no new findings against Batch 3's baseline.

- [ ] **Step 3: Shots** with `impeccable shot` of `#/lcs/3`, `#/dijkstra/4`, `#/knapsack/5` at 1440, 1024×768 and 375; light theme checked in the browser pane with `colorScheme: "light"`.

- [ ] **Step 4: Phone sweep**: import `/src/lessons/meta.ts`, walk `LESSON_META` at steps 1–3 at 375×812 (setTimeout loop, not requestAnimationFrame): `.explain .say` top < `.stepbar` top and `scrollWidth <= clientWidth` on every page. Reset the viewport to desktop after.

- [ ] **Step 5: Critique re-score** of the trace page with the Impeccable critique rubric. Gate: total ≥ 36/40 and H8 ≥ 4. If the gate is missed, record the scores and what is left in the PR body.

- [ ] **Step 6: Update CLAUDE.md** with the four rules above; commit `docs: Batch 4 notes` with the trailer.

- [ ] **Step 7: Push and open the PR** from `batch4-critique-gap` to `main`, body listing the changes, the before/after scores and any follow-ups, ending with the Claude Code line. Call `get_status`, then `bind_pr`. Do not merge.

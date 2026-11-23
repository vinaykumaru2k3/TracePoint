# Batch 2: performance and platform — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Tracepoint load and run lighter (lessons on demand, fewer re-renders, self-hosted font) and finish the platform basics (security headers, head metadata, accessible search, slider keys, touch targets), splitting `LessonView` so two custom-run bugs go away.

**Architecture:** App code stops importing the eager lesson registry. It reads a light `LESSON_META` list and loads each lesson's module with `import.meta.glob` on demand, so Vite emits one chunk per lesson. Tests keep the eager registry and prime the loader cache. The scrubber and the run form become their own components with their own state, and run-related state is keyed by the run's input text.

**Tech Stack:** React 18, react-router-dom 6 (HashRouter), Vite 5, TypeScript strict, Vitest 2 (SSR `renderToStaticMarkup` tests in node), Vercel static hosting.

**Spec:** `docs/reviews/2026-11-23-review-arch.md` (I2, I3, I4, M2, M3, M13) and `docs/reviews/2026-11-23-review-modernweb.md` (gaps 1, 2, 4, 5, 6, 8, 9). Batch 2 as agreed: lessons on demand, fewer re-renders, self-hosted font, security headers and head metadata, search combobox + PageUp/PageDown + 44px touch targets, LessonPage split fixing the Back/Forward progress bug and the silent bad-link fallback.

## Global Constraints

- Repo `D:\TracePoint\tracepoint-react`, branch `batch2-perf-platform` from main. One PR. Never merge.
- Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- JetBrains Mono is the only font. No `!important` in CSS. No raw colours outside `tokens.css` (except the luminance-mask white in `IsoScene`).
- Visible behaviour, copy and layout stay the same unless a task says otherwise. Keep the "Next: op" label on desktop.
- Every change keeps `npx tsc --noEmit -p .`, `npx vitest run` and `npm run build` green.
- No new runtime dependencies. One devDependency is allowed: `@fontsource-variable/jetbrains-mono` (Task 4), pinned to an exact version.
- Tests are node SSR tests (`renderToStaticMarkup`, `vi.stubGlobal("window", …)`) or pure-function tests; do not add jsdom or Playwright in this batch.
- Update `CLAUDE.md` where a task changes what it describes (layout of `src/`, lesson registry, head/font, accessibility notes).

## Review Focus

1. A lesson chunk fails to load (offline, or a deploy replaced the hashed files): the page shows the existing page error with Reload, not an endless loading state. (Task 1)
2. A cold deep link like `#/bst/7` lands on step 7 once the lesson loads, and nothing is reported to progress while it is loading. (Task 1)
3. Browser Back from a custom run to a run opened by a bad `?in=` link shows the "could not run" notice again instead of a silent default run. (Task 3)
4. A pasted huge `?in=` (hundreds of kB) is rejected without being parsed. (Task 3)
5. The production CSP blocks nothing the app needs (font, manifest, favicon, inline style attributes, lesson chunks). (Task 5, checked under `vite preview` with the same headers)

---

### Task 1: Lessons on demand

**Files:**
- Create: `src/lessons/meta.ts`, `src/lessons/load.tsx`, `src/lessons/meta.test.ts`, `src/lessons/load.test.tsx`, `src/test/setup.ts`
- Modify: `src/lessons/index.ts` (drop `DEFAULT_STEP_COUNT`, `DEFAULT_LESSON`; keep `LESSONS`, `LESSON_BY_ID` for tests), `vite.config.js` (`test.setupFiles`), `src/app/LessonPage.tsx`, `src/app/GuidePage.tsx`, `src/app/CourseSidebar.tsx`, `src/app/SearchDialog.tsx`, `src/theory/index.ts`, `src/theory/inline.tsx`, any other non-test importer of `../lessons`
- Test: the two new test files, and existing tests keep passing

**Interfaces:**
- Produces, `src/lessons/meta.ts`:
  - `interface LessonMeta { id: string; title: string; section: string; steps: number }`. `steps` is the length of the default run.
  - `LESSON_META: LessonMeta[]` in course order (the same order as `LESSONS`), written as literal data.
  - `META_BY_ID: Record<string, LessonMeta>` and `DEFAULT_LESSON: string`, which is `LESSON_META[0].id`.
- Produces, `src/lessons/load.tsx`:
  - `loadLesson(id: string): Promise<AnyLesson>`. It reads `import.meta.glob<{ default: AnyLesson }>("./*/index.ts")`, which is lazy. The folder name is the lesson id. Results go in a module cache, and an unknown id rejects with `Error("No lesson called <id>")`.
  - `peekLesson(id: string): AnyLesson | undefined`, a synchronous read of the cache.
  - `primeLessons(ls: AnyLesson[]): void` and `clearLessons(): void`, used by tests.
  - `useLesson(id: string): AnyLesson | null`. It returns the cached lesson synchronously when present, otherwise `null` until the load resolves. If the load rejects, it rethrows the error during render, so the route's `ErrorBoundary` shows `PageError`.
  - `LazyLesson({ id, fallback, children }: { id: string; fallback: ReactNode; children(l: AnyLesson): ReactNode })`.
- Consumes: `ErrorBoundary` / `PageError` from `src/app/ErrorBoundary.tsx`, which already wraps the routes.

- [ ] **Step 1: Write failing tests**

`src/lessons/meta.test.ts`:
```ts
it("matches the eager registry: ids in order, titles, sections, default-run lengths", () => {
  expect(LESSON_META.map((m) => m.id)).toEqual(LESSONS.map((l) => l.id));
  for (const l of LESSONS) {
    const m = META_BY_ID[l.id];
    expect([m.title, m.section]).toEqual([l.title, l.section]);
    const r = l.parse(l.defaultText);
    expect(m.steps).toBe(r.ok ? l.generate(r.input).length : 1);
  }
});
it("app code never imports the eager registry", () => {
  // walk src/**/*.{ts,tsx} excluding *.test.* and src/test/**; none may import "../lessons" or "./lessons" index
});
```

`src/lessons/load.test.tsx`:
```ts
it("loads a lesson module by id and caches it", async () => {
  clearLessons();
  const l = await loadLesson("stack");
  expect(l.id).toBe("stack");
  expect(peekLesson("stack")).toBe(l);
});
it("rejects an unknown id", async () => { await expect(loadLesson("nope")).rejects.toThrow("No lesson called nope"); });
it("renders a loading state on a cold deep link and reports no progress", () => {
  clearLessons();
  const onVisit = vi.fn();
  const html = renderAt("/bst/7", onVisit);   // MemoryRouter + AppRoutes, as in announce.test.tsx
  expect(html).toContain('aria-busy="true"');
  expect(onVisit).not.toHaveBeenCalled();
  primeLessons(LESSONS);
});
it("renders the asked step once the lesson is cached", () => {
  primeLessons(LESSONS);
  expect(renderAt("/bst/7", () => {})).toContain("Step 7 of");
});
```

- [ ] **Step 2: Run them and see them fail**: `npx vitest run src/lessons/meta.test.ts src/lessons/load.test.tsx`. They fail because the modules do not exist yet.

- [ ] **Step 3: Implement `meta.ts` and `load.tsx`.** Add `src/test/setup.ts`, which calls `primeLessons(LESSONS)`. Register it as `test: { setupFiles: ["src/test/setup.ts"] }` in `vite.config.js`. Remove `DEFAULT_STEP_COUNT` and `DEFAULT_LESSON` from `lessons/index.ts`, and move any test that used them to `META_BY_ID` / `meta.ts`.

- [ ] **Step 4: Switch app code to meta and the loader.**
  - `LessonPage`: an unknown id (`!META_BY_ID[id]`) still redirects to `/${DEFAULT_LESSON}/1`. While `useLesson` returns `null`, render `<main className="lesson-loading" aria-busy="true" aria-label="Loading <title>">`. It needs a min-height equal to the stage so nothing jumps, and it runs no effects that report progress.
  - `GuidePage`: `Thumb` and the hero scene use `LazyLesson`, with a same-size empty fallback.
  - The done rule reads `META_BY_ID[id].steps`.
  - `CourseSidebar` and `SearchDialog` use `LESSON_META` / `META_BY_ID` for what is live and for counts.
  - In `theory/index.ts` and `inline.tsx`, link labels come from `META_BY_ID`.

- [ ] **Step 5: Verify.**
  - `npx vitest run`: all pass.
  - `npm run build`: there is no "chunks are larger than 500 kB" warning, the entry `index-*.js` is under 300 kB, and there is one chunk per lesson.
  - In the browser, `#/stack/3` and `#/guide/graphs` render, and the network tab shows only the needed lesson chunks.

- [ ] **Step 6: Commit** `perf: load each lesson on demand`.

### Task 2: Fewer re-renders, and the scrubber as its own component

**Files:**
- Create: `src/app/Scrubber.tsx`, `src/app/Scrubber.test.ts`
- Modify: `src/iso/SceneFit.tsx` (export `memo(SceneFit)`), `src/app/LessonPage.tsx` (the scrubber markup and its pointer and peek code move out)

**Interfaces:**
- Produces:
  - `scrubKey(key: string, idx: number, last: number): number | null`.
    - ArrowLeft and ArrowUp give `idx-1`. ArrowRight and ArrowDown give `idx+1`.
    - Home gives `0` and End gives `last`.
    - PageUp and PageDown move by `Math.max(1, Math.round((last + 1) / 10))`.
    - The result is clamped to `[0, last]`. Any other key gives `null`.
  - The default export `Scrubber`, with props `{ steps: AnyStep[]; idx: number; reached: number; name(i: number): string; title(i: number): string; onJump(i: number): void }`. It owns `peek` and the pointer state. It renders the existing `role="slider"` markup and classes unchanged. Its `onKeyDown` handles `scrubKey` and calls `preventDefault()` and `stopPropagation()`.
- `useKeyboard` keeps its global arrows. When the slider has focus, it handles the key itself and stops propagation, so a key never steps twice.

- [ ] **Step 1: Failing tests** in `Scrubber.test.ts`:
```ts
expect(scrubKey("PageDown", 0, 32)).toBe(3);
expect(scrubKey("PageUp", 2, 32)).toBe(0);
expect(scrubKey("PageDown", 10, 11)).toBe(11);
expect(scrubKey("End", 0, 32)).toBe(32);
expect(scrubKey("ArrowLeft", 0, 5)).toBe(0);
expect(scrubKey("a", 3, 5)).toBeNull();
expect((SceneFit as unknown as { $$typeof: symbol }).$$typeof).toBe(Symbol.for("react.memo"));
```
  Also an SSR check that `#/stack/3` still renders `role="slider"` with `aria-valuenow="3"` and the same `aria-valuetext`.
- [ ] **Step 2:** Run the tests and see them fail.
- [ ] **Step 3:** Implement. `LessonView` passes stable callbacks (`useCallback`) so the memoised `SceneFit` keeps its props, which are `steps`, `Scene` and `setBoxes`.
- [ ] **Step 4:** Verify.
  - Run the full tests.
  - In the browser: hover over the scrubber, press PageDown and PageUp, drag, and Play. The behaviour is unchanged.
  - A temporary render counter (removed before commit), or the React DevTools profiler if available, shows `SceneFit` no longer re-rendering on step change or hover.
- [ ] **Step 5:** Commit `perf: memoise the measuring scenes and give the scrubber its own state`.

### Task 3: Split LessonView; run state follows the input

**Files:**
- Create: `src/app/useLessonRun.ts`, `src/app/useLessonRun.test.ts`, `src/app/RunForm.tsx`
- Modify: `src/app/LessonPage.tsx`

**Interfaces:**
- Produces:
  - `MAX_INPUT = 1000`.
  - `readAsked(lesson: Pick<AnyLesson, "parse" | "defaultText">, asked: string | null): { text: string; linkError: string }`.
    - When `asked` is null, it returns the default text with no error.
    - When `asked.length > MAX_INPUT`, it returns the default text and the error `This link's input is too long to run, so the default run is shown.` It does not call `parse`.
    - When the input does not parse, it returns the default text and the error `This link's input could not run, so the default run is shown. <parse error>` (the current wording).
    - Otherwise it returns `asked` with no error.
  - `runMax(prev: { text: string; max: number }, text: string, idx: number): { text: string; max: number }`. A different `text` restarts from `idx`. The same text keeps `Math.max`.
  - `useLessonRun(lesson, asked)`. It returns `{ text, linkError, steps, query, isDefault }`, with `readAsked` and `steps` memoised on `[lesson, asked]` / `[lesson, text]`.
  - `RunForm`, with props `{ lesson: AnyLesson; text: string; linkError: string; onRun(raw: string): void }`. It owns `draft`, the Run parse error, and the check and copy state. Its markup and classes stay the same as now. The copy-state timer is cleared on unmount.
- `LessonView` keeps the layout and the player. It uses `runMax` keyed by `text` for `reached`, in place of `customMax` plus the manual reset in `run()`.

- [ ] **Step 1: Failing tests** in `useLessonRun.test.ts`:
```ts
const parse = vi.fn((t: string) => t === "ok" ? { ok: true, input: 1 } : { ok: false, error: "Bad." });
const L = { parse, defaultText: "ok" } as never;
expect(readAsked(L, null)).toEqual({ text: "ok", linkError: "" });
expect(readAsked(L, "x".repeat(400_000)).linkError).toMatch(/too long/);
expect(parse).not.toHaveBeenCalled();
expect(readAsked(L, "zz")).toEqual({ text: "ok", linkError: "This link's input could not run, so the default run is shown. Bad." });
expect(runMax({ text: "a", max: 9 }, "b", 2)).toEqual({ text: "b", max: 2 });
expect(runMax({ text: "a", max: 9 }, "a", 4)).toEqual({ text: "a", max: 9 });
```
  Also add an SSR check: `#/stack/2?in=bogus` renders the "could not run" notice.
- [ ] **Step 2:** Run the tests and see them fail.
- [ ] **Step 3:** Implement. The bad-link notice is now derived from `asked` on every render, so it comes back on Back/Forward. Running a valid input clears it, because the URL changes. `LessonPage.tsx` drops by at least 80 lines.
- [ ] **Step 4:** Verify.
  - Run the full tests.
  - In the browser, open `#/stack/1?in=bogus` (notice shows), run `push 1`, and step to 3. Press browser Back twice: the notice shows again, and the Checkpoints and seen ticks follow the run on screen.
- [ ] **Step 5:** Commit `refactor: split the lesson page; run state follows the input`.

### Task 4: Self-hosted JetBrains Mono

**Files:**
- Create: `public/fonts/jetbrains-mono-latin-wght.woff2` (copied from `@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2`), `public/fonts/OFL.txt` (the package's licence), `src/design/font.test.ts`
- Modify: `package.json` (an exact-version devDependency), `index.html`, `src/design/tokens.css`

**Interfaces:**
- `@font-face { font-family: "JetBrains Mono"; src: url("/fonts/jetbrains-mono-latin-wght.woff2") format("woff2"); font-weight: 100 800; font-style: normal; font-display: swap; }` goes at the top of `tokens.css`. Add the package's latin `unicode-range`.
- `index.html`:
  - Remove the three Google Fonts tags.
  - Add `<link rel="preload" href="/fonts/jetbrains-mono-latin-wght.woff2" as="font" type="font/woff2" crossorigin>`.
- Add `font-size-adjust: from-font` on `body`, following the modern-web-guidance guide `visually-stable-font-fallbacks`.

- [ ] **Step 1: Failing test** `font.test.ts`, which reads files with `fs`:
  - `index.html` has no `fonts.googleapis` and has the preload link.
  - `tokens.css` has the `@font-face` with `font-display: swap`.
  - `public/fonts/jetbrains-mono-latin-wght.woff2` exists, is larger than 20 kB, and starts with the bytes `wOF2`.
- [ ] **Step 2:** Run the test and see it fail.
- [ ] **Step 3:** Install with `npm i -D -E @fontsource-variable/jetbrains-mono`, copy the file and the licence, then edit the CSS and HTML.
- [ ] **Step 4:** Verify.
  - Run the full tests and the build. `dist/fonts/` contains the woff2.
  - In the browser, `document.fonts.check('13px "JetBrains Mono"')` is true, and the network tab shows no `googleapis` or `gstatic` requests.
  - The lesson page looks the same as before, at the same text widths.
- [ ] **Step 5:** Commit `perf: self-host JetBrains Mono`.

### Task 5: Head metadata and security headers

**Files:**
- Create: `public/favicon.svg`, `public/manifest.webmanifest`, `vercel.json`, `src/design/head.test.ts`
- Modify: `index.html`, `src/hooks/useTheme.ts`, `vite.config.js`

**Interfaces:**
- `public/favicon.svg`: the logo's ember signal dot, a circle. The SVG may hold literal colours, because it is not app CSS; use the light `--signal` value from `tokens.css`.
- `index.html` gets:
  - `<link rel="icon" href="/favicon.svg" type="image/svg+xml">` and `<link rel="manifest" href="/manifest.webmanifest">`.
  - Two `<meta name="theme-color">` tags, `media="(prefers-color-scheme: light)"` and `(dark)`, whose values are the `--bg` light and dark values from `tokens.css`.
  - `<noscript><p>Tracepoint needs JavaScript to run its lessons.</p></noscript>`.
- `useTheme`: when the user picks a theme, set both theme-color metas to that theme's `--bg`, read with `getComputedStyle`. Under "system", restore the light and dark values.
- `manifest.webmanifest`: `name` "Tracepoint", `short_name` "Tracepoint", `start_url` "/", `display` "standalone", `background_color` and `theme_color` set to the dark `--bg`, and `icons` holding the SVG with `sizes: "any"`.
- `vercel.json` `headers` for source `/(.*)`:
  - `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`
  - `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Cross-Origin-Opener-Policy: same-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
  - `style-src` keeps `'unsafe-inline'` because React `style` attributes need it.
- `vite.config.js`: `preview.headers` are read from `vercel.json`, so `vite preview` serves the production CSP. The dev server stays without it, because Vite dev injects inline scripts.

- [ ] **Step 1: Failing test** `head.test.ts`:
  - `index.html` has the icon, the manifest, both theme-color metas and `noscript`.
  - `vercel.json` parses.
  - The CSP contains `script-src 'self'`, `object-src 'none'` and `frame-ancestors 'none'`, and does not contain `unsafe-eval`, `googleapis` or `gstatic`.
  - Every listed header is present.
  - The manifest parses and its icon file exists.
- [ ] **Step 2:** Run the test and see it fail.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Verify.
  - Run `npm run build` and `npx vite preview --port 4173`, using a `.claude/launch.json` entry named `preview`.
  - Open `#/stack/3`, `#/guide/graphs` and `#/dijkstra/learn`. The console has no CSP violations, the font and favicon load, the theme toggle changes theme-color, and the lesson chunks load.
- [ ] **Step 5:** Commit `feat: favicon, manifest, theme-color and security headers`.

### Task 6: Search as a combobox, and touch targets

**Files:**
- Modify: `src/app/SearchDialog.tsx`, `src/app.css`
- Test: `src/app/SearchDialog.test.tsx` (create or extend)

**Interfaces:**
- Input: `role="combobox"`, `aria-expanded={results.length > 0}`, `aria-controls="search-list"`, `aria-autocomplete="list"`, `aria-activedescendant={"search-opt-" + sel}` (when there are results).
- List: `<ul id="search-list" role="listbox" aria-label="Results">`. Each item is `<li id={"search-opt-" + i} role="option" aria-selected={i === sel} aria-disabled={!r.live || undefined}>`, chosen on click. There are no buttons inside options, and no `aria-selected` on a button.
- A `<p role="status" className="sr">` holds `N results` or `No results`.
- The active option scrolls into view with `scrollIntoView({ block: "nearest" })` on `sel` change.
- Keyboard behaviour stays the same: arrows, Enter, and Esc through `<dialog>`.
- CSS keeps the look of `.search li` the same as the old button (move the button's rules onto `[role="option"]`). Add `@media (pointer: coarse) { .icon-btn, .btn, .search-btn { min-width: 44px; min-height: 44px; } }`, adjusting for the existing selectors in `app.css`.

- [ ] **Step 1: Failing test.** Render `SearchDialog` with `open` through SSR inside a `MemoryRouter`.
  - The markup has `role="combobox"`, `aria-controls="search-list"`, `role="listbox"`, `id="search-opt-0"` with `aria-selected="true"`, and `role="status"`.
  - The markup has no `<button aria-selected`.
  - `app.css` matches `/@media \(pointer: coarse\)[^}]*min-height: 44px/`.
- [ ] **Step 2:** Run the test and see it fail.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Verify.
  - Run the full tests.
  - In the browser with Ctrl+K: type "sort", press ArrowDown twice and Enter, and land on the right lesson. The looks are unchanged.
  - At the mobile preset the top-nav buttons measure 44px. Reset the viewport to desktop afterwards.
- [ ] **Step 5:** Commit `feat(a11y): search is a combobox; 44px touch targets on touch screens`.

### Finish

- [ ] Update `CLAUDE.md`:
  - The layout of `src/` (`lessons/meta.ts`, `load.tsx`, `Scrubber`, `RunForm`, `useLessonRun`).
  - "Add a lesson" (also add its row to `meta.ts`; the meta test catches drift).
  - The font and head notes.
- [ ] Full `tsc`, tests and build. Push the branch and open the PR. Its body lists the changes with before/after bundle sizes and ends with the 🤖 line. Call `mcp__ccd_pr__get_status` and bind the PR. Do not merge.

# Debugger redesign + DSA course root

## Goal

1. All sections sit under one parent, **DSA**, in the course tree (sidebar and the narrow-screen drawer).
2. Change the look so Tracepoint no longer reads as a copy of designed-to-scale.vercel.app. Direction: **debugger / IDE**. That means a file-explorer course tree, a trace-log step rail, a path breadcrumb, a cool graphite palette with one signal accent, sans prose with mono only for code and values. Isometric scenes keep their geometry, but `src/iso` and the scene tokens restyle them centrally.

No spec file exists. This plan is the spec. The user picked "Debugger / IDE" and "Restyle centrally".

## Global constraints

- React 18 + Vite 5 + strict TS. Run commands through PowerShell: `npm run typecheck`, `npx vitest run`, `npm run build`. From Bash, use `powershell -NoProfile -Command "cd D:\TracePoint\tracepoint-react; <cmd>"`, because bash npx breaks on the space in the user path.
- All 165 existing tests keep passing. Update a test only when it asserts on markup or copy this plan changes on purpose, and say so in the report.
- **Every colour is a token** in `src/design/tokens.css`, with light values in `:root` and dark values in BOTH `@media (prefers-color-scheme: dark) :root:not([data-theme="light"])` AND `:root[data-theme="dark"]`. Keep the two dark blocks identical. No raw hex/rgb in `app.css` or components, except `transparent` / `currentColor`.
- Text contrast ≥ 4.5:1 against its background in both themes. No text below 11px.
- Icons only via `Icon` in `src/design/ui.tsx`, never unicode glyphs. New icons get new `PATHS` entries.
- Keep the Next button label format exactly `Next: <op>` (for example `Next: pop()`). Keep "Back".
- Keep every keyboard shortcut, ARIA role, label and focus behaviour that exists today (tablists, `aria-current`, dialog focus return, the drawer).
- Keep the narrow layout rule: one column below 1120px wide or 680px tall, lesson first, course tree in the drawer, the page scrolls. Also keep the ≤560px phone rules working.
- Respect `prefers-reduced-motion`.
- No card inside a card.
- Do not change lesson generators, step content, the camera math (`camera.ts`, `follow`) or scene geometry/positions. Restyling only.
- One branch: `debugger-redesign`. Commit per task, message ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Do not push, do not open PRs. The controller does that.

## Design contract (binding for all tasks)

**Palette: cool graphite** (exact values are set in Task 1, and later tasks use the tokens only).
- Light: `--bg #f3f4f6`, `--surface #ffffff`, `--surface-2 #f7f8fa`, `--ink #14171c`, `--muted #545c68`, `--muted-2 #646c78`, `--line #e1e4e9`, `--line-strong #c9ced6`, `--edge #2a2f37`.
- Dark: `--bg #0e1115`, `--surface #151920`, `--surface-2 #1b2028`, `--ink #e7eaef`, `--muted #a1a9b5`, `--muted-2 #8f98a5`, `--line #252b34`, `--line-strong #353c47`, `--edge #c7ccd4`.
- **Signal accent: breakpoint red**, used sparingly as a marker: the brand dot, the current-step dot, the current-lesson bar. Light `--signal #d63a2f`, dark `--signal #ff6b5e`. Never as a large fill and never for body text.
- **Current/active chrome is inverted**: ink background with surface text (`--inv-bg: var(--ink)`, `--inv-fg: var(--surface)`). This applies to the primary button, the current rail entry and the selected code tab. The inverted pair must hold 4.5:1.
- Remove the hard `--pop` offset shadows and the soft `--card-shadow` everywhere. Panes are flat, separated by 1px `--line` borders, radius small (`--radius: 6px`). Popover, dialog and drawer may keep one subtle elevation shadow token (`--float-shadow`).
- State colours stay meaningful (amber active, green found, blue compare, plus swap/visited/stale), but tune them to sit on graphite. They keep the `--st-*` and `--c-*` names, so existing usages keep working.

**Typography**: IBM Plex Sans (400/500/600) for prose and UI, IBM Plex Mono (400/500/600) for code, values, ops, paths, step numbers, counts and kbd. Tokens: `--font` (sans) and `--mono`. They replace JetBrains Mono in `index.html`. Body 14px sans.

**Panes**: each column is an IDE pane with a small uppercase mono title bar (11px, letter-spaced, muted), for example `EXPLORER`, `TRACE`, `CODE`. One pane-title style, reused.

**Explorer** (course tree): a root folder row `DSA/` (collapsible, open by default) with a lesson count. Under it, one folder row per section named as a slug path, `01-foundations/`, with a count or `soon`. Lesson rows sit under those, like files: the current lesson gets a `--signal` left bar plus a `--surface-2` background, and progress dots stay. Indentation guides are 1px `--line` verticals. The root comes from a new export in `src/curriculum.ts`:
```ts
export const COURSE = { id: "dsa", name: "DSA", sections: CURRICULUM } as const;
```
The sidebar and the drawer both render from `COURSE`.

**Lesson head**:
- A path breadcrumb in mono, `dsa / linear / stack`, with segments muted and the last in ink. It replaces the "01. Foundations / Lesson 1 of 3" style.
- The h1 (sans, 600).
- ONE muted mono meta line, `6 min · beginner · 12 steps`, replacing the three badges.

**Rail (trace log)**: horizontal list of compact mono entries `01 start`, `02 push(4)`. The two-digit index is muted and the name follows. The current entry is inverted, with a small `--signal` dot before the index. Seen entries are ink, unseen are muted. No numbered circles. It still scrolls sideways and keeps the current entry in view.

**Right pane (Trace)**:
- The explanation card becomes the `TRACE` pane: a mono step header `#04  push(9)`, then the title/text.
- The key idea is a "watch" block: a left 2px `--line-strong` rule and a mono label `watch`.
- Back and `Next: op` buttons stay. Next is the inverted primary.
- "You'll learn" becomes `Checkpoints · n/m hit`.

**Top nav**:
- The brand is a small `--signal` dot plus "tracepoint" in mono.
- Tabs (Learn / Practice / Quiz) become editor tabs: plain text with a 2px ink underline on the current one. No pills.
- The rest of the nav stays.

**Scenes** (restyled centrally, geometry untouched):
- Flat faces with crisp 1px outlines (`--stroke` is a dark graphite in light theme and a light graphite in dark).
- Default slabs are cool neutral greys with a clear top/left/right value step.
- **No green footprint**: `.foot` becomes no fill with a 1px dashed `--line-strong` outline. `.win` (window highlight) becomes a translucent token fill, not raw rgba.
- **Dot grid** floor in place of the line grid: a small dot per tile intersection, `--grid-dot` token, still in scene units inside the SVG pattern, so it pans and zooms with the camera.
- Pointer flags: flat surface rect with a 1px `--edge` outline and mono text. The `pop` drop rect goes away, or becomes a token fill without an offset.
- Labels are in `--mono`.

## Tasks

### Task 1: Tokens and fonts

Files: `src/design/tokens.css`, `index.html`, and `src/app.css` only where it references removed tokens.

- Rewrite `tokens.css` to the palette above:
  - New tokens: `--mono`, `--signal`, `--inv-bg`, `--inv-fg`, `--float-shadow`, `--grid-dot`, `--win-fill`.
  - Set `--font` to `"IBM Plex Sans", system-ui, sans-serif` and `--mono` to `"IBM Plex Mono", ui-monospace, monospace`.
  - Set `--radius: 6px`.
  - Retune `--c-*`, `--st-*`, `--slab-*`, `--plate-*`, `--syn-*`, `--stroke`, `--foot*`, `--edge-active` and `--grid-line` for graphite in both themes.
  - Keep `--pop` and `--card-shadow` defined as `none`, so nothing breaks before Task 2 removes their uses.
  - Both dark blocks identical.
- `index.html`: load IBM Plex Sans 400;500;600 and IBM Plex Mono 400;500;600 from Google Fonts, replacing JetBrains Mono. Update the meta description to drop "isometric" wording only if it says "after designed-to-scale" (it does not, so leave it).
- `app.css`: set body to `font-family: var(--font); font-size: 14px`. Apply `font-family: var(--mono)` to code (`.code`, `pre`, `.ln`), `kbd`, metric values and the input field.
- Verify: typecheck, tests, build all green. Check that each text/background pair in the palette is ≥ 4.5:1, and list the computed ratios for ink/bg, muted/bg, muted/surface-2, inv-fg/inv-bg and signal/surface in the report, both themes.

### Task 2: Shell, panes, nav, buttons, lesson head

Files: `src/app.css`, `src/app/TopNav.tsx`, `src/app/LessonPage.tsx` (head section only), `src/design/ui.tsx` (only if a helper is needed).

- Remove every use of `--pop` and `--card-shadow` in `app.css`, then delete the two tokens from `tokens.css`. Cards become flat panes: `--surface`, 1px `--line` border, `--radius`.
- Add a `.pane-title` style (uppercase mono, 11px, letter-spacing .08em, `--muted`, a bottom 1px `--line`, compact padding). Give the course column `EXPLORER`, the explanation card `TRACE` and the code card `CODE`. For `CODE`, the tablist can sit in the title bar row.
- `.btn.primary` becomes inverted (`--inv-bg` / `--inv-fg`), with no shadow. Other buttons are hairline. The `.result` chip and the selected `.codetabs` tab use inverted or hairline styles, with no pop.
- TopNav:
  - The brand gets a `--signal` dot (a CSS pseudo-element or span, not a glyph) and lowercase mono "tracepoint".
  - Tabs are editor-style underline tabs. Keep the existing markup roles and `aria-current`.
- Lesson head: the path breadcrumb `dsa / <section id> / <lesson id>` in mono (segments may be links if the crumb was linked before; keep accessibility, `nav aria-label="Breadcrumb"` if it exists). Then the h1. Then a single meta line `{minutes} min · {level} · {n} steps` in muted mono, replacing the `.badges` row. Remove `Badge` usage there. Leave the `Badge` export only if something else still uses it, otherwise delete it.
- Narrow layout and the stepbar keep working. Restyle the stepbar to match (flat, hairline top border, inverted Next).
- Verify: typecheck, tests (update any test that asserted on the badges/crumb text and say which), build.

### Task 3: Explorer tree with the DSA root

Files: `src/curriculum.ts`, `src/app/CourseSidebar.tsx`, `src/app.css` (sidebar/drawer section), plus a new or updated test.

- Add `COURSE` to `curriculum.ts` exactly as in the contract.
- `CourseSidebar`:
  - Render `<nav className="side" aria-label="Course">` with a `EXPLORER` pane title.
  - Then one root `<details open className="root">` whose summary shows a folder icon, `DSA/` and the total lesson count.
  - Inside it, the existing section `<details className="sec">` with summary `01-foundations/` style labels: `${sec.n}-${sec.id}/`. Show the human section name as a `title` attribute, or as muted text after it if it fits.
  - Keep the per-section counts and `soon`, the lesson links, progress dots, `aria-current`, and the auto-open of the current section.
  - Keep the footer progress block, restyled flat.
- The drawer shows the same component, so it gets the root too.
- CSS: file-tree look, with indentation guides as a 1px `--line` left border on nested lists. The current lesson gets a 2px `--signal` left bar plus `--surface-2`. Rows are compact (about 26px), names in sans, folder labels in mono.
- Add a test (new file `src/app/CourseSidebar.test.tsx` or extend an existing one). With `MemoryRouter`, render the sidebar and assert that:
  - a "DSA/" root summary exists;
  - all 10 section folders are inside it;
  - the current lesson link has `aria-current="page"`.
  - If there is no React testing setup yet (check `package.json` for `@testing-library/react` and the vitest environment), instead write a pure test that `COURSE.sections === CURRICULUM` and that `COURSE.name === "DSA"`, and note it in the report. Do not add dependencies.
- Verify: typecheck, tests, build.

### Task 4: Trace-log rail, Trace pane, Checkpoints

Files: `src/app/LessonPage.tsx`, `src/app.css`.

- Rail:
  - Each `li` renders `<span className="ix">{NN}</span><span className="name">{railName(i)}</span>`, with NN zero-padded to 2 digits (3 if steps > 99), replacing the numbered circle.
  - The current entry is inverted with a `--signal` dot (pseudo-element) before the index. Seen (index < current, or visited per existing logic) is ink, unseen is muted.
  - Keep the click/keyboard behaviour, `aria-current="step"`, the horizontal scroll and the keep-current-in-view logic.
- Explanation card → `TRACE` pane:
  - A mono step header `#{NN}  {op or short label}` above the title.
  - The key idea is a watch block (a `watch` mono label plus 2px left rule).
  - Back / `Next: <op>` unchanged in label. Next is the inverted primary.
- LearnList: the summary text becomes `Checkpoints · {hit}/{total} hit`, where hit is the count already computed for the checklist (reuse the existing logic). Items render as a compact list with a hit/unhit marker (a CSS box, or the `Icon` check if one exists; add a `check` path if needed).
- Verify: typecheck, tests (update assertions on "You'll learn" text if any, and say so), build.

### Task 5: Isometric restyle

Files: `src/app.css` (scene section), `src/iso/IsoScene.tsx` (grid pattern only), `src/iso/IsoPointer.tsx` and others in `src/iso` only for styling hooks; `tokens.css` scene tokens if tuning is needed.

- Faces: `stroke-width: 1`, `stroke: var(--stroke)`. Keep the `.s-*` state mapping.
- Grid: replace the line pattern in `IsoScene` with a dot pattern. One small circle (r ≈ 1.2 scene units) at the tile origin, `fill: var(--grid-dot)`. The same `patternUnits="userSpaceOnUse"` and tile size keep it camera-locked. Keep the mask/fade if it exists.
- `.foot`: `fill: none; stroke: var(--line-strong); stroke-width: 1; stroke-dasharray: 4 3`.
- `.win`: `fill: var(--win-fill); stroke: var(--st-found-l) or a token; stroke-width: 1.5`. No raw rgba.
- Pointer flags: flat, with no offset drop rect. If `rect.pop` exists, render it with no offset, or remove it from `IsoPointer` (keep the geometry of the label). Text is `--mono` 11px, weight 600.
- `.box-label`, `.plate-index`, `.row-name`, `.null-tag`, `.scene-note` use `--mono`.
- Do not touch positions, `project.ts`, `camera.ts` or `SceneFit` measurement (SceneFit must still measure the drawing without the grid).
- Verify: typecheck, tests, build.

### Task 6: Docs

Files: `CLAUDE.md`, `README.md`.

- `CLAUDE.md`:
  - Rewrite the intro sentence to drop "styled after designed-to-scale.vercel.app".
  - Rewrite the whole "Design rules" paragraph to the debugger contract: graphite, signal red marker, inverted current, flat panes with titles, Plex Sans/Mono split, explorer tree under `DSA/`, trace-log rail, path crumb, the scene restyle (outlines, dot grid, dashed footprint), and the existing rules that remain (tokens, 4.5:1, 11px, Icon only, no card-in-card, layout, reduced motion, draw order).
  - Update "Fonts: JetBrains Mono only" to Plex Sans + Plex Mono.
- `README.md`: change the closing design summary line ("calm warm surfaces…") to the new direction. Mention the DSA root if the features list describes the course tree.
- Verify: no code change. Run tests once anyway.

## Review focus

- Dark block parity in tokens.css (both dark blocks identical).
- Contrast of muted text on `--surface-2` and inverted pairs.
- Narrow layout (≤1120 / ≤680 tall, ≤560) still a single scrolling column with a working drawer and stepbar.
- No leftover `--pop`, `--card-shadow` or JetBrains references; no raw colours outside tokens.css.
- Rail keep-in-view still works and `aria-current` semantics are intact.

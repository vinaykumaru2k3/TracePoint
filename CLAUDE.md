# Tracepoint

Interactive, step-through lessons for learning data structures and algorithms. Inspired by the System Design interactive course (designed-to-scale.vercel.app). The name comes from the debugger tracepoint: a spot where you record what happened. Here the learner records every operation, one step at a time.

## Current state

React 18 + Vite 5 app (plain JSX, no router library, no other runtime deps; Google Fonts only). Ported from the single-file vanilla prototype (`../extracted/tracepoint/index.html`). Run `npm install`, then `npm run dev` / `npm run build`.

- `src/data/` lesson content: `course.js` (course map), `lessons.js` (Java code, ops, costs, learn checklist).
- `src/engine/` `buildSteps.js` (pure simulation, plus `stepLabel`) and `steps.js` (precomputed `STEPS` per lesson).
- `src/hooks/` `useHashRoute`, `useProgress` (localStorage `tracepoint-progress`), `useTheme` (localStorage `tracepoint-theme`).
- `src/components/` `App` → `Topbar` + `Lesson` (keyed by lesson id, owns step index and autoplay). `Lesson` renders `CourseMap`, `LearnList`, `Stats`, `Stage`, `Memory`, `StepRail`, `Explain`, `CodePanel`.
- `src/styles.css` is the prototype's CSS unchanged, plus a React block at the end. Stage items enter and leave through CSS keyframes driven by `--x/--y` custom properties; removed items stay as short-lived "ghosts" in `Stage` while their leave animation plays.

Lessons done: Stack, Queue (hash routes `#stack`, `#queue`).

Layout: fluid (root font size scales with viewport width, all sizes in rem), one screen, no page scroll on desktop (three columns, `height: 100%`). Below 1120px wide or 620px tall the columns stack and the page scrolls.
- Left: course map (stops on a line, per-lesson progress, overall bar), "You will learn" checklist, keyboard hints.
- Centre: lesson title and meta, live stats (size, top/head, next write, free), the stage (fills the available height; geometry is computed from its size and re-laid-out by a ResizeObserver), the `int[] data` memory strip with op costs, and a bottom bar with Reset/Play plus a clickable named step rail.
- Right: step title, kind chip, caption, "Key idea", Back and "Next: <op>" buttons, then the Java class with executed lines highlighted in sequence and a line trace with real values.
- The stage shows a "returns" card for each operation (value, void, null or throws).
- Light/Dark toggle in the top bar (saved in localStorage as `tracepoint-theme`).
- Progress and checklist state is saved per viewer in localStorage (`tracepoint-progress`, wrapped in try/catch).

## How the engine works

`buildSteps(lesson)` simulates the Java code and returns one snapshot per operation:
`{ items, arr, top, head, size, kind, title, idea, op, hl, mode, cell, lines, notes, text, overwrote?, wrapped? }`.
The renderer only draws a snapshot, so going back is free. Checklist items are `[text, test(step)]` pairs on each lesson. To add a lesson, add an entry to `COURSE` (`src/data/course.js`) and `LESSONS` (`src/data/lessons.js`: `kind`, `cap`, `code`, `ops`, `costs`, `learn`) and teach `buildSteps` its operations. `Stage`, `Stats` and `Memory` currently branch on `kind === "stack"` vs queue, so a new kind needs its own drawing there too.

## Next

1. "Type your own values" input that re-runs the simulation.
2. Binary search lesson (shrinking window beside the code line).
3. Linked list, BFS/DFS.
4. Deploy on Vercel (React + Vite port with hash routes is done).
5. Quiz or predict-the-next-step mode.

## Design rules

Flat panels with hairline borders, no offset shadows. Palette: neutral grey background, teal accent, amber for the active element, violet for peek; full light and dark token sets (follows `prefers-color-scheme` and the viewer's `data-theme`). Fonts: Bricolage Grotesque (display), Instrument Sans (body), JetBrains Mono (code). Respect `prefers-reduced-motion`.

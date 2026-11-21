# Tracepoint

Interactive, step-through lessons for learning data structures and algorithms, styled after designed-to-scale.vercel.app. The name comes from the debugger tracepoint: a spot where you record what happened. Here the learner records every operation, one step at a time.

## Current state (milestone M0: platform)

React 18 + Vite 5 + TypeScript (strict), react-router-dom 6 `HashRouter`, Vitest. Fonts: JetBrains Mono only. Commands: `npm run dev`, `npm run typecheck`, `npm test`, `npm run build` (typecheck + vite build, output `dist/`, Vercel-ready).

Lessons done: Stack, Queue. The rest of the curriculum (`src/curriculum.ts`, 10 sections) shows as "soon".

Roadmap: M0 platform → M1 … M5 DP/advanced, one branch and PR each. Cycle 2: predict-the-next-step, quizzes, case studies.

## Layout of `src/`

- `app/` shell: `App`, `TopNav`, `CourseSidebar`, `SearchDialog` (Ctrl+K, native `<dialog>`), `LessonPage` (route `/:lessonId/:step?`, step is 1-based in the URL, `#/stack/5`), `CodeCard`.
- `engine/` `types.ts` (the lesson contract), `anchors.ts`, `usePlayer.ts` (autoplay over a URL-owned index).
- `hooks/` `useKeyboard`, `useTheme`, `useProgress`, `useLang`. All persisted in localStorage (`tracepoint-*`) inside try/catch.
- `iso/` isometric SVG primitives: `project.ts` (2:1 projection), `IsoScene`, `IsoBlock`/`IsoPlate`, `IsoPointer`, `Blocks` + `useGhosts` (enter/leave animation), `fitBox` for a constant viewBox.
- `lessons/<id>/` `generate.ts` (pure), `Scene.tsx`, `index.ts` (`defineLesson`), `generate.test.ts`, `code/Main.java|main.py|main.cpp`. Registry in `lessons/index.ts`. `parseOps.ts` parses the "type your own values" input.
- `design/` `tokens.css`, `ui.tsx`. `app.css` is the layout.

## How a lesson works

`generate(input)` returns `Step[]`, problem step first and recap last. A step holds a title, text, key idea, op, `anchors`, `notes`, and a `state` that only the lesson's `Scene` understands. The renderer draws one snapshot, so going back is free.

Code is shown in Java, Python and C++. Each source file tags lines with `// @a name` (or `# @a name`). Steps name anchors, never line numbers, so highlights follow the selected language tab. Tests check that every anchor a step uses exists in all three languages.

### Add a lesson

1. Add it to `curriculum.ts` if it is not there.
2. Create `src/lessons/<id>/` with `generate.ts`, `Scene.tsx`, the three code files, `index.ts`, and a test.
3. Register it in `src/lessons/index.ts`. `lessons.test.ts` then checks parse defaults, anchors, learn checklist and curriculum membership.

## Design rules

Calm and soft, after designed-to-scale. Warm paper background, hairline borders (`--line`), soft blurred card shadows (`--card-shadow`). The small hard `--pop` shadow with an `--edge` outline is only for the active thing: primary button, current tab, current lesson, current step, badges, pointer flags. Scenes are soft shaded isometric slabs in warm neutrals (`--slab-*`) on a faint fading grid with a green footprint; colour appears only for state (amber active, green found, blue compare). No dashed walls, no saturated block colours. JetBrains Mono everywhere, 13px body. Light and dark themes via tokens (`prefers-color-scheme` plus `data-theme`). Layout: top nav, then course tree | one lesson card (header, stage with metric chips, numbered step rail, input, memory) | explanation + code. Below 1120px wide or 620px tall the columns stack and the page scrolls. Respect `prefers-reduced-motion`. Draw order in scenes follows array order (list back to front); no depth sorting.

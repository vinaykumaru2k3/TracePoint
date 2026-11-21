# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Self-learners of any level, from CS students meeting data structures for the first time to developers revising DSA for coding interviews. Both groups are equally important. Sessions can be long, so the page must stay comfortable to look at for a long time.

## Product Purpose

Tracepoint teaches data structures and algorithms one operation at a time. Each lesson replays a run step by step: an animated diagram, a plain-language explanation, and the real code with the executing line highlighted. Success means a learner can predict what the next step will do.

## Positioning

Every step is tied to the exact line of real code that causes it, in Java, Python and C++, and the learner can type their own operations and watch the run they asked for.

## Operating Context

Desktop browser first, also usable on a phone. Learners step with the keyboard (arrows, Space, R) or buttons, jump via a step rail, and come back to a lesson later through a URL that names the step (`#/stack/5`). Progress is kept per browser.

## Capabilities and Constraints

- Lessons: 15 live across sections 1-3 (foundations, linear structures, hashing); about 49 planned across 10 sections (`src/curriculum.ts`).
- Stack: React 18, Vite, TypeScript, SVG diagrams, deploy on Vercel.
- Code highlighting with Java / Python / C++ tabs and the running line highlighted must stay (user, 2026-11-21).
- Diagrams follow the debugger direction: flat outlined cool-grey isometric slabs with 1px outlines, a dot grid floor locked to the camera, a dashed footprint outline, colour only for state (user, 2026-11-21). Rejected: the earlier harsh iso (thick borders, saturated blocks, dashed walls) and flat textbook 2D diagrams.
- Later: predict-the-next-step, quizzes, case studies.

## Brand Commitments

Name: Tracepoint, after the debugger tracepoint. No logo or other assets yet.

## Evidence on Hand

No testimonials, users, or metrics exist. Do not invent any.

## Product Principles

1. The step is the unit: one operation, one picture, one highlighted line.
2. Calm over spectacle: learners stare at this for long sessions.
3. The code is real and the diagram never lies about it.
4. Let learners drive: their own input, their own pace.

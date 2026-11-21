# Tracepoint

Interactive step-through lessons for data structures and algorithms. Pick a lesson, type your own operations, and watch each step on an isometric diagram next to the Java, Python or C++ code.

```
npm install
npm run dev        # http://localhost:5173
npm test           # Vitest
npm run build      # typecheck + production build into dist/
```

Lessons so far: Stack, Queue. Keyboard: ← / → step, Space play, R reset, Ctrl+K search.

Deploy: import the repo in Vercel (framework Vite, build `npm run build`, output `dist`). Routes use the URL hash, so no rewrites are needed. See `CLAUDE.md` for the architecture and how to add a lesson.

# Spec: the theory layer

## The problem

Every lesson today opens on a problem and starts animating. A learner who has never heard of a stack, a hash table or recursion meets the solution before the idea. They need the idea first: what the thing is, what it does, what it costs, and when to reach for it. Only then is the trace useful.

## What we build

Two kinds of reading, one per level of the explorer tree.

### 1. Folder guide: one per section

Each folder in the explorer gets a `README.md` file as its first entry, for example `01-foundations/README.md`. It opens the section's **guide** at `#/guide/<sectionId>`. A guide answers "what is this whole topic and why should I care", in this fixed order:

| Part | What it holds | Rule |
|---|---|---|
| Tagline | One sentence that says what the topic is about. | ≤ 25 words |
| Core idea | The central idea in plain words. | 1–3 paragraphs |
| Analogy | One everyday picture of the idea. | 1 paragraph |
| Before you start | What the learner should already know, linking to earlier guides or lessons. Foundations says what basic programming it assumes. | ≥ 1 item |
| Key terms | A glossary: term, then a plain definition. Every term the guide relies on is here. | ≥ 4 terms |
| Cheat sheet | A table of operations or techniques with time and space cost and a short note. | ≥ 3 rows, every row has as many cells as the header |
| When you see… | Pattern pairs: a signal in a problem, and the technique it points to. | ≥ 3 pairs |
| Tips and traps | Common mistakes and how to avoid them. | ≥ 3 items |
| Case studies | Real situations where the idea is used: the setting, the idea that solves it, and why it fits. | ≥ 2 cases |
| Lessons here | Every live lesson in the folder, in order, each with a one-line hook. Lessons not built yet show as "soon". | One hook per live lesson |

### 2. Lesson theory: one per lesson

Each lesson gets two tabs in its head: **theory** and **trace**. The trace tab is today's page. The theory tab (`#/<lessonId>/learn`) holds, in this order:

| Part | What it holds | Rule |
|---|---|---|
| Definition | What it is, in one or two sentences. | ≤ 2 sentences |
| Analogy | One everyday picture. | 1 paragraph |
| How it works | The procedure as numbered steps. | ≥ 3 steps |
| Operations | Optional table: operation, cost, note. | Each row has 3 cells |
| At a glance | The lesson's existing `costs` list, rendered as-is, so the theory can never disagree with the trace. | Comes from `lesson.costs` |
| Use it when / Avoid it when | When it is the right tool, and when it is not. | ≥ 2 items each |
| Worked example | A small example walked through in words. | 2–6 lines |
| Pitfalls | Mistakes people make with it. | ≥ 2 items |
| Watch it run | A button to step 1 of the trace. | Always present |

### Navigation

- A first visit (`#/`) opens the Foundations guide instead of the first lesson. The guide is where someone who knows nothing should start.
- In the explorer, a lesson the learner has not started links to its theory tab. A lesson they have started or finished links to step 1 of the trace, as now. Both tabs are always one click apart.
- Deep links keep working: `#/stack/5` still opens step 5 of the trace.
- Search (Ctrl+K) also finds guides, as "<Section> guide".
- Guides and theory tabs do not count toward progress. Progress stays a measure of steps traced.

## Writing rules

These rules apply to every guide and theory. Tests check the mechanical ones; the final review checks the rest.

1. **Write for someone who knows nothing about the topic.** Assume they can read a `for` loop and an array in any language, and nothing else.
2. **Define a word before you use it.** Any term that is not everyday English appears in the guide's Key terms, or is defined in the same sentence where it first appears.
3. **Short sentences.** At most 25 words per sentence, and at most 80 words per paragraph. (Tested.)
4. **No talking down.** The words "simply", "obviously", "clearly", "just", "trivial", "trivially" and "easy" are banned. (Tested.)
5. **Concrete before abstract.** Show a small example before the general rule.
6. **Every claim is true.** Complexities are the standard worst-case bounds unless the text says "average" or "amortized". No claim in theory may contradict the lesson's `costs`.
7. **Plain markup only.** Text may use `` `code` ``, `**bold**`, and links `[[lesson-id]]` or `[[guide:section-id]]`, with an optional label after `|`. Every link must resolve. (Tested.)
8. **Same voice as the trace.** Second person, present tense, no exclamation marks. (The exclamation-mark ban is tested.)

## Design

The guide and theory pages are reading surfaces inside the existing debugger shell, and they follow the CLAUDE.md design rules:
- JetBrains Mono, with body prose at 14px, line height 1.65 and a measure of about 70 characters.
- Each part sits under a `.pane-title`-style label.
- Tables use hairline rules.
- The cheat sheet is the one table that gets `--surface-2` row striping.
- Colour comes from tokens only, and no unicode glyph is used as an icon.

**Pictures, not only prose.**
- How it works is a walkthrough: each step names a trace step of the default run (`shots`), and the lesson's own scene shows that step beside the list.
- Every cost has a growth meter.
- A guide's cheat sheet is followed by a chart of the growth curves.
- Lessons here shows a thumbnail of each lesson's scene.
- Use/avoid lists, pitfalls and tips carry state marks.

**Folder colours.** Each explorer folder has its own hue, one per section, so the course reads as ten distinct topics at a glance:
- The folder icon is filled with the section's hue, and its outline stays ink.
- The open folder's nested list gets a 1px indent guide in the same hue.
- The guide page's crumb shows a small swatch of it.

The hues are tokens `--sec-01` … `--sec-10`, with light and dark values. They are muted fills in the slab family, so they are decorative and never carry text; the ink outline and the label hold contrast. This is the one place colour marks identity instead of state, and CLAUDE.md's design rules say so.

The explorer's `README.md` entry uses a document icon. When the current page is a guide, its entry shows the 2px signal bar. Below 1120px the guide is one column, the same as lessons.

## Out of scope for now

- Quizzes and "predict the next step" (cycle 2).
- Printing or exporting cheat sheets.
- Guides for sections 06–10. Each one ships with its milestone. The contract test makes a guide required as soon as a section has a live lesson.

# Readable camera and a slimmer trace header

## Why

The scene camera fitted the whole drawing on every step. Long runs grew past the stage and shrank. That covers tries, graphs with a strip, merge sort and two-sum's map. On a 959×333 desktop stage they went as low as 0.55×, where the 11px scene labels render at about 6px. That is hard to read across a long session.

## What changed

- **Slim trace header.** On the trace tab, the lesson head is one 31px bar: title, the meta line and the theory/trace tabs. It was about 150px. The crumb and subtitle stay on the theory tab, and the freed height goes to the stage.
- **Readable floor.** `LessonPage` gives the scene a lens, `{ floor: 0.85, read: 1 }`. If fitting the whole drawing would need less than 0.85 px per scene unit, the camera reads at 1× on the step's focus instead. The focus always fits whole: a focus too big for 1× pulls the scale down, but never below the whole-fit scale. The camera crops only when the close-up is at least 1.2× bigger than the whole picture; for smaller gains it keeps everything in view.
- **Focus.** For each step, `SceneFit` measures the focus as well as the bounds. The focus is the union of active, compare and swap cells, lit edges, live pointers and windows. A step with none of those uses its found cells. The close-up centres on the focus and stays inside the drawing, so no empty floor shows.
- **Calm follow.** `follow` still holds the shot while what matters fits, and pans as little as it can. Once the view is cropped, it keeps about 40 units of margin round the focus.
- **The diagram never lies.**
  - A muted chevron marks each edge where the drawing continues past the frame.
  - A **Show all** toggle appears in the stage controls only when the lens crops. Its pressed state uses the inverted style.
  - The F key toggles it too, and the choice is remembered in `tracepoint-whole`.
- Walkthroughs and guide thumbnails set no lens, so they still fit everything.

## Measured before

Lowest fit scale in each run, on a 959×333 stage:

| Lesson | Lowest scale |
|---|---|
| trie, autocomplete | 0.55 |
| frequency-map | 0.64 |
| graph lessons | 0.67–0.68 |
| fast-and-slow | 0.69 |
| merge-sort | 0.70 |
| binary-search | 0.74 |
| prefix-sums | 0.77 |

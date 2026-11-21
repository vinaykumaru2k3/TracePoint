import type { LessonTheory } from "../../theory/types";

const theory: LessonTheory = {
  definition:
    "A queue is a collection where items join at the back, or rear, and leave from the front. The item that waited longest leaves first, which is called FIFO (first in, first out).",
  analogy:
    "Think of a line at a ticket desk. New people join at the back. The clerk serves whoever is at the front, and nobody cuts in.",
  steps: [
    "The queue keeps an array of `cap` slots, an index `head` for the front item, and a count `size`. Both start at 0.",
    "To enqueue `x`, called `offer` here, check that `size` is below `cap`. Write `x` into slot `(head + size) % cap`, then add 1 to `size`.",
    "The `%` (remainder) makes the index wrap. Past the last slot, the next write lands in slot 0. That ring is called a circular buffer.",
    "To dequeue, called `poll` here, return null if `size` is 0. Otherwise read `data[head]`, move `head` to `(head + 1) % cap`, and subtract 1 from `size`.",
    "To peek, return `data[head]` without changing anything, or null if the queue is empty."
  ],
  ops: [
    ["`offer(x)`", "O(1)", "One write at the rear. It throws if this fixed array is full."],
    ["`poll()`", "O(1)", "One read at the front. Nothing shifts. It returns null when empty."],
    ["`peek()`", "O(1)", "One read at the front."]
  ],
  useWhen: [
    "Work must be handled in the order it arrived, such as print jobs or requests.",
    "You explore something level by level, nearest first, such as a family tree one generation at a time."
  ],
  avoidWhen: [
    "The newest item should go first. Use a [[stack]].",
    "Some items are more urgent than others and must jump the line. A plain queue cannot reorder them."
  ],
  example: [
    "The queue has 4 slots. Offer 4, 9 and 2. They sit in slots 0, 1 and 2, with `head = 0` and `size = 3`.",
    "`poll()` returns 4. Now `head = 1` and `size = 2`, and nothing moves.",
    "Offer 7 into slot `(1 + 2) % 4 = 3`. Then offer 5 into slot `(1 + 3) % 4 = 0`, wrapping to the start.",
    "Polling now returns 9, 2, 7 and 5 in that order. One more poll returns null."
  ],
  pitfalls: [
    "Building a queue on a plain array by removing `a[0]`. Each removal shifts every item, costing O(n).",
    "Forgetting the `% cap` wrap. The index runs off the end of the array.",
    "Using the returned value without checking for null. An empty queue's `poll()` returns null."
  ]
};

export default theory;

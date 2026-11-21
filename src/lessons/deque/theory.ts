import type { LessonTheory } from "../../theory/types";

const theory: LessonTheory = {
  definition:
    "A deque, short for double-ended queue and said \"deck\", lets you add and remove items at both the front and the back. It can act as a stack or as a queue.",
  analogy:
    "Think of a train carriage with a door at each end. Passengers can board or leave through either door, but nobody climbs in through the middle.",
  steps: [
    "The deque keeps an array of `cap` slots used as a ring, called a circular buffer. `head` marks the front item and `size` counts the items.",
    "The back item sits in slot `(head + size - 1) % cap`, where `%` is the remainder. Moving past either end of the array wraps around.",
    "To push at the back, write into slot `(head + size) % cap` and add 1 to `size`.",
    "To push at the front, step `head` back one slot, wrapping from 0 to `cap - 1`. Write the item there and add 1 to `size`.",
    "To pop at the front, read `data[head]` and step `head` forward. To pop at the back, read the back slot. Both subtract 1 from `size`.",
    "Every operation first checks for a full or an empty deque, and throws if the check fails."
  ],
  ops: [
    ["`pushFront(x)`", "O(1)", "Moves `head` back one slot, then writes."],
    ["`pushBack(x)`", "O(1)", "Writes after the back item."],
    ["`popFront()`", "O(1)", "Reads at `head`, then moves it forward."],
    ["`popBack()`", "O(1)", "Reads the back slot. `head` stays put."]
  ],
  useWhen: [
    "You add and remove at both ends, such as keeping the maximum of a sliding window, a run of items that moves along a list.",
    "You want one structure that can serve as both a stack and a queue."
  ],
  avoidWhen: [
    "You only ever use one end. A [[stack]] or a [[queue]] says what you mean more plainly.",
    "You need to insert or read in the middle often. A deque is fast only at its ends."
  ],
  example: [
    "The ring has 6 slots and `head = 0`. Push 4 and then 9 at the back, into slots 0 and 1.",
    "Push 2 at the front. `head` wraps from 0 to 5, and 2 goes into slot 5. Push 7 at the front into slot 4.",
    "Reading from `head`, the deque is 7, 2, 4, 9.",
    "`popBack()` returns 9 and `popFront()` returns 7. Now the deque is 2, 4."
  ],
  pitfalls: [
    "Computing `head - 1` without wrapping. In many languages `-1 % 6` is -1, not 5, so add `cap` before taking the remainder.",
    "Popping from an empty deque. Check `size` first.",
    "Mixing up the ends. The back is `(head + size - 1) % cap`, not `size - 1`."
  ]
};

export default theory;

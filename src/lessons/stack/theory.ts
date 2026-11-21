import type { LessonTheory } from "../../theory/types";

const theory: LessonTheory = {
  definition:
    "A stack is a collection where you add and remove items at one end only, called the top. The last item pushed is the first one popped, which is called LIFO (last in, first out).",
  analogy:
    "Think of a pile of plates in a kitchen. You put a clean plate on top, and you take the top plate when you need one. The plate at the bottom waited longest, but it comes out last.",
  steps: [
    "The stack keeps an array of `cap` slots and an index `top`, the slot of the newest item. An empty stack has `top = -1`.",
    "To push `x`, check that `top` is below `cap - 1`. Add 1 to `top`, then write `x` into `data[top]`.",
    "To peek, check that the stack is not empty, then return `data[top]`. Nothing changes.",
    "To pop, check that the stack is not empty. Read `data[top]`, subtract 1 from `top`, and return the value you read.",
    "A popped value stays in its slot until a later push overwrites it. Only slots up to `top` count as the stack."
  ],
  ops: [
    ["`push(x)`", "O(1)", "One write and one index change. It fails if this fixed array is full."],
    ["`pop()`", "O(1)", "One read and one index change. It throws on an empty stack."],
    ["`peek()`", "O(1)", "One read. It throws on an empty stack."]
  ],
  useWhen: [
    "The newest item must be handled first, such as an undo history.",
    "You match pairs that nest, such as `(` with `)` in `(a[b])`.",
    "You need to come back to where you were, as a function call does when it returns."
  ],
  avoidWhen: [
    "Items must leave in the order they arrived. Use a [[queue]] instead.",
    "You need to read or search items in the middle. A stack only shows its top."
  ],
  example: [
    "Push 4, 9 and 2. The array is `[4, 9, 2]` and `top` is 2.",
    "`peek()` returns 2 and changes nothing.",
    "`pop()` returns 2, and `top` becomes 1. The 2 stays in slot 2 as a stale value.",
    "`pop()` returns 9. Then `push(7)` sets `top` to 1 and overwrites the stale 9 with 7.",
    "Pop twice to get 7 and 4. A third pop finds `top = -1` and throws."
  ],
  pitfalls: [
    "Popping or peeking an empty stack. Check that it is not empty first.",
    "Pushing onto a full fixed array. Check the capacity, or use a dynamic array that grows by copying, so push is O(1) amortized, meaning on average.",
    "Treating stale slots as live. Values above `top` are leftovers, not part of the stack."
  ]
};

export default theory;

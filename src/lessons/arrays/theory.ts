import type { LessonTheory } from "../../theory/types";

const theory: LessonTheory = {
  definition:
    "An array is a fixed number of slots that sit side by side in memory, each reached by its index. It keeps a `size`, the count of slots in use.",
  analogy:
    "Think of a row of numbered parking spaces, filled from space 0. You can drive straight to space 5. But to fit a car into space 2, every car from space 2 onward must move back one space first.",
  steps: [
    "The array reserves one block of memory with room for `capacity` items. `size` counts how many are in use.",
    "To read index `i`, the computer jumps to start plus `i` times the item size. That is one step for any `i`.",
    "To append, write into slot `size` and add 1 to `size`. If `size` equals the capacity, the array is full and the append fails.",
    "To insert at `i`, shift every item from `i` to the end one slot right, starting from the end. Then write the new item into slot `i`.",
    "To remove at `i`, shift every item after `i` one slot left, then subtract 1 from `size`.",
    "Reading or removing at an index outside 0 to `size - 1` is an error."
  ],
  shots: [1, 5, 4, 8, 12, 13],
  ops: [
    ["`get(i)`", "O(1)", "One address sum, then one read."],
    ["`append(x)`", "O(1)", "Writes one slot at the end, if there is room."],
    ["`insert(i, x)`", "O(n)", "Shifts up to `n` items right."],
    ["`remove(i)`", "O(n)", "Shifts up to `n - 1` items left."]
  ],
  useWhen: [
    "You read items by position often, such as the fifth score in a list.",
    "You mostly add and remove at the end."
  ],
  avoidWhen: [
    "You insert or remove near the front often. Each one shifts everything after it.",
    "You look items up by value often. Each search scans the array in O(n), while a [[hash-table-chaining|hash table]] averages O(1)."
  ],
  example: [
    "Append 3, 8 and 5. The array is `[3, 8, 5]` and `size` is 3.",
    "`get(2)` jumps to slot 2 and returns 5 in one step.",
    "`insert(1, 7)` moves 5 to slot 3, then 8 to slot 2, then writes 7 into slot 1. Now it is `[3, 7, 8, 5]`.",
    "`remove(0)` moves 7, 8 and 5 one slot left. Now it is `[7, 8, 5]` and `size` is 3."
  ],
  pitfalls: [
    "Shifting in the wrong order. An insert must copy from the end backwards, or it overwrites items before it moves them.",
    "Reading `a[size]`. The last item is at `size - 1`.",
    "Forgetting capacity. This lesson's array is fixed. A dynamic array grows by copying into a bigger block, so its append is O(1) amortized, meaning O(1) on average over many appends."
  ]
};

export default theory;

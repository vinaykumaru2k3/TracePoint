import type { LessonTheory } from "../../theory/types";

const theory: LessonTheory = {
  definition:
    "An interval is a stretch of time with a start and an end, and two intervals overlap when they share some time. A greedy method picks the largest set with no overlap by sorting on end and keeping each interval that fits.",
  analogy:
    "Picture booking meetings in one room. Each meeting has a start and an end. If you always book the meeting that ends first, the room frees up as soon as possible and leaves the most time for the others.",
  steps: [
    "Read each interval as a row. In `1-3`, the start is 1 and the end is 3, so it fills the plates for time 1 and 2. Two intervals overlap when they fill a plate in common.",
    "Sort the rows by end, earliest first. Two intervals with the same end keep their input order, which is called a stable sort, as in [[merge-sort]]. Then no later interval ends before an earlier one.",
    "Set `last end` to 0. It marks where the time taken so far stops. Nothing is taken yet, so the first interval always fits.",
    "Go down the rows in order. Take an interval when its start is at or after `last end`. Then move `last end` to that interval's end. In the default run, `1-3` is taken and `last end` becomes 3.",
    "Skip an interval that starts before `last end`. It overlaps the one taken last, so it cannot be added. Here `2-5` starts at 2, before 3, so it is skipped and `last end` stays 3.",
    "A start equal to `last end` also fits. `1-3` and `3-5` touch at time 3 but share no plate, so both are taken. Here `4-7` starts after 3 and is taken.",
    "This is safe because of an exchange argument. Suppose a best answer starts with some other interval. Swap it for the one that ends first. It ends no later, so everything after it still fits, and the count stays the same.",
    "After the last row, the number taken is the answer. Here it is 3: `1-3`, `4-7` and `8-10`."
  ],
  shots: [1, 2, 3, 4, 5, 6, 8, 10],
  ops: [
    ["sort by end", "O(n log n)", "Comparing and ordering the n intervals is the biggest cost."],
    ["scan", "O(n)", "Each interval is compared with `last end` once."],
    ["whole method", "O(n log n)", "The sort dominates the scan."]
  ],
  useWhen: [
    "You must fit the most jobs, meetings or bookings into one room or machine, where each takes a fixed stretch of time.",
    "A locally best choice, such as the earliest end, can be shown to never hurt the rest, as the exchange argument does here."
  ],
  avoidWhen: [
    "Each choice has a different value or cost. Then ending first no longer decides the best set, and a table as in [[coin-change]] is safer.",
    "You have not checked why the greedy choice is safe. For a different goal, such as the shortest interval first, the same loop can pick too few."
  ],
  example: [
    "Take `1-3, 2-5, 4-7, 1-8, 5-9, 8-10`. Sorted by end, the order stays the same because the ends are already 3, 5, 7, 8, 9 and 10.",
    "Take `1-3`. Last end is 3. Skip `2-5`, because 2 is before 3. Take `4-7`, because 4 is after 3, and last end is 7.",
    "Skip `1-8` and `5-9`, because 1 and 5 are before 7. Take `8-10`, because 8 is after 7.",
    "The answer is 3: `1-3`, `4-7` and `8-10`.",
    "Now take `1-3, 3-5`. The second starts at 3, exactly where the first ended. They touch and share no time, so both are taken."
  ],
  pitfalls: [
    "Sorting by ~~start~~ instead of end. For `0-12, 1-3, 4-6`, the first row is `0-12`, which blocks everything and gives 1. Sorting by end gives 2.",
    "Using `start > last end`. That rejects touching intervals such as `1-3` and `3-5`, which share no time and both fit.",
    "Thinking the answer lists every best set. Several sets of the same size can exist, and this method finds one of them.",
    "Forgetting the tie rule. When two intervals end at the same time, either order gives the same count, but a stable sort keeps the run repeatable."
  ]
};

export default theory;

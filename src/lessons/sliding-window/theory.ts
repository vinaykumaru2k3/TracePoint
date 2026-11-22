import type { LessonTheory } from "../../theory/types";

const theory: LessonTheory = {
  definition:
    "A sliding window is a run of `k` items in a row that moves along an array one place at a time. Here it finds the largest sum of any `k` items in a row.",
  analogy:
    "Think of a train passing a short platform. Each time it rolls forward one car, a car arrives at the front of the platform and one leaves at the back. You keep track of who is on the platform by noting who arrives and who leaves, not by recounting everyone.",
  steps: [
    "Add up the first `k` items. That sum is the first window, and also the best so far.",
    "Slide the window one place right. Add the item that enters on the right, `a[i]`.",
    "Subtract the item that leaves on the left, `a[i - k]`.",
    "If the new sum beats the best, keep it as the best.",
    "Repeat until the window reaches the end of the array, then return the best."
  ],
  shots: [4, 5, 5, 6, 8],
  useWhen: [
    "The question is about a contiguous run, such as the best total over 7 days in a row.",
    "Each item's effect can be added when it enters and taken away when it leaves."
  ],
  avoidWhen: [
    "The items you need do not have to be next to each other, such as the 3 largest values anywhere in the array.",
    "An item's effect cannot be taken away, as with the maximum of a window. Dropping the old maximum does not tell you the new one, so a [[deque]] tracks it instead."
  ],
  example: [
    "Take `[2, 1, 5, 1, 3, 2]` with `k` = 3. The first window is 2 + 1 + 5 = 8, the best so far.",
    "Slide once. Add 1 and drop 2, and the sum is 7.",
    "Slide again. Add 3 and drop 1, and the sum is 9, a new best.",
    "Slide a last time. Add 2 and drop 5, and the sum is 6. The answer is 9, from `[5, 1, 3]`."
  ],
  pitfalls: [
    "Re-adding all `k` items at every step. That costs O(n × k) and throws away the point of the window.",
    "Dropping the wrong item. The one that leaves is `a[i - k]`, not `a[i - k + 1]`.",
    "Starting the best at 0. If every number is negative, the answer is below 0, so start from the first window's sum."
  ]
};

export default theory;

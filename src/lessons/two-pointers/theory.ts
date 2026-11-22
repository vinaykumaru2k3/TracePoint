import type { LessonTheory } from "../../theory/types";

const theory: LessonTheory = {
  definition:
    "Two pointers is a technique where two indexes, `lo` and `hi`, start at the two ends of a sorted array and **move toward each other**. Here they find a pair whose sum equals a target.",
  analogy:
    "Picture a line of people sorted by height, shortest on the left. Two friends start at the two ends, looking for a pair whose heights add up to a set total. If the pair is too short, the left friend steps right. If it is too tall, the right friend steps left.",
  steps: [
    "Sort the array if it is not sorted. Sorting adds O(n log n) time, so the O(n) cost assumes sorted input. See [[guide:foundations]] for `log n`.",
    "Set `lo = 0` and `hi = n - 1`.",
    "While `lo < hi`, add `a[lo] + a[hi]`.",
    "If the sum equals the target, return `lo` and `hi`.",
    "If the sum is too small, move `lo` one step right. `a[hi]` is the largest value left, so `a[lo]` is too small with every partner.",
    "If the sum is too big, move `hi` one step left. `a[lo]` is the smallest value left, so `a[hi]` is too big with every partner.",
    "If the pointers meet, no pair exists."
  ],
  shots: [1, 2, 2, 6, 3, 2, 6],
  useWhen: [
    "The array is sorted, or you can afford to sort it, and you want a pair that meets a target.",
    "You need O(1) extra memory. Two indexes are all it uses."
  ],
  avoidWhen: [
    "The array is unsorted and you need the original indexes. Sorting moves items, so a hash map, as in [[frequency-map-and-two-sum]], fits better.",
    "The array changes between questions, so you would have to sort it again each time."
  ],
  example: [
    "Take `[1, 3, 4, 6, 8, 11]` and target 10. `lo` starts on 1 and `hi` on 11.",
    "1 + 11 = 12 is too big, so `hi` moves left to 8.",
    "1 + 8 = 9 is too small, so `lo` moves right to 3.",
    "3 + 8 = 11 is too big, so `hi` moves left to 6.",
    "3 + 6 = 9 is too small, so `lo` moves right to 4. Now 4 + 6 = 10, and it returns indexes 2 and 3."
  ],
  pitfalls: [
    "Running it on unsorted data. The moves rely on order, so they can skip past the answer.",
    "Quoting O(n) when you had to sort first. The sort costs O(n log n), so the whole job is O(n log n).",
    "Looping while ~~`lo <= hi`~~. Then both pointers can land on one item and count it twice.",
    "Moving both pointers at once. Move only the one the comparison rules out."
  ]
};

export default theory;

import type { LessonTheory } from "../../theory/types";

const theory: LessonTheory = {
  definition:
    "Quick sort picks one value, the pivot, and moves smaller values to its left and the rest to its right. It then sorts each side the same way.",
  analogy:
    "Think of sorting a class by height around one student. Everyone shorter stands to their left, and everyone else to their right. That student is now in the right spot for good. Then each group repeats the trick with a student of its own.",
  steps: [
    "This is divide and conquer: split a problem into smaller parts and solve each part the same way.",
    "For a range `lo..hi`, take the last value `a[hi]` as the pivot. This is Lomuto's partition scheme.",
    "To partition is to rearrange the range around the pivot. Index `i` marks the end of the left part, the values smaller than the pivot. It starts one cell before `lo`.",
    "Walk `j` from `lo` to `hi - 1`. When `a[j]` is smaller than the pivot, move `i` right by one and swap `a[i]` and `a[j]`, exchanging the two values.",
    "Swap the pivot into index `i + 1`. Everything left of it is smaller and nothing right of it is, so the pivot is final.",
    "Sort the left side and the right side by calling the same function. A function calling itself is recursion. A range of one value or none is already sorted."
  ],
  ops: [
    ["best and average case", "O(n log n)", "A pivot near the middle halves the range, giving about log₂ n levels. log₂ n counts the halvings that take n down to 1. Each level partitions n values."],
    ["worst case", "O(n²)", "If every pivot is the largest or smallest value, each partition peels off one value. n levels then cost n(n − 1)/2 comparisons. Sorted input does this here."],
    ["extra space", "O(log n) stack on average, O(n) worst", "Partitioning swaps inside the array. The call stack, the memory for calls not yet returned, is as deep as the levels."],
    ["stable", "no", "Stable means equal values keep their order. Long swaps can carry a value past an equal one."]
  ],
  useWhen: [
    "You want a fast in-place sort for a large array in random order. In place means inside the array, with no buffer.",
    "Stability does not matter, such as when sorting plain numbers."
  ],
  avoidWhen: [
    "The input may be sorted already and the pivot is the last value. Every partition is then lopsided, and time becomes O(n²).",
    "You need a guaranteed O(n log n), or a stable sort. Use [[merge-sort]]."
  ],
  example: [
    "Sort [5, 1, 4, 2, 8, 3]. The pivot is 3. 1 and 2 are smaller, so they swap to the front: [1, 2, 4, 5, 8, 3].",
    "3 swaps into index 2 and is final. The left side is [1, 2], and the right side is [5, 8, 4].",
    "The left side partitions around 2, which stays at index 1.",
    "The right side partitions around 4, which lands at index 3. Then [8, 5] partitions around 5, which lands at index 4.",
    "That took 9 comparisons and 5 swaps. Sorted input of 6 values would take 15 comparisons, the worst case."
  ],
  pitfalls: [
    "Always taking the last value as the pivot on sorted input. Pick a random value, or the middle of three, to avoid the O(n²) case.",
    "Ignoring stack depth. Lopsided splits make the call stack O(n) deep, and it can overflow, running out of room. Recurse into the smaller side and loop over the larger one to cap it at O(log n).",
    "Putting the pivot back into a side's range. The pivot is final, so the sides are `lo..p - 1` and `p + 1..hi`. Otherwise a range may never shrink."
  ]
};

export default theory;

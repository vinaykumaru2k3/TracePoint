import type { LessonTheory } from "../../theory/types";

const theory: LessonTheory = {
  definition:
    "Merge sort splits an array in half, sorts each half the same way, then merges the two sorted halves into one. To merge is to combine two sorted runs, stretches of values already in order, by taking the smaller front value again and again.",
  analogy:
    "Picture two piles of exam papers, each in name order. To combine them, you look at the top paper of each pile and take the one that comes first. Repeat until both piles are empty. Merge sort makes such piles by splitting the stack until each pile holds one paper.",
  steps: [
    "This is divide and conquer: split a problem into smaller parts, solve each part the same way, then combine the answers.",
    "Split the range `l..r` at `mid = (l + r) / 2`, rounded down. Sort `l..mid` and `mid + 1..r` by calling the same function. A function calling itself is recursion.",
    "A range of one value is already sorted. That is the base case, where the recursion stops.",
    "To merge, compare the two front values, called heads. Copy the smaller one into `tmp`, a buffer: a separate array as long as the range.",
    "On a tie, take the left head. Equal values then keep their order, so merge sort is stable.",
    "When one half runs out, copy the rest of the other. Then copy `tmp` back over `a[l..r]`."
  ],
  ops: [
    ["time, every case", "O(n log n)", "Halving n gives about log₂ n levels of splits, where log₂ n counts the halvings that take n down to 1. Each level merges all n values once."],
    ["extra space", "O(n)", "The merge needs a buffer as long as its range, up to n values. The call stack, the memory for calls not yet returned, adds O(log n)."],
    ["stable", "yes", "Taking the left head on a tie keeps equal values in their first order."]
  ],
  useWhen: [
    "You need a stable sort, such as ordering rows by one column after another.",
    "You need O(n log n) on every input, with no bad case.",
    "The data is too big for memory. Merging reads each sorted run in order from front to back, so runs can stream from disk."
  ],
  avoidWhen: [
    "Memory is tight. The O(n) buffer doubles the space a large array needs.",
    "The array is small. The calls and copying cost more than [[insertion-sort]] on a few values."
  ],
  example: [
    "Sort [5, 1, 4, 2, 8, 3]. Split it into [5, 1, 4] and [2, 8, 3], then [5, 1] and [4], then [5] and [1].",
    "Merge [5] and [1] into [1, 5]. Then merge [1, 5] and [4] into [1, 4, 5].",
    "The right half splits the same way. [2] and [8] merge into [2, 8], then [2, 8] and [3] merge into [2, 3, 8].",
    "The last merge compares heads 1 and 2, 4 and 2, 4 and 3, 4 and 8, then 5 and 8. 8 is copied last.",
    "That took 11 comparisons and 16 writes into `tmp` for 6 values."
  ],
  pitfalls: [
    "Using `<` instead of `<=` in the merge. On a tie it takes the right head, and the sort is no longer stable.",
    "Forgetting to copy the leftover values when one half runs out. They are lost from the result.",
    "Making a new buffer in every merge, as this lesson does for clarity, costs extra time. Faster versions make one buffer of size n and reuse it."
  ]
};

export default theory;

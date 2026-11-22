import type { LessonTheory } from "../../theory/types";

const theory: LessonTheory = {
  definition:
    "Insertion sort grows a sorted part at the front of the array. It takes each next value, the key, and slides it left past every bigger value into its place.",
  analogy:
    "Think of sorting playing cards as you pick them up. The cards in your hand are always in order. Each new card slides left past the higher cards until it meets one that is not higher. Then it drops into the gap.",
  steps: [
    "The first value alone is a sorted prefix, a front part of the array that is in order.",
    "For each `i` from 1, lift `a[i]` out into `key`. Its cell becomes a gap.",
    "Compare `key` with the value left of the gap. If that value is bigger, shift it one cell right, so the gap moves left.",
    "Stop at a value that is not bigger than `key`, or at the front. Drop `key` into the gap.",
    "Now `a[0..i]` is sorted. Equal values never pass each other, so the sort is stable: equal values keep their order."
  ],
  shots: [2, 2, 4, 5, 10],
  ops: [
    ["best case", "O(n)", "On sorted input, each key stops after one comparison, so there are n − 1 comparisons in all."],
    ["average and worst case", "O(n²)", "Each key may shift past every value before it. Reversed input shifts all of them, n(n − 1)/2 shifts in total."],
    ["extra space", "O(1)", "It sorts in place: inside the array, with one variable holding the key."],
    ["stable", "yes", "A key stops at the first value that is not bigger, so it never passes an equal one."]
  ],
  useWhen: [
    "The array is small, up to a few dozen values. It does so little extra work per value that it beats the O(n log n) sorts there. Libraries use it for short stretches of an array.",
    "The input is nearly sorted, such as a sorted list with a few new values at the end. Each key moves only a short way.",
    "You need a sort that is both stable and in place."
  ],
  avoidWhen: [
    "The array is large and in random order. The O(n²) shifts add up fast, so use [[merge-sort]] or [[quick-sort]].",
    "Each value is a large record that is slow to copy. Each shift copies one, and the worst case makes O(n²) of them."
  ],
  example: [
    "Sort [5, 1, 4, 2, 8]. Lift 1. 5 is bigger, so it shifts right, and 1 drops into index 0: [1, 5].",
    "Lift 4. 5 shifts right, then 1 is not bigger, so 4 drops into index 1: [1, 4, 5].",
    "Lift 2. 5 and 4 shift right, then 2 drops in after 1: [1, 2, 4, 5].",
    "Lift 8. 5 is not bigger, so 8 goes back to index 4 after one comparison.",
    "That took 7 comparisons and 8 writes. Sorted input would take 4 comparisons, one per key."
  ],
  pitfalls: [
    "Overwriting the key. Save `a[i]` in `key` before shifting, or the first shift destroys it.",
    "Testing `a[j] >= key`. Equal values then shift past each other, and the sort is no longer stable.",
    "Forgetting the `j >= 0` check. A key smaller than everything walks off the front of the array."
  ]
};

export default theory;

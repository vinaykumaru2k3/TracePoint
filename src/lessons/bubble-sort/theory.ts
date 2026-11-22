import type { LessonTheory } from "../../theory/types";

const theory: LessonTheory = {
  definition:
    "Bubble sort orders an array by **comparing neighbours** and swapping, exchanging, any pair that is out of order. It repeats these passes until one makes no swaps.",
  analogy:
    "Picture people lining up by height, where each person may only trade places with the one next to them. Walk down the line and swap any taller person standing before a shorter one. After one walk, the tallest person has reached the end. Repeat until a walk changes nothing.",
  steps: [
    "A pass is one walk through the array from index 0, comparing each pair `a[j]` and `a[j + 1]`.",
    "If `a[j] > a[j + 1]`, swap them. The bigger value moves one step right, and keeps moving while it meets smaller ones.",
    "After pass 1 the largest value sits at the end. After pass k, the last k cells are final, so the next pass stops earlier.",
    "Track whether a pass swapped anything. A pass with no swaps proves every pair is in order, so the sort stops early.",
    "Equal neighbours are never swapped, so equal values keep their order. That makes bubble sort stable."
  ],
  shots: [3, 4, 10, 20, 21],
  ops: [
    ["best case", "O(n)", "On sorted input, pass 1 makes n − 1 comparisons and no swaps, and the early exit ends the sort."],
    ["average and worst case", "O(n²)", "Up to n − 1 passes of up to n − 1 comparisons each. Reversed input is the worst, with n(n − 1)/2 comparisons and as many swaps."],
    ["extra space", "O(1)", "It sorts in place: inside the array, with one temporary value for the swap and a flag."],
    ["stable", "yes", "It swaps only when the left value is strictly bigger, so equal values never pass each other."]
  ],
  useWhen: [
    "You are learning how sorting works. Every move is a visible swap of two neighbours.",
    "The array is tiny or almost sorted, and you want the shortest code. The early exit makes sorted input cost O(n)."
  ],
  avoidWhen: [
    "The array holds more than a few dozen values. O(n²) grows fast: 1,000 reversed values take 499,500 comparisons.",
    "You want a simple O(n²) sort for real use. [[insertion-sort]] is usually faster on the same input, since it shifts values instead of swapping them."
  ],
  example: [
    "Sort [5, 1, 4, 2, 8]. In pass 1, 5 swaps past 1, 4 and 2, giving [1, 4, 2, 5, 8]. 5 and 8 are in order, so 8 is final at index 4.",
    "Pass 2 compares up to index 3. Only 4 and 2 swap, giving [1, 2, 4, 5, 8], and 5 is final at index 3.",
    "Pass 3 finds 1, 2 and 4 in order and makes no swaps, so the sort stops early.",
    "That took 9 comparisons and 4 swaps. Without the early exit, a fourth pass would add one more comparison."
  ],
  pitfalls: [
    "Forgetting the swapped flag. Without it, sorted input still takes O(n²) comparisons.",
    "Comparing with ~~`>=`~~ instead of `>`. Equal neighbours then swap, and the sort is no longer stable.",
    "Letting each pass run to the end. The last cells are already final, so the inner loop should stop at `n - 1 - i`."
  ]
};

export default theory;

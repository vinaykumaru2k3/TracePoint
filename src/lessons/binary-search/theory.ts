import type { LessonTheory } from "../../theory/types";

const theory: LessonTheory = {
  definition:
    "Binary search finds a target in a sorted array, one in order from smallest to largest. It checks the middle of a range, then keeps only the half that can still hold the target.",
  analogy:
    "Think of guessing a number from 1 to 100 when you are told higher or lower. You guess 50 first. Each answer rules out half of the numbers left. Seven guesses are always enough, because seven halvings take 100 down to 1.",
  steps: [
    "The array must be sorted. This lesson sorts unsorted input first.",
    "Keep two indices, `lo` and `hi`, around the cells that could still hold the target. Start with `lo = 0` and `hi = n - 1`.",
    "While `lo <= hi`, set `mid = lo + (hi - lo) / 2`, the middle of the range, rounded down.",
    "If `a[mid]` equals the target, return `mid`.",
    "If `a[mid]` is smaller, every cell left of `mid` is smaller too, so set `lo = mid + 1`. If it is bigger, set `hi = mid - 1`.",
    "If `lo` passes `hi`, the range is empty and the target is absent, so return -1."
  ],
  ops: [
    ["best case", "O(1)", "The first middle cell holds the target."],
    ["average and worst case", "O(log n)", "Each probe, one look at a middle cell, halves the range. log₂ n, the logarithm, counts how many halvings take n down to 1. So about log₂ n + 1 probes always suffice."],
    ["extra space", "O(1)", "Only `lo`, `mid` and `hi` are kept."],
    ["sort first", "O(n log n)", "Needed only if the data is not sorted yet. It pays off when you search the same data many times."]
  ],
  useWhen: [
    "The data is sorted, or you sort it once and then search it many times.",
    "The data is large. Doubling n adds only one probe, so a million values need about 20."
  ],
  avoidWhen: [
    "The data is unsorted and you search it once. Sorting costs O(n log n), more than one O(n) [[linear-search]].",
    "Values are added often. Keeping the array sorted costs O(n) shifts per insert. A hash set, a table that finds a key in about one step on average, fits better. See [[guide:hashing]]."
  ],
  example: [
    "Search [1, 3, 4, 6, 8, 11, 14, 17] for 14. Start with lo = 0 and hi = 7.",
    "mid = 3 holds 6, less than 14. Everything left of it is smaller too, so lo becomes 4.",
    "The range is [4, 7], so mid = 5 holds 11. That is still less than 14, so lo becomes 6.",
    "The range is [6, 7], so mid = 6 holds 14. The search returns 6 after 3 probes.",
    "Linear search would have needed 7 checks. With 16 values, binary search needs at most one probe more than with 8."
  ],
  pitfalls: [
    "Running it on unsorted data. It returns wrong answers with no error, because dropping a half is safe only when the data is sorted.",
    "Writing `lo = mid` or `hi = mid` instead of `mid + 1` and `mid - 1`. The range can stop shrinking, and the loop never ends.",
    "Using `lo < hi` as the loop test. A range of one cell is then never checked.",
    "Computing `(lo + hi) / 2` with fixed-size integers. On huge arrays the sum can overflow, going past the largest value the type holds. `lo + (hi - lo) / 2` avoids that."
  ]
};

export default theory;

import type { LessonTheory } from "../../theory/types";

const theory: LessonTheory = {
  definition:
    "Counting sort orders small whole numbers **without comparing them**. It counts how often each value appears, then writes each value back that many times, smallest first.",
  analogy:
    "Think of sorting a pile of coins by value. You never compare one coin with another. You drop each coin into the tray for its value. Then you empty the trays in order, smallest value first.",
  steps: [
    "Find the largest value, `max`. Make an array `count` with one counter for every value from 0 to `max`, all zero.",
    "Read the array once. For each value `v`, add 1 to `count[v]`.",
    "Walk `count` from 0 upward. Write each value `v` into the array `count[v]` times.",
    "No value is ever compared with another. A comparison asks which of two values is smaller, and sorts built on comparisons cannot beat O(n log n) in the worst case.",
    "This version writes fresh values instead of moving the original items. So stability, keeping equal items in their first order, does not apply here."
  ],
  shots: [2, 3, 8, 11, 13],
  ops: [
    ["time, every case", "O(n + k)", "Here k is the largest value plus 1, the number of counters. Counting reads n values, and writing back walks k counters and writes n values."],
    ["extra space", "O(k)", "The count array has one slot per possible value, however few values there are."],
    ["stable", "n/a", "It rewrites values instead of moving records, items that carry other data along with the number. A version that moves whole records, placing each by a running total per value, can be stable."]
  ],
  useWhen: [
    "Values are whole numbers from a small range, such as ages, grades or digits 0 to 9.",
    "There are many values but a small range. Then O(n + k) beats O(n log n)."
  ],
  avoidWhen: [
    "The range is wide. Sorting [9, 0, 5] needs 10 counters for 3 values, and values up to a million need a million counters.",
    "Values are not small whole numbers, such as names or decimals. They cannot index the count array directly."
  ],
  example: [
    "Sort [3, 1, 2, 3, 0]. The largest value is 3, so `count` has 4 slots, 0 to 3.",
    "Reading the array gives `count = [1, 1, 1, 2]`: one 0, one 1, one 2 and two 3s.",
    "Walk the counters. Write 0, 1 and 2 once each, then 3 twice, giving [0, 1, 2, 3, 3].",
    "That took 0 comparisons: 5 values counted, then 5 written. Here k is 4, one counter for each value from 0 to 3."
  ],
  pitfalls: [
    "Using it on negative numbers as written. `count[-1]` is not a valid slot, so shift every value by the smallest one first.",
    "Sizing `count` as ~~`max`~~ instead of `max + 1`. The slot for the largest value is then missing.",
    "Choosing it for a wide range of values. The count array then costs far more memory and time than the values themselves."
  ]
};

export default theory;

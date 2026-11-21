import type { LessonTheory } from "../../theory/types";

const theory: LessonTheory = {
  definition:
    "Selection sort fills each position from the left with the smallest value still unsorted. It scans for that value, then swaps it into place, exchanging the two values.",
  analogy:
    "Picture sorting a hand of cards spread face up on a table. You scan every card for the lowest one and put it first in your hand. Then you scan the cards left for the next lowest. Each pick needs a look at every card still on the table.",
  steps: [
    "Think of the array as a sorted part on the left, empty at first, and an unsorted part on the right.",
    "For position `i`, assume `a[i]` is the smallest. Keep its index in `min`.",
    "Compare every later value with `a[min]`. When one is smaller, set `min` to its index. Nothing moves yet.",
    "After the scan, swap `a[i]` and `a[min]`. Skip the swap if `min` is still `i`.",
    "Position `i` is now final. Repeat for `i + 1` until one value is left, which must be the largest."
  ],
  ops: [
    ["comparisons, every case", "O(n²)", "Round i compares every value after it. That is n(n − 1)/2 comparisons on any input, even sorted input."],
    ["swaps", "at most n − 1", "At most one swap per round, the fewest of the simple sorts."],
    ["extra space", "O(1)", "It sorts in place: inside the array, with two indices."],
    ["stable", "no", "Stable means equal values keep their order. A long swap can jump a value past an equal one: [3, 1, 3, 2] moves the first 3 behind the second."]
  ],
  useWhen: [
    "Writes are expensive, such as on flash memory, the storage in phones that wears out a little with each write. Selection sort makes at most n − 1 swaps.",
    "The array is small and you want a fixed cost that does not depend on the input."
  ],
  avoidWhen: [
    "The input may be sorted or nearly sorted. Selection sort still makes every comparison, while [[insertion-sort]] would take O(n).",
    "You need a stable sort, such as sorting rows by one column after another. Use insertion sort or [[merge-sort]]."
  ],
  example: [
    "Sort [5, 1, 4, 2, 8]. For position 0, the scan finds 1 at index 1, and 4, 2 and 8 are not smaller. 1 swaps with 5, giving [1, 5, 4, 2, 8].",
    "For position 1, the minimum moves from 5 to 4, then to 2. 2 swaps with 5, giving [1, 2, 4, 5, 8].",
    "For positions 2 and 3, the values 4 and 5 are already the smallest left, so no swap happens.",
    "That took 10 comparisons and 2 swaps. Sorted input of 5 values would still take 10 comparisons."
  ],
  pitfalls: [
    "Swapping each time a smaller value turns up during the scan. That makes many swaps per round. Remember only the index, and swap once at the end.",
    "Expecting it to be stable. Equal values can change order, so do not use it to sort by a second column.",
    "Expecting sorted input to be faster. The comparisons do not depend on the order, so it is O(n²) in every case."
  ]
};

export default theory;

import type { LessonTheory } from "../../theory/types";

const theory: LessonTheory = {
  definition:
    "Linear search checks the cells of an array **one at a time from the left**, and stops at the first cell that equals the target. It returns that cell's index, or -1 if no cell matches.",
  analogy:
    "Think of looking for your keys in a row of coat pockets. You have no idea which pocket holds them, so you check each pocket in turn. You stop as soon as you feel the keys. If the last pocket is empty too, they are not there.",
  steps: [
    "Start at index 0, the first cell of the array.",
    "Compare `a[i]` with the target. A comparison asks whether two values are equal, or which one is smaller.",
    "If they are equal, return `i`. Cells after it are never looked at.",
    "If not, move on to `i + 1` and compare again.",
    "If `i` passes the last cell, every cell was checked and none matched, so return -1."
  ],
  shots: [2, 2, 5, 3, 5],
  ops: [
    ["best case", "O(1)", "The target is in the first cell, so one check finds it."],
    ["average case", "O(n)", "If the target is equally likely in any cell, the search checks about n / 2 cells. Dropping the constant leaves O(n)."],
    ["worst case", "O(n)", "The target is last or absent, so all n cells are checked. Proving a value is absent always costs the most."],
    ["extra space", "O(1)", "One index `i` is all it keeps. The array is only read, never changed."]
  ],
  useWhen: [
    "The data is not sorted, and you search it only once or a few times. Sorting it first would cost more than the searches.",
    "The array is small. A handful of checks costs less than any setup.",
    "You need the first match from the left, such as the earliest entry in a list of events."
  ],
  avoidWhen: [
    "You search the same large array many times, and it is sorted, in order from smallest to largest. [[binary-search]] needs about log₂ n checks, the number of halvings that take n down to 1.",
    "You need fast lookups by key. A hash set, a table that finds a key in about one step on average, fits better. See [[guide:hashing]]."
  ],
  example: [
    "Search [7, 3, 9, 4, 1, 8] for 4. Compare a[0] = 7 with 4. They differ, so move on to index 1.",
    "a[1] = 3 and a[2] = 9 are not 4 either.",
    "a[3] = 4 matches, so the search returns 3. It took 4 of the 6 possible checks.",
    "Cells 4 and 5 are never looked at. A target of 5 would check all 6 cells, then return -1."
  ],
  pitfalls: [
    "Returning -1 inside the loop on the first miss. Return -1 only after the loop has checked every cell.",
    "Reading past the end. The loop must stop at index n − 1, the last cell.",
    "Expecting the last match. Searching from the left returns the first one, so [2, 8, 4, 5, 5, 1] with target 5 returns 3."
  ]
};

export default theory;

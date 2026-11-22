import type { LessonTheory } from "../../theory/types";

const theory: LessonTheory = {
  definition:
    "A binary heap is a complete binary tree stored in an array. In a min-heap, **every parent is no larger than its children**, so the smallest item always sits at index 0.",
  analogy:
    "Think of a hospital waiting room. Patients do not sit in a sorted line, but the most urgent one is always called next. When someone new arrives, they move ahead only of the people less urgent than them.",
  steps: [
    "The tree is complete: every level is full except the last, which fills from the left. That is why it fits in an array with no gaps.",
    "For the item at index i, the children are at `2i + 1` and `2i + 2`, and the parent is at `(i - 1) / 2`, rounded down.",
    "Push puts the new item in the first free slot, at the end of the array. The tree stays complete.",
    "Then sift up: while the item is smaller than its parent, swap them. It stops when the parent is no larger, or at the root.",
    "Pop takes the root, the smallest item. The last item moves into the root's place, so the tree stays complete.",
    "Then sift down: swap the item with its smaller child while that child is smaller. It stops when both children are larger, or at a leaf."
  ],
  shots: [7, 9, 10, 13, 16, 17],
  ops: [
    ["peek at the smallest", "O(1)", "It is always at index 0."],
    ["push", "O(log n)", "Sift-up climbs at most one path, and a complete tree has about log₂ n levels."],
    ["pop", "O(log n)", "Sift-down falls at most one path."],
    ["build from n items", "O(n)", "Sifting down every parent, last one first, costs less than n pushes. [[heap-sort]] uses this."]
  ],
  useWhen: [
    "You need the smallest or the largest item again and again while items keep arriving. This is a priority queue.",
    "You need the k smallest of many items. Keep a heap of size k and push or pop as items stream past."
  ],
  avoidWhen: [
    "You need to search for an arbitrary item. A heap has no order between siblings, so a search may check every slot.",
    "You need all the items in sorted order at once. Sorting the array is simpler. See [[guide:sorting]]."
  ],
  example: [
    "Push 5, 3, 8, 1. Each new item starts at the end. 3 swaps up past 5. 1 swaps past 5, then past 3, to reach the root.",
    "The array is now [1, 3, 8, 5]. 1 is at index 0, and its children at indexes 1 and 2 are 3 and 8.",
    "Pop takes 1. The last item, 5, moves to the root. Its children are 3 and 8, and 3 is smaller than 5, so they swap.",
    "The array is [3, 5, 8]. The smallest item left, 3, is on top again."
  ],
  pitfalls: [
    "Expecting the array to be sorted. Only each parent and its children are in order. [1, 3, 2, 5, 4] is a valid min-heap.",
    "Swapping with the ~~larger child~~ during a min-heap sift-down. The smaller child must move up, or it ends up below a larger parent.",
    "Removing the root by shifting every item left. That costs O(n) and breaks the parent and child positions. Move the last item up instead.",
    "Popping an empty heap. Check the size first, or handle the empty result."
  ]
};

export default theory;

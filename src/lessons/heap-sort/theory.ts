import type { LessonTheory } from "../../theory/types";

const theory: LessonTheory = {
  definition:
    "Heap sort turns the array into a max-heap, then **moves the largest item to the end, again and again**. The heap shrinks from the right while a sorted tail grows in its place.",
  analogy:
    "Think of picking a team captain by tournament. The winner leaves, and a quick replay among the remaining players finds the next winner. Each round names the next largest player, without a full rematch.",
  steps: [
    "A max-heap is a complete tree in an array where every parent is at least as large as its children. The largest item is at index 0.",
    "Build the heap in place. Leaves are already heaps of one item, so sift down each parent, starting from the last one and moving back to the root.",
    "Sift-down swaps an item with its larger child while that child is larger. It stops when the item is no smaller than both children.",
    "Swap a[0], the largest item left, with the last item of the heap. That item is now in its final place, and the heap is one shorter.",
    "Sift the new root down inside the smaller heap. The next largest item rises to index 0.",
    "Repeat until the heap has one item. The whole array is then sorted."
  ],
  shots: [2, 3, 5, 7, 8, 17],
  ops: [
    ["time, every case", "O(n log n)", "n - 1 rounds, each with one sift-down of O(log n)."],
    ["build the heap", "O(n)", "Most nodes sit near the bottom, where a sift-down is short."],
    ["extra space", "O(1)", "The heap and the sorted tail share the input array."],
    ["stable", "no", "Long-distance swaps can reorder equal items."]
  ],
  useWhen: [
    "You need a guaranteed O(n log n) sort that uses no extra memory.",
    "You want a fallback for another sort. C++ `std::sort` is usually introsort, which switches to heap sort when quick sort recurses too deep."
  ],
  avoidWhen: [
    "Equal items must keep their order. Use a stable sort such as [[merge-sort]].",
    "Speed in practice matters most. [[quick-sort]] is usually faster, because it reads memory in order and heap sort jumps around."
  ],
  example: [
    "Sort [5, 1, 4, 2, 8, 3]. The last parent is index 2, holding 4. It is larger than its child 3, so nothing moves.",
    "At index 1, 1 swaps with its larger child, 8. At the root, 5 swaps with 8. The heap is [8, 5, 4, 2, 1, 3].",
    "Swap 8 with the last item, 3. 8 is now in place at a[5]. 3 sifts down past 5, and the heap is [5, 3, 4, 2, 1].",
    "After four more rounds the array is [1, 2, 3, 4, 5, 8]."
  ],
  pitfalls: [
    "Building a ~~min-heap~~ to sort smallest first. The root goes to the end each round, so a min-heap sorts the array largest first.",
    "Sifting down past the end of the heap. Children at index `end` and beyond belong to the sorted tail. Pass the heap size to sift-down.",
    "Building the heap by pushing items one by one. It works, but costs O(n log n). Sifting down from the last parent costs O(n).",
    "Starting the build at index 0. A parent can be sifted down only when its subtrees are heaps already, so go from the last parent backwards."
  ]
};

export default theory;

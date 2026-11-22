import type { LessonTheory } from "../../theory/types";

const theory: LessonTheory = {
  definition:
    "A singly linked list is a chain of nodes, small objects that each hold a value and a `next` pointer to the following node. The list keeps `head`, the first node, and here also `tail`, the last.",
  analogy:
    "Think of a treasure hunt. Each clue tells you where the next clue is hidden. To reach the fifth clue, you must follow the first four. Adding a new first clue only needs it to point at the old first one.",
  steps: [
    "Each node has a value and `next`, a pointer (a reference to where another object lives). The last node's `next` is null, which means it points at nothing.",
    "To add at the front, make a node, set its `next` to `head`, then move `head` to the new node.",
    "To add at the end, set `tail.next` to the new node, then move `tail`. An empty list sets both `head` and `tail` to it.",
    "To search for a value, start a pointer `cur` at `head`. Follow `next` one node at a time until you find it or reach null.",
    "To delete a value, walk with `prev` one node behind `cur`. When `cur` holds the value, set `prev.next` to `cur.next`, skipping it.",
    "If the deleted node is the head, move `head` forward instead. If it is the tail, move `tail` back to `prev`."
  ],
  shots: [3, 9, 6, 14, 19, 21],
  ops: [
    ["`addFirst(x)`", "O(1)", "Two pointer writes at the front."],
    ["`addLast(x)`", "O(1)", "Only because the list keeps a `tail` pointer."],
    ["`contains(x)`", "O(n)", "A miss follows every node to null."],
    ["`delete(x)`", "O(n)", "Finding `prev` is the walk. The unlink itself is O(1)."]
  ],
  useWhen: [
    "You add or remove at the front often. A list never shifts items the way an array does.",
    "You already hold the node before the one you want to remove, so the unlink costs O(1)."
  ],
  avoidWhen: [
    "You read items by position. Reaching the k-th node costs O(k), while an array reads any index in O(1). See [[arrays]].",
    "You need to step backwards or remove the last node fast. Use a [[doubly-linked-list|doubly linked list]]."
  ],
  example: [
    "`addLast 4`, `addLast 9`, `addFirst 2` and `addLast 7` build 2 → 4 → 9 → 7 → null.",
    "`contains 9` checks 2, then 4, then 9, and returns true on the third node.",
    "`delete 9` walks until `cur` is on 9 and `prev` is on 4. Setting `4.next` to 7 gives 2 → 4 → 7 → null.",
    "`delete 2` finds the target at the head, so `head` moves to 4 with no walk."
  ],
  pitfalls: [
    "Moving `head` before linking the new node. You lose your only pointer to the rest of the list.",
    "Forgetting to update `tail` when you delete the last node. It then points at a node that is gone.",
    "Following `cur.next` without checking that `cur` is not null. At the end of the list there is no next node."
  ]
};

export default theory;

import type { LessonTheory } from "../../theory/types";

const theory: LessonTheory = {
  definition:
    "A doubly linked list is a chain of nodes where each node points both to the next node and back to the previous one. The list keeps `head` and `tail`, so both ends are one step away.",
  analogy:
    "Think of people holding hands in a line, each holding a neighbour on both sides. Anyone can find the person before them without walking back from the front.",
  steps: [
    "Each node holds a value, a `next` pointer and a `prev` pointer. A pointer is a reference to where another node lives, and null means it points at nothing.",
    "The first node's `prev` is null and the last node's `next` is null.",
    "To add at the front, set the new node's `next` to `head` and the old head's `prev` to the new node. Then move `head`. If the list was empty, `tail` points at the new node too.",
    "To add at the back, do the same with `tail`, swapping the roles of `prev` and `next`.",
    "To remove at the back, move `tail` to `tail.prev`, then set the new tail's `next` to null. No walk from `head` is needed.",
    "Removing the only node sets both `head` and `tail` to null. Removing from an empty list throws."
  ],
  shots: [9, 9, 13, 9, 14, 17],
  ops: [
    ["`addFirst(x)`", "O(1)", "Three pointer writes."],
    ["`addLast(x)`", "O(1)", "Three pointer writes."],
    ["`removeFirst()`", "O(1)", "Moves `head`, then clears the new head's `prev`."],
    ["`removeLast()`", "O(1)", "Uses `tail.prev`, so there is no walk."],
    ["delete a node you hold", "O(1)", "Its `prev` and `next` give both neighbours. This lesson does not trace it."]
  ],
  useWhen: [
    "You add and remove at both ends, as a [[deque]] does.",
    "You hold a node and must remove or move it fast. An LRU (least recently used) cache, a small fast store of recent results, does this."
  ],
  avoidWhen: [
    "You only work at the front. A [[singly-linked-list|singly linked list]] uses one pointer per node instead of two.",
    "You read items by position. Reaching the k-th node still costs O(k)."
  ],
  example: [
    "`addLast 5` and `addLast 8` build null ← 5 ⇄ 8 → null. Then `addFirst 3` gives 3 ⇄ 5 ⇄ 8.",
    "`removeLast` moves `tail` from 8 to `8.prev`, which is 5. Then `5.next` becomes null, so 8 is gone.",
    "`removeFirst` moves `head` from 3 to 5 and sets `5.prev` to null. The list is the single node 5.",
    "`addFirst 1` links 1 and 5 both ways, giving 1 ⇄ 5."
  ],
  pitfalls: [
    "Setting only one of the two links. The list then looks right going forward and broken going back.",
    "Forgetting to clear the new end's pointer after a remove. The removed node stays reachable from it.",
    "Not handling the one-node case. Removing it must set both `head` and `tail` to null."
  ]
};

export default theory;

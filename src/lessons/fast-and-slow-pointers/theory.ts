import type { LessonTheory } from "../../theory/types";

const theory: LessonTheory = {
  definition:
    "Fast and slow pointers walk a linked list, a chain of linked nodes, with `slow` moving one node per round and `fast` moving two. If the list has a cycle, a loop that never reaches the end, they meet.",
  analogy:
    "Think of two runners on a track. On a straight road the faster one pulls ahead for good. On a circular track the faster one laps the slower one and runs up behind them.",
  steps: [
    "A linked list is a chain of nodes, small objects that each hold a value and a pointer to the next node. See [[singly-linked-list]].",
    "A pointer is a reference to where another node lives in memory. The last node's pointer is null, meaning it points at nothing.",
    "Start both `slow` and `fast` at `head`, the first node.",
    "Each round, check `fast` and `fast.next`. If either is null, the list ends, so return false.",
    "Move `slow` one node forward, along `next`, the pointer to the following node.",
    "Move `fast` two nodes forward.",
    "If `slow` and `fast` now point at the same node, the list has a cycle, so return true. Otherwise start the next round."
  ],
  shots: [1, 1, 2, 4, 3, 4, 10],
  ops: [
    ["cycle check, time", "O(n)", "`slow` enters the loop within `n` rounds. Then the gap shrinks by exactly one node per round, so it reaches zero instead of jumping past."],
    ["cycle check, extra space", "O(1)", "Two pointers, and no set of visited nodes."]
  ],
  useWhen: [
    "You must tell whether a linked list loops, using no extra memory.",
    "You need the middle of a list in one pass. When `fast` reaches the end, `slow` is halfway."
  ],
  avoidWhen: [
    "The data is an array. Its length is known, so you can read the middle index directly.",
    "Memory is not a concern and you want the plainest code. A set of visited nodes finds a cycle in O(n) time and O(n) space."
  ],
  example: [
    "The list is 1 → 2 → 3 → 4 → 5 → 6, and 6 points back to 3.",
    "After round 1, `slow` is on 2 and `fast` is on 3. After round 2, `slow` is on 3 and `fast` is on 5.",
    "In round 3, `slow` reaches 4 while `fast` goes 5 → 6 → 3. In round 4, `slow` reaches 5 and `fast` goes 3 → 4 → 5.",
    "Both are on 5, so the list has a cycle. Without the back link, `fast` would reach null."
  ],
  pitfalls: [
    "Reading `fast.next.next` without checking `fast.next`. On a list with no cycle, that read fails at the end.",
    "Comparing values instead of nodes. Two different nodes can hold the same value, so compare the pointers.",
    "Assuming the meeting node is where the loop starts. It is only proof that a loop exists."
  ]
};

export default theory;

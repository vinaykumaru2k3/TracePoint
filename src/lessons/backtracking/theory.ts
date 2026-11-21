import type { LessonTheory } from "../../theory/types";

const theory: LessonTheory = {
  definition:
    "Backtracking builds an answer one choice at a time, explores everything that follows, then undoes that choice and tries the next. Here it lists every subset, meaning every selection of the items from none to all.",
  analogy:
    "Picture a sandwich counter with three toppings. You go down the line saying yes or no to each one. After you write down a full sandwich, you step back to the last topping, change your answer, and go on. Yes or no for 3 toppings gives 2 × 2 × 2 = 8 sandwiches.",
  steps: [
    "Keep one list, `path`, for the items chosen so far, and an index `i` for the item being decided. Start `subsets` with `i = 0` and an empty path.",
    "If `i` equals the number of items, every item is decided. Record a copy of `path` and return. This is the base case, the call that answers without calling `subsets` again.",
    "Otherwise take the item. Append `items[i]` to `path`, then `subsets` calls itself with `i + 1`. A function that calls itself is using recursion, and this call is the recursive case.",
    "When that call returns, undo the choice: pop the item off `path`. This step back is the backtrack, and it leaves `path` exactly as it was.",
    "Then skip the item. Call `subsets` with `i + 1` again, with `path` unchanged.",
    "The calls form a search tree, shaped like a family tree with the first call at the top. Each call is a node, and it branches into two calls below it, take and skip.",
    "A leaf is a call at the bottom with nothing left to decide. Every leaf records one subset."
  ],
  ops: [
    ["record one subset", "O(n)", "Copying `path` copies up to n items."],
    ["list all subsets", "O(n·2ⁿ)", "Each item is in or out, so there are 2ⁿ subsets. Each copy holds up to n items."],
    ["stack depth", "O(n)", "The call stack is the memory that tracks every call not yet returned. Each waiting call keeps a frame there, a block holding its own `i`. The deepest chain is n + 1 calls. See [[call-stack]]."]
  ],
  useWhen: [
    "You must list every subset, combination or arrangement, not only count them.",
    "You build an answer in steps, each step has a few choices, and you want every answer the choices can make."
  ],
  avoidWhen: [
    "You only need how many subsets there are. A set of n items has 2ⁿ, so no search is needed.",
    "The number of items is large. 30 items have more than a billion subsets, too many to list."
  ],
  example: [
    "Start with `[1, 2, 3]`. Take 1, take 2 and take 3. Every item is decided, so record `[1, 2, 3]`.",
    "Undo 3 and skip 3. Record `[1, 2]`.",
    "Undo 2 and skip 2. Take 3 and record `[1, 3]`. Then undo 3, skip it and record `[1]`.",
    "Undo 1 and skip 1. The same pattern records `[2, 3]`, `[2]`, `[3]` and `[]`.",
    "That is 8 subsets, which is 2³. The path never held more than 3 items, and the recursion was 4 calls deep."
  ],
  pitfalls: [
    "Recording `path` itself instead of a copy. It is one list that keeps changing, so every saved subset would end up empty.",
    "Forgetting to undo. Without the pop, the skip branch still holds the item, and wrong subsets appear.",
    "Undoing something other than what you did. Remove exactly the item you added, so each branch starts from the same path."
  ]
};

export default theory;

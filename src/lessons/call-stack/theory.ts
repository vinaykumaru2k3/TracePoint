import type { LessonTheory } from "../../theory/types";

const theory: LessonTheory = {
  definition:
    "Recursion is **a function that calls itself on a smaller input** until it reaches a base case, an input it answers without calling again. Every call gets its own frame, a block of memory holding its `n` and where to return.",
  analogy:
    "Picture a pile of sticky notes on your desk. Each note is a task that waits on a smaller task. You write a new note on top for the smaller task. When the top task is done, you peel that note off and finish the one under it.",
  steps: [
    "`main` calls `fact(4)`. A frame for it goes onto the call stack, the memory that tracks every call not yet returned. The call stack is a [[stack]].",
    "`fact(4)` needs `fact(3)` before it can finish, so it calls it and pauses. This is the recursive case. A new frame with `n = 3` goes on top.",
    "The same happens for `fact(2)`, `fact(1)` and `fact(0)`. Each paused call keeps its frame, because it still has work to do after the answer comes back.",
    "`fact(0)` is the base case: `n == 0` returns 1 without another call. Without a base case, frames pile up until the stack runs out of room and crashes. That crash is a stack overflow.",
    "`fact(0)` hands 1 back to `fact(1)`. That answer is its return value. Its frame is popped, and `fact(1)` resumes where it paused.",
    "Each call multiplies and returns in turn. Frames come off in the reverse order they went on, last in, first out, until `main` gets the result."
  ],
  shots: [2, 3, 6, 7, 8, 12],
  ops: [
    ["make a call", "O(1)", "Push one frame onto the call stack."],
    ["return from a call", "O(1)", "Hand back the return value and pop the frame."],
    ["whole `fact(n)`", "O(n) time, O(n) space", "There are n + 1 calls. Each pending call keeps its frame until it returns, so n + 1 frames are alive at the deepest point."]
  ],
  useWhen: [
    "The problem is defined by a smaller copy of itself, such as a factorial or a folder that holds folders.",
    "The data nests, such as lists inside lists. Each level is handled by one more call. See [[guide:recursion]]."
  ],
  avoidWhen: [
    "The depth can reach many thousands, such as walking a list of a million items. Each call adds a frame, and the stack can overflow.",
    "A plain loop does the job. A loop for the factorial needs O(1) space, while the recursive version needs O(n) frames."
  ],
  example: [
    "`main` calls `fact(4)`, which calls `fact(3)`, `fact(2)`, `fact(1)` and `fact(0)`. That is 5 calls and 5 frames on the stack.",
    "`fact(0)` is the base case, so it returns 1 to `fact(1)`.",
    "`fact(1)` returns 1 × 1 = 1. Then `fact(2)` returns 2 × 1 = 2, and `fact(3)` returns 3 × 2 = 6.",
    "`fact(4)` returns 4 × 6 = 24. Its frame is popped, and `main` receives 24.",
    "The stack held at most 5 frames, which is n + 1 for n = 4. Time and space are both O(n)."
  ],
  pitfalls: [
    "A base case the input can skip. This `fact` only stops at `n == 0`, so `fact(-1)` recurses until the stack overflows. Guard bad inputs: reject `n < 0` before recursing. This lesson's input box only allows 0 to 7, so the trace never shows the overflow.",
    "Forgetting that the caller is paused, not finished. Code after the recursive call runs on the way back up, in reverse order.",
    "Ignoring the return value. If a call does not return or use the answer from the call below, the result is lost.",
    "Assuming recursion is free in memory. Every pending call keeps a frame, so the space is the depth of the deepest chain of calls."
  ]
};

export default theory;

import type { LessonTheory } from "../../theory/types";

const theory: LessonTheory = {
  definition:
    "Top-down dynamic programming solves a problem by recursion and **remembers every answer** in a table called a memo. Fibonacci is the classic case, where each number is the sum of the two before it.",
  analogy:
    "A student works out a long sum on scrap paper and writes the result in the margin. The next time that sum comes up, they read the margin instead of working it out again.",
  steps: [
    "Call fib(n). The call goes on the stack, the list of calls still waiting for an answer.",
    "If k is below 2, return k at once. These base cases never touch the memo.",
    "If memo[k] already holds a value, return it. This is a memo hit and it skips a whole branch of calls.",
    "Otherwise call fib(k - 1) first, which fills the memo down the left side.",
    "Then call fib(k - 2). Most of these now hit the memo, because the left side already stored them.",
    "Store the sum in memo[k], return it and pop the frame. At the end the memo holds fib(0) up to fib(n)."
  ],
  shots: [2, 8, 18, 5, 17, 27],
  ops: [
    ["time with the memo", "O(n)", "Each value from 2 to n is computed once. Every other call returns at once."],
    ["memo", "O(n)", "One cell for each value from 0 to n."],
    ["call stack", "O(n)", "The first branch goes n calls deep before anything returns."]
  ],
  useWhen: [
    "A recursive answer is built from smaller answers of the same problem, and the same smaller problems come up many times.",
    "You can name each subproblem with a few numbers, like k, so a table can store it."
  ],
  avoidWhen: [
    "The subproblems never repeat. A memo then costs memory and saves nothing.",
    "The recursion would go very deep. A bottom-up loop fills the table in order and needs no stack."
  ],
  example: [
    "fib(6) calls fib(5), then fib(4), fib(3) and fib(2), until fib(1) and fib(0) return 1 and 0.",
    "On the way back, memo[2] = 1, memo[3] = 2, memo[4] = 3 and memo[5] = 5 are stored.",
    "The second child of fib(6), fib(4), is a memo hit. So are fib(4)'s second child fib(2) and fib(5)'s second child fib(3).",
    "fib(6) = 5 + 3 = 8. That took 11 calls, and 3 were memo hits."
  ],
  pitfalls: [
    "Skipping the memo. Plain recursion makes about 1.6 times more calls for each step up in n, which is far too slow by n = 40.",
    "Counting a base case as a memo hit. The base cases return before the memo is read.",
    "Storing the answer ~~after returning~~. The store has to happen before the return, or it never runs."
  ]
};

export default theory;

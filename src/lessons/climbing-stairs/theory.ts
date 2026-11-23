import type { LessonTheory } from "../../theory/types";

const theory: LessonTheory = {
  definition:
    "Bottom-up dynamic programming fills a table **from the smallest case upward**, so each cell is built from cells that are already done. Climbing stairs counts the ways to reach the top when each move is 1 or 2 stairs.",
  analogy:
    "Building a wall one row of bricks at a time. Each new row rests on the row below it, so you never have to wonder whether the support is ready.",
  steps: [
    "Say what a cell means. ways[i] is the number of different ways to reach stair i, with moves of 1 or 2 stairs.",
    "Set the base cells by hand: ways[0] = 1 and ways[1] = 1. There is one way to stay at the bottom and one way to take a single stair.",
    "For each i from 2 up to n, read the two cells below it, ways[i - 1] and ways[i - 2]. The last move came from one of them.",
    "Write ways[i] as the sum of those two cells. The two groups of ways end with different moves, so none is counted twice.",
    "Move to the next i. Its two cells are already filled, so the loop never has to look ahead or call itself.",
    "When i reaches n, return ways[n]. The whole table is filled once, in order."
  ],
  shots: [1, 2, 7, 8, 11, 13],
  ops: [
    ["time", "O(n)", "One addition for each stair from 2 to n."],
    ["table", "O(n)", "One cell for each stair from 0 to n."],
    ["recursion", "none", "A plain loop fills the table, so there is no call stack to grow."]
  ],
  useWhen: [
    "Each answer depends only on a few smaller answers, and you can list the smallest cases by hand.",
    "You want the work to grow in a straight line with n and no risk of very deep recursion."
  ],
  avoidWhen: [
    "Only a few of the table cells are ever needed. Top-down recursion with a memo, as in [[fibonacci]], computes only those.",
    "The cells depend on each other in a pattern that has no clear smallest-first order."
  ],
  example: [
    "For n = 6, set ways[0] = 1 and ways[1] = 1.",
    "For i = 2, the cells below hold 1 and 1, so ways[2] = 2. Then ways[3] = 2 + 1 = 3 and ways[4] = 3 + 2 = 5.",
    "Next ways[5] = 5 + 3 = 8, and ways[6] = 8 + 5 = 13.",
    "The table reads 1 1 2 3 5 8 13, so there are 13 ways to climb 6 stairs."
  ],
  pitfalls: [
    "Forgetting a base case. If ways[1] is left empty, ways[2] reads a cell that holds nothing useful, and every later cell is wrong.",
    "Starting the loop at ~~i = 1~~. The base cells are already set, and ways[-1] does not exist.",
    "Reading the answer from the wrong cell. For n stairs the table has n + 1 cells, and the answer sits in ways[n]."
  ]
};

export default theory;

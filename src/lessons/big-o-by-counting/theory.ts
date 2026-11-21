import type { LessonTheory } from "../../theory/types";

const theory: LessonTheory = {
  definition:
    "Big-O by counting means you count how many steps code takes for an input of size `n`, then keep only the fastest-growing part. It describes how the work grows, not how many seconds it takes.",
  analogy:
    "Picture greeting guests at a party. Saying hello to each guest takes one greeting per person. Making sure every pair of guests shakes hands takes far more. Ten guests need 45 handshakes, and a hundred guests need 4,950.",
  steps: [
    "Find the loops. Each one repeats its body some number of times.",
    "Count how often the innermost line runs. In the sum, the add line runs once per item, so `n` times.",
    "For a loop inside a loop, count the pairs. The duplicate check compares each `a[i]` with every `a[j]` after it, which is `n(n-1)/2` checks.",
    "Use the worst input. A duplicate can end the check early, but an array with no duplicates checks every pair.",
    "Drop constants and smaller parts. `n(n-1)/2` is `n²/2 - n/2`, which grows like `n²`, so the check is O(n²)."
  ],
  ops: [
    ["One loop over `n` items", "O(n)", "Double `n` and the steps double."],
    ["A loop inside a loop over all pairs", "O(n²)", "Double `n` and the steps roughly quadruple."],
    ["A fixed number of steps", "O(1)", "The same work for any `n`, such as reading `a[0]`."]
  ],
  useWhen: [
    "You want to compare two solutions before you write either one.",
    "You need to know whether code stays fast when the input is 1,000 times bigger."
  ],
  avoidWhen: [
    "The input is always tiny, such as 5 items. Constant factors matter more than growth there.",
    "You need the exact running time on one machine. Measure it with a timer instead."
  ],
  example: [
    "Take `a = [4, 8, 1, 9]`, so `n` = 4.",
    "The sum adds each item once, giving 4, 12, 13 and then 22. That is 4 steps.",
    "The duplicate check tries pairs (0,1), (0,2), (0,3), (1,2), (1,3) and (2,3). That is 6 checks, and `4 × 3 / 2` = 6.",
    "No pair matches, so it returns false after all 6 checks.",
    "With `n` = 8, the sum takes 8 steps but the check takes 28."
  ],
  pitfalls: [
    "Counting the lucky case. An early return makes some runs short, but Big-O describes the worst case.",
    "Keeping constants. `2n` and `n + 100` are both O(n).",
    "Assuming two loops always mean O(n²). Two loops one after the other cost O(n) + O(n), which is still O(n). Only nesting multiplies."
  ]
};

export default theory;

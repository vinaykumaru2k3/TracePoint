import type { LessonTheory } from "../../theory/types";

const theory: LessonTheory = {
  definition:
    "A prefix sum array `p` holds running totals, where `p[i]` is the sum of the first `i` items. With it, the sum of any range takes one subtraction.",
  analogy:
    "Think of a car's odometer. To find the distance between two towns, you do not add up every mile of road. You read the odometer at each town and subtract one reading from the other.",
  steps: [
    "Make an array `p` one longer than `a`, and set `p[0] = 0`. That stands for the total of no items.",
    "For each `i`, set `p[i + 1] = p[i] + a[i]`. Each total reuses the one before it.",
    "To sum `a[l]` through `a[r]`, both ends included, compute `p[r + 1] - p[l]`.",
    "This works because `p[r + 1]` covers items 0 to `r`, and `p[l]` covers items 0 to `l - 1`. The difference is items `l` to `r`."
  ],
  shots: [2, 5, 9, 10],
  ops: [
    ["build", "O(n)", "One pass, plus O(n) memory for `p`."],
    ["query", "O(1)", "One subtraction, for any range."]
  ],
  useWhen: [
    "You ask many range-sum questions about the same data.",
    "The data does not change after you build `p`."
  ],
  avoidWhen: [
    "You ask only one range question. A plain loop over the range is O(n) as well and needs no extra array.",
    "Items change often. One change makes every later total wrong, and rebuilding costs O(n)."
  ],
  example: [
    "Take `a = [3, 1, 4, 1, 5, 9]`.",
    "Build `p = [0, 3, 4, 8, 9, 14, 23]`.",
    "The sum of `a[1]` to `a[3]` is `p[4] - p[1]`, so 9 - 3 = 6. That matches 1 + 4 + 1.",
    "The sum of `a[2]` to `a[5]` is `p[6] - p[2]`, so 23 - 4 = 19. That matches 4 + 1 + 5 + 9."
  ],
  pitfalls: [
    "Getting the ends wrong. The formula is `p[r + 1] - p[l]`, not `p[r] - p[l]`.",
    "Skipping `p[0] = 0`. Without it, a range that starts at index 0 needs a special case.",
    "Overflow on big totals. Running totals of large numbers can pass the limit of a 32-bit `int`, so use a wider type when needed."
  ]
};

export default theory;

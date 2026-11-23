import type { LessonTheory } from "../../theory/types";

const theory: LessonTheory = {
  definition:
    "Coin change asks for the **fewest coins** that add up to an amount, when you have as many of each coin as you like. A table dp holds the answer for every smaller amount, so each cell needs only a short look back.",
  analogy:
    "Paying at a till with a drawer of coins. To pay 6, you pick one coin first, then pay what is left the cheapest way you already know.",
  steps: [
    "Say what a cell means. dp[a] is the fewest coins that make amount a. It starts at ∞, a stand-in for no way known yet, so any real count is smaller.",
    "Set the base case by hand: dp[0] = 0. Amount 0 needs no coins. Every other cell stays at ∞.",
    "For each amount a from 1 up, try each coin c that is not larger than a. Read dp[a - c], the cell for what is left after the coin.",
    "If it is not smaller, leave dp[a] alone. A coin that gives no gain changes nothing, and ∞ + 1 never beats any count.",
    "If dp[a - c] + 1 is smaller than dp[a], write it into dp[a]. One more coin than the cheapest way to pay the rest is a better way.",
    "Trace the coins back from dp[amount]. A coin was used when dp[a - c] + 1 equals dp[a]. Step to a - c and repeat until you reach 0.",
    "Return dp[amount]. If it is still ∞ after every coin was tried, no mix of the coins makes the amount, so return -1."
  ],
  shots: [1, 2, 7, 8, 9, 16, 18],
  ops: [
    ["time", "O(n × k)", "For each of the n amounts, one try per coin. Here n is the target amount and k the number of coins."],
    ["table", "O(n)", "One cell for each amount from 0 to the target."],
    ["recursion", "none", "Two plain loops fill the table, so no call stack grows."]
  ],
  useWhen: [
    "You need the fewest pieces to reach a total, and the answer for a total builds on answers for smaller totals.",
    "A greedy rule, such as always taking the biggest coin, can fail. With coins 1, 3 and 4, greedy pays 6 as 4 + 1 + 1, but 3 + 3 uses fewer."
  ],
  avoidWhen: [
    "The coins are such that the biggest coin first is always best, as in many real currencies. A single pass is then enough.",
    "The amount is huge and the table would not fit in memory. Only the table size grows with the amount."
  ],
  example: [
    "Take coins 1, 3 and 4 and amount 6. Set dp[0] = 0.",
    "dp[1] = 1 and dp[2] = 2 use only the coin 1. For 3, coin 1 gives 3 coins, then coin 3 gives dp[0] + 1 = 1, which is smaller.",
    "For 4, coin 1 gives 2, coin 3 gives 2 and does not beat it, and coin 4 gives 1. So dp[4] = 1.",
    "dp[5] = 2, from coin 1 on top of dp[4]. dp[6] = 2, from coin 3 on top of dp[3].",
    "The traceback picks 3 and then 3, so 6 = 3 + 3."
  ],
  pitfalls: [
    "Starting every cell at 0. Then dp[a - c] + 1 looks cheap for amounts that cannot be made, and the answer is wrong. Start at ∞, or at amount + 1 in code.",
    "Using the biggest sentinel, ~~Integer.MAX_VALUE~~. Adding 1 to it overflows in Java and C++. Use amount + 1 as the stand-in.",
    "Reading dp[a - c] when c is larger than a. Check c <= a first, so the index never goes below 0.",
    "Treating dp[amount] as the answer without checking it. If it still holds ∞, the right result is -1."
  ]
};

export default theory;

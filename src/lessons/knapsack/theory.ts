import type { LessonTheory } from "../../theory/types";

const theory: LessonTheory = {
  definition:
    "The 0/1 knapsack problem fills a weight-limited bag with the most valuable items, each taken whole or left out. A 2D table keeps the best value for every number of items and every amount of room.",
  analogy:
    "Packing a backpack for a day trip. Each thing has a weight and a worth to you, and the bag has a limit. For each thing you decide: bring it, or leave it at home.",
  steps: [
    "Say what a cell means. dp[i][w] is the best value you can get from the first i items when the bag holds weight w. A row is a number of items, a column is an amount of room.",
    "Set the base case: row 0 and column 0 are 0. With no items there is nothing to carry, and with no room nothing fits.",
    "For each item i and each room w, look at the item's weight. If it is more than w, the item cannot go in the bag. Compare it to the room before reading anything else.",
    "If the item fits, read two cells from the row above: dp[i-1][w], the best without the item, and dp[i-1][w - weight], the best for the room left after taking it. Add the item's value to the second.",
    "Keep the larger. If taking the item gives more, write that. If not, copy the cell above: dp[i][w] = dp[i-1][w], the best value without this item.",
    "Trace the items back from dp[n][cap]. If a cell differs from the one above it, the item in that row was taken. Move left by its weight and up one row.",
    "Return dp[n][cap]. It is the best value for all the items and the full bag."
  ],
  shots: [1, 2, 3, 4, 17, 23, 25],
  ops: [
    ["time", "O(n × W)", "One step per cell. Here n is the number of items and W is the capacity of the bag."],
    ["table", "O(n × W)", "One cell for each item count from 0 to n and each room from 0 to W."],
    ["recursion", "none", "Two plain loops fill the table, so no call stack grows."]
  ],
  useWhen: [
    "You pick items under one limit, such as weight or money, and each item is taken whole or not at all.",
    "A greedy rule, such as always taking the best value per weight, can fail. A small table checks every choice instead."
  ],
  avoidWhen: [
    "Items can be split into parts. Then taking the best value per weight first is correct and needs no table.",
    "The capacity is huge. The table has one column per unit of room, so a large W costs a large table."
  ],
  example: [
    "Take items 2:3, 3:4, 4:5 and 5:6, written weight:value, and room 5. Row 0 and column 0 are 0.",
    "Item 1 weighs 2. It does not fit at room 1, so dp[1][1] = 0. At room 2 it fits, and 3 + dp[0][0] = 3 beats 0, so dp[1][2] = 3.",
    "Item 2 weighs 3. At room 5, taking it gives 4 + dp[1][2] = 7, which beats the 3 above, so dp[2][5] = 7.",
    "Item 3 gives 5 + dp[2][1] = 5 at room 5. That is less than 7, so the cell copies the 7 above. Item 4 also leaves it at 7.",
    "The traceback finds that item 2 and item 1 were taken, worth 4 + 3 = 7 in a bag of weight 5."
  ],
  pitfalls: [
    "Reading dp[i-1][w - weight] when the weight is more than w. The index goes below 0. Check that the item fits first.",
    "Reusing an item. Always read from the row above, ~~dp[i][w - weight]~~. Reading the same row would let an item be taken again, which is a different problem.",
    "Forgetting the copy. When the item is not taken, dp[i][w] still needs the value from dp[i-1][w], or the cell stays 0.",
    "Returning a corner other than the last. The answer is dp[n][cap], the full bag and every item considered."
  ]
};

export default theory;

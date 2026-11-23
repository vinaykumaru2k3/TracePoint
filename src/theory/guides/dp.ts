import type { Guide } from "../types";

const dp: Guide = {
  section: "dp",
  tagline: "How to solve a big problem by solving each smaller piece once and writing the answer down.",
  core: [
    "Dynamic programming, or DP, splits a problem into **subproblems**, which are smaller versions of the same question. Their answers are stored in a table so none is solved twice. It works when subproblems overlap, meaning the same ones come up again, and when the best answer is built from best answers to smaller pieces. That second property is called optimal substructure.",
    "There are two ways to fill the table. **Top-down** starts from the big question, recurses, and saves each answer in a memo (memoisation) so a repeat is a lookup. **Bottom-up** starts from the smallest cases and fills the table in order with plain loops (tabulation). Both do the same work per cell.",
    "Each table cell describes a **state**, such as the best value for the first i items and room w. The **transition** is the rule that builds a cell from cells already known. To get more than a number, trace back from the last cell and follow which choice each cell came from."
  ],
  analogy:
    "Think of a long sum worked out on scrap paper. Every time a smaller sum turns up again, you read its result from the margin instead of working it out once more. The table is the margin, and filling it in the right order means you never need an answer you have not written yet.",
  prereqs: [
    "The [[call-stack]] lesson. Top-down DP is recursion, and a memo cuts off the repeated branches.",
    "The [[arrays]] lesson. A DP table is an array or a grid of them, read by index.",
    "The [[prefix-sums]] lesson. It is the same habit of building each cell from the cell before it."
  ],
  terms: [
    ["subproblem", "A smaller version of the original question, such as the fewest coins for a smaller amount."],
    ["overlapping subproblems", "The same subproblem is needed by more than one larger problem, so solving it once and reusing it saves work."],
    ["optimal substructure", "The best answer to a problem can be built from the best answers to its subproblems."],
    ["memoisation", "Top-down DP. Recurse from the big question and store each answer in a memo, so a repeated call returns at once."],
    ["tabulation", "Bottom-up DP. Fill a table from the smallest case upward in an order where every cell's inputs are already done."],
    ["state", "The few numbers that name one subproblem, such as i and w. Each state gets one table cell."],
    ["transition", "The rule that computes a cell from earlier cells, such as dp[i] = dp[i-1] + dp[i-2]."],
    ["base case", "A cell you can fill by hand, with no earlier cells needed. Every other cell is built on these."],
    ["prefix", "The first few items of a sequence. An empty prefix has none, and it usually gets its own row or column."],
    ["traceback", "Walking back from the answer cell and following which choice produced each cell, to recover the actual solution."]
  ],
  cheat: {
    head: ["Question", "Use", "Time"],
    rows: [
      ["Count ways with a repeating recursion, using a memo", "[[fibonacci]]", "O(n)"],
      ["Count ways, filling a table from the bottom", "[[climbing-stairs]]", "O(n)"],
      ["Fewest pieces to make a total", "[[coin-change]]", "O(n × k)"],
      ["Best value under one limit, items whole", "[[knapsack]]", "O(n × W)"],
      ["Longest shared subsequence of two sequences", "[[lcs]]", "O(n × m)"],
      ["Fewest edits between two words", "[[edit-distance]]", "O(n × m)"]
    ]
  },
  patterns: [
    ["The question asks how many ways, and each way ends with one of a few last moves.", "Add the counts for each possible last move. See [[climbing-stairs]]."],
    ["The question asks for the fewest or the most, and each step is one choice from a short list.", "Take the best of the choices over the table. See [[coin-change]] and [[knapsack]]."],
    ["The question compares two sequences letter by letter.", "Use a grid with one row per prefix of the first and one column per prefix of the second. See [[lcs]] and [[edit-distance]]."],
    ["A plain recursion repeats the same call with the same arguments.", "Add a memo and keep the recursion. See [[fibonacci]]."]
  ],
  tips: [
    "Say what a cell means in one sentence before writing any code. If you cannot, the state is not clear yet.",
    "Write the base cases by hand first. A wrong or missing base case makes every later cell wrong.",
    "Check the fill order. Each cell must be computed after the cells it reads, so a bottom-up loop runs from the base cases toward the answer.",
    "Count the empty prefix. A table over words of length n and m has n + 1 rows and m + 1 columns. Row i holds i letters, so its last letter is at index i - 1.",
    "Keep less memory when only the last row is read. Fibonacci needs two values, and a grid row needs the row above it. The cost is that a full traceback needs the whole table.",
    "Do not assume greedy works. Taking the biggest coin first is right for some coin sets and wrong for others, and a table checks every choice."
  ],
  cases: [
    {
      title: "Making change at a till",
      setting: "A machine must pay out an amount using the fewest coins. The coin set varies by country and some sets have gaps.",
      idea: "Fill a table where dp[a] is the fewest coins for amount a, trying each coin for every amount. With coins 1, 3 and 4, greedy pays 6 as 4 + 1 + 1, but the table finds 3 + 3.",
      why: "The table checks every coin at every amount, so it is correct for any coin set. Greedy is faster but only safe for some sets."
    },
    {
      title: "Comparing two versions of a file",
      setting: "A tool must show what changed between two versions of a document, line by line.",
      idea: "Run LCS over the lines to find what both versions share in order. Everything else is an insertion or a deletion.",
      why: "The grid has one cell per pair of prefixes, so the work is O(n × m). A traceback then lists the unchanged lines."
    },
    {
      title: "Spell-check suggestions",
      setting: "A word processor sees a word that is not in its dictionary and must rank near matches.",
      idea: "Compute the edit distance from the typed word to each candidate and suggest those with the smallest distance.",
      why: "Each insert, delete or replace costs one, and the table finds the fewest from shorter prefixes without trying every sequence of edits."
    }
  ],
  hooks: {
    "fibonacci": "Add a memo to a recursion, and watch repeated calls turn into lookups.",
    "climbing-stairs": "Fill a table from the base cases upward, each cell from the two before it.",
    "coin-change": "Try every coin for every amount, and see where greedy goes wrong.",
    "knapsack": "Fill a grid of items by room, taking or leaving each item, then trace back what was packed.",
    "lcs": "Compare two words in a grid, extend on a match, and spell the shared letters back.",
    "edit-distance": "Count the fewest inserts, deletes and replaces, and list them by walking the grid back."
  }
};

export default dp;

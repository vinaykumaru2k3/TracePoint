import type { LessonTheory } from "../../theory/types";

const theory: LessonTheory = {
  definition:
    "A subsequence of a word is what is left after deleting some letters while keeping the order of the rest. The longest common subsequence is the longest one that two words share, found with a 2D table.",
  analogy:
    "Two people each list the same songs in the order they heard them, but each forgot a few. The longest common subsequence is the longest run of songs both lists agree on, in the same order.",
  steps: [
    "Say what a cell means. A prefix is the first few letters of a word. dp[i][j] is the length of the longest common subsequence of the first i letters of one word and the first j of the other.",
    "Set the base case: row 0 and column 0 are 0. A word with no letters shares nothing with any other word.",
    "For each remaining cell, compare one letter from each word: letter i of the first word and letter j of the second.",
    "If the letters match, that letter extends the best answer for both words without their last letters. Read the diagonal cell dp[i-1][j-1] and add 1.",
    "If the letters differ, one of them is left out. Take the larger of the cell above, dp[i-1][j], and the cell to the left, dp[i][j-1].",
    "Spell the subsequence by walking back from the last cell. A match takes its letter and moves diagonally. Otherwise move toward the larger neighbour, and on a tie move up.",
    "Return dp[n][m]. It is the length of the longest common subsequence of both whole words."
  ],
  shots: [1, 2, 3, 4, 5, 18, 23],
  ops: [
    ["time", "O(n × m)", "One step per cell. Here n and m are the lengths of the two words."],
    ["table", "O(n × m)", "One cell for each pair of prefixes, from the empty prefix up to the whole word."],
    ["recursion", "none", "Two plain loops fill the table, so no call stack grows."]
  ],
  useWhen: [
    "You compare two sequences and want what they share in order, such as two versions of a file or two DNA strands.",
    "Both sequences are short enough that a table with one cell for each pair of positions fits in memory."
  ],
  avoidWhen: [
    "You need a shared run of letters with no gaps, called a substring. A subsequence may skip letters, so it answers a different question.",
    "You need the number of edits between two words. Edit distance counts insertions, deletions and replacements, which this table does not."
  ],
  example: [
    "Take AGCAT and GAC. Row 0 and column 0 are 0. A and G differ, so dp[1][1] takes the larger of 0 and 0, which is 0.",
    "A and A match at dp[1][2]. The diagonal is dp[0][1] = 0, so the cell is 0 + 1 = 1.",
    "C and C match at dp[3][3]. The diagonal is dp[2][2] = 1, so the cell is 2. The corner dp[5][3] ends at 2.",
    "The traceback starts at the corner and moves up twice on ties. It takes C at dp[3][3], moves up on another tie, then takes A at dp[1][2].",
    "Read back to front, the letters spell AC. It appears in order in both AGCAT and GAC, and the length is 2."
  ],
  pitfalls: [
    "Mixing up the two lengths. The table has one more row and one more column than the words have letters, because of the empty prefix.",
    "Reading ~~a[i]~~ for the letter of row i. Row i is the first i letters, so its last letter is a[i-1].",
    "Taking the max when the letters match. A match always uses the diagonal plus 1, and that is never smaller than the neighbours.",
    "Printing the letters in the order found. The traceback goes from the end, so the letters come out reversed."
  ]
};

export default theory;

import type { LessonTheory } from "../../theory/types";

const theory: LessonTheory = {
  definition:
    "Edit distance is the fewest single-letter edits that turn one word into another. An edit is an insert, a delete or a replace, and a 2D table finds the answer from shorter prefixes.",
  analogy:
    "You fix a typo in a message with a keyboard. Each key press adds a letter, removes a letter, or overwrites one. The edit distance is the fewest key presses that turn the typo into the word you meant.",
  steps: [
    "Say what a cell means. The first word has n letters and runs down the rows. The second has m letters and runs along the columns. dp[i][j] is the fewest edits that turn the first i letters of the first word into the first j letters of the second. Those first letters are a prefix.",
    "Set the edges. Column 0 holds 0 to n, because i letters become nothing with i deletes. Row 0 holds 0 to m, because j letters are built from nothing with j inserts.",
    "For a cell whose letters differ, read three neighbours: the diagonal (replace), the cell above (delete) and the cell to the left (insert). The cell is 1 plus the smallest of the three.",
    "For a cell whose letters match, no edit is needed. Copy the diagonal cell dp[i-1][j-1].",
    "List the edits by walking back from the last cell. A match keeps its letter and moves diagonally. Otherwise name the edit the cell came from. Replace moves diagonally, delete moves up, insert moves left.",
    "Keep going until you reach the top-left cell. The strip then holds every edit in word order, so the first letter's edit comes first.",
    "Return dp[n][m]. It is the edit distance between the two whole words."
  ],
  shots: [1, 2, 3, 7, 18, 22, 23],
  ops: [
    ["time", "O(n × m)", "One step per cell. Here n and m are the lengths of the two words."],
    ["table", "O(n × m)", "One cell for each pair of prefixes, from the empty prefix up to the whole word."],
    ["recursion", "none", "Two plain loops fill the table, so no call stack grows."]
  ],
  useWhen: [
    "You measure how different two words are, as a spell checker does when it ranks suggestions for a misspelled word.",
    "You need the actual list of edits, not only their count. The traceback gives it."
  ],
  avoidWhen: [
    "You only want the letters two words share in order. [[lcs]] answers that, and it never replaces a letter.",
    "The words are very long. The table holds one cell for each pair of positions, so two words of a million letters need far too much memory."
  ],
  example: [
    "Turn HORSE into ROS. Column 0 holds 0 to 5 and row 0 holds 0 to 3.",
    "H and R differ at dp[1][1]. The diagonal, above and left cells are 0, 1 and 1, so the cell is 1 + 0 = 1. That is a replace.",
    "O and O match at dp[2][2]. The cell copies the diagonal dp[1][1] = 1. The corner dp[5][3] ends at 3.",
    "The traceback deletes E, keeps S, deletes R, keeps O, then replaces H with R.",
    "Read in word order, that is three edits: replace H with R, delete R, delete E. HORSE becomes ROS."
  ],
  pitfalls: [
    "Starting the edges at 0. Row 0 and column 0 count 0, 1, 2 and so on, because an empty prefix still needs one edit per letter.",
    "Reading ~~a[i]~~ for the letter of row i. Row i is the first i letters, so its last letter is a[i-1].",
    "Forgetting the 1 when the letters differ. Replace, delete and insert each cost one edit, so the cell is 1 plus the smallest neighbour.",
    "Counting a kept letter as an edit. When the letters match, the cell copies the diagonal and adds nothing."
  ]
};

export default theory;

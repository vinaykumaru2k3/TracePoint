import type { LessonTheory } from "../../theory/types";

const theory: LessonTheory = {
  definition:
    "N-Queens places n queens on an n×n chessboard so that no two attack each other. A queen attacks every square in its row, its column and both of its diagonals.",
  analogy:
    "Picture seating guests one row at a time in a hall, where rivals must not sit in line with each other. You seat a guest in the first seat that is safe. If the next row has no safe seat, you go back and move the last guest one seat along.",
  steps: [
    "Place one queen per row, from row 0 down. Store the board as `cols`, where `cols[r]` is the column of the queen in row `r`. Two queens can never share a row.",
    "In the current row, try columns left to right. A square is safe if no placed queen shares its column or a diagonal. Two squares share a diagonal when their column gap equals their row gap.",
    "Skip an attacked square at once. This is pruning: stopping a branch of the search before exploring anything under it.",
    "On a safe square, place a queen, and `solve` calls itself for the next row. A function calling itself is recursion.",
    "When `row` equals n, every row has a queen. That is the base case, the call that answers without calling `solve` again.",
    "Sometimes no column in a row leads to a solution. Either none is safe, or every safe one dead-ends in a row below. Then `solve` returns false. The caller lifts its queen and tries the next column in its row. Undoing a choice this way is called backtracking.",
    "If row 0 runs out of columns, no solution exists. The 3×3 board is one such case."
  ],
  shots: [2, 3, 4, 5, 32, 10, 22],
  ops: [
    ["check one square", "O(n)", "Compare it with each queen placed so far, at most n − 1 of them."],
    ["placements tried", "`O(n!)` worst case", "Row r has at most n − r free columns, since each queen above uses one. So there are at most n × (n − 1) × … × 1 ways to fill the rows. That product is `n!`, said n factorial."],
    ["space", "O(n)", "`cols` holds up to n numbers. The call stack is the memory that tracks every call not yet returned. Each waiting call keeps a frame there, a block holding its own `row`."],
    ["recursion depth", "O(n)", "The chain of waiting calls is at most n + 1 long, one per row plus the base case."]
  ],
  useWhen: [
    "You place things under rules, such as a timetable or a sudoku, and want one valid arrangement.",
    "You can test the rules on a partial answer. Then a bad choice is rejected early, and pruning saves most of the work."
  ],
  avoidWhen: [
    "A direct pattern builds the answer. For large n, N-Queens has known formulas that place every queen without any search.",
    "n is large and you need every solution. Even with pruning, the work grows like `n!`, so it soon becomes too slow."
  ],
  example: [
    "Squares are written row,column. Place 0,0. In row 1, columns 0 and 1 are attacked, so place 1,2.",
    "Row 2 has no safe square, so lift 1,2 and place 1,3. Then place 2,1.",
    "Row 3 has no safe square, so lift 2,1. Row 2 has no safe square further right, so lift 1,3. Row 1 has no columns left, so lift 0,0.",
    "Place 0,1, then 1,3, 2,0 and 3,2. Every row has a queen, so `cols` is `[1, 3, 0, 2]`.",
    "That took 8 placements and 4 lifts. Trying every board with one queen per row would mean 4⁴ = 256 boards."
  ],
  pitfalls: [
    "Checking only one diagonal. A queen attacks both, so compare the absolute column gap with the row gap.",
    "Forgetting to lift the queen before trying the next column. The old queen stays in `cols` and blocks squares that are really safe.",
    "Expecting pruning to change the worst case. It cuts most branches in practice, but the bound still grows like `n!`."
  ]
};

export default theory;

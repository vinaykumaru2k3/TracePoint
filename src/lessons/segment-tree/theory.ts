import type { LessonTheory } from "../../theory/types";

const theory: LessonTheory = {
  definition:
    "A segment tree stores the sum of every range that repeated halving of an array produces. **A range sum then reads a few stored sums**, and a changed value fixes one path.",
  analogy:
    "Think of a sports league that reports totals. Each team reports its points, each division adds its teams, and the league adds the divisions. To total any few teams, reuse the biggest finished subtotals you can. When one team's score changes, only its division and the league total need correcting.",
  steps: [
    "A range is a run of positions side by side, written `l..r` with both ends included. Halve `0..n-1` again and again until each range has one position. Each leaf copies its value from the array.",
    "Build upward. A node's sum is the sum of its two children, so every internal node is filled once its children are ready, ending at the root.",
    "A query asks for the sum of `l..r`. A node whose range lies partly inside and partly outside the query cannot be used, so ask both of its children.",
    "A node whose whole range lies inside the query hands over its stored sum. The search stops there, and nothing below it is read.",
    "A node whose range shares no position with the query adds 0. The search stops there too.",
    "When the search is done, the sums taken whole add up to the answer.",
    "An update walks from the root to the leaf of that position, going left when the position is at or before the split point. The leaf takes the new value.",
    "Walk back up and add each path node's two children again. Every other sum was unaffected, so the tree is correct again."
  ],
  shots: [2, 6, 7, 11, 15, 16, 19, 21],
  ops: [
    ["build", "O(n)", "Each of the n - 1 internal nodes is filled once."],
    ["range sum query", "O(log n)", "At most a few nodes are visited on each level."],
    ["point update", "O(log n)", "One leaf changes, then one node per level above it."],
    ["space", "O(n)", "About 2n nodes. The array form, laid out like a [[binary-heap]], reserves 4n slots to be safe."]
  ],
  useWhen: [
    "You ask for range sums and also change values between the questions.",
    "The same tree can answer other combinable questions, such as the smallest or largest value in a range, by changing how two children combine."
  ],
  avoidWhen: [
    "Nothing changes after the start. A [[prefix-sums]] array answers each range sum in O(1) with a simple subtraction, and it is shorter to write.",
    "Updates are frequent and queries are rare. A plain array changes a value in O(1), and a slow query once in a while may cost less overall."
  ],
  example: [
    "Take [2, 1, 5, 3, 4] and ask for positions 1 to 3. The root, 0..4, overlaps in part, and so do 0..2 and 0..1.",
    "Position 0 is outside the query, so 0..0 adds 0. Positions 1 and 2 are inside, so 1..1 gives 1 and 2..2 gives 5.",
    "3..4 overlaps in part. 3..3 is inside and gives 3, and 4..4 is outside. The total is 1 + 5 + 3 = 9.",
    "Now set position 2 to 0. The walk goes 0..4, 0..2, 2..2. Fixing upward, 0..2 becomes 3 and the root becomes 10, and the same query gives 4."
  ],
  pitfalls: [
    "Thinking a query visits every node. A range overlaps the query in part only if it holds an end of the query. So at most two nodes per level split. The tree has about log n levels, so a query is O(log n).",
    "Reading `l..r` as ~~leaving out r~~. Both ends are included, so `query 1 3` adds three values.",
    "Forgetting to fix the sums above a changed leaf. Without that walk back up, later queries read old sums.",
    "Splitting at a different point in the build, the query and the update. Use mid = (l + r) / 2 rounded down everywhere. The left half is `l..mid` and the right half is `mid+1..r`."
  ]
};

export default theory;

import type { Guide } from "../types";

const recursion: Guide = {
  section: "recursion",
  tagline: "How a function solves a problem by calling itself on a smaller copy, and how backtracking uses that to try every choice.",
  core: [
    "Say you want `fact(4)`, which is 4 × 3 × 2 × 1 = 24. Notice that `fact(4)` is 4 × `fact(3)`, and `fact(3)` is 3 × `fact(2)`. Each problem holds a smaller copy of itself. At `fact(0)` the answer is 1 with no more work, so the chain stops there.",
    "That is recursion: a function that calls itself on a smaller input. It needs a base case, an input it answers directly, and a recursive case that calls itself on a smaller one. Every call still waiting for an answer keeps a frame on the call stack. So the space a recursion needs is the deepest chain of calls alive at once.",
    "Backtracking uses recursion to try choices. At each step you make one choice, recurse to explore everything that follows, then undo the choice and try the next one. The calls form a search tree with one branch per choice. Pruning skips a branch as soon as it breaks a rule, so most of the tree is never visited."
  ],
  analogy:
    "Picture a set of nesting dolls. To count them, you open the outer doll and count the dolls inside it, which is the same task, only smaller. The smallest doll does not open, so you count 1 and stop. Then each answer passes back out, one doll at a time, until the outer doll has its total.",
  prereqs: [
    "Functions: how to call one, pass it arguments, and use the value it returns.",
    "The [[stack]] lesson. The call stack is a stack, so the newest call is the first to finish."
  ],
  terms: [
    ["recursion", "A function that solves a problem by calling itself on a smaller version of the same problem."],
    ["base case", "An input the function answers directly, without calling itself again. In `fact`, `n == 0` returns 1."],
    ["recursive case", "An input the function answers by calling itself on a smaller input, such as `fact(n)` calling `fact(n - 1)`."],
    ["call stack", "The memory that tracks every call that has started but not returned. It is a [[stack]]: the newest call sits on top."],
    ["frame", "One entry on the call stack. It holds a call's own variables, such as its `n`, and where to go back to when it returns."],
    ["return value", "The answer a call hands back to the call that made it, such as `fact(0)` handing 1 back to `fact(1)`."],
    ["stack overflow", "A crash when the call stack runs out of room, usually because calls never reach a base case."],
    ["backtracking", "A way to search by making a choice, exploring what follows, then undoing that choice and trying the next."],
    ["choice", "One option at one step of a backtracking search, such as taking an item or skipping it."],
    ["pruning", "Stopping a branch of the search as soon as it breaks a rule, so nothing under it is explored."],
    ["search tree", "The tree of all calls in a backtracking search. Each call is a node, and each choice is a branch to a child call."]
  ],
  cheat: {
    head: ["Technique", "Time", "Space", "Note"],
    rows: [
      ["Factorial `fact(n)`", "O(n)", "O(n) stack space", "There are n + 1 calls, each doing O(1) work. Each pending call keeps its frame until it returns, so n + 1 frames pile up."],
      ["All subsets of n items", "O(n·2ⁿ) to list them", "O(n) depth", "Each item is in or out, so there are 2ⁿ subsets. Copying each one costs up to n."],
      ["N-Queens on an n×n board", "Worst case grows like `n!`", "O(n)", "Row r has at most n − r free columns, since each queen above uses one. Pruning cuts most branches, so far fewer are tried."],
      ["Space of any recursion", "Depends on the work per call", "The deepest chain of calls", "Only calls still waiting hold frames. Subsets of 3 items make 15 calls but hold at most 4 frames at once."]
    ]
  },
  patterns: [
    ["A problem defined by a smaller copy of itself, such as a folder that holds folders.", "Use recursion. Find the base case first. See [[call-stack]]."],
    ["List every subset, combination or arrangement.", "Use backtracking: choose, recurse, undo. See [[backtracking]]."],
    ["Place things under rules, such as queens that must not attack each other.", "Use backtracking with pruning, and reject a choice as soon as it breaks a rule. See [[n-queens]]."]
  ],
  tips: [
    "Always reach a base case. Every recursive call must move closer to it, or the calls never stop and the stack overflows.",
    "Undo exactly what you did before trying the next choice. If you added one item, remove that one item, so the next branch starts clean.",
    "Record a copy of a result, not the list you keep changing. Otherwise every saved answer changes when the path does.",
    "Very deep recursion can overflow the call stack. If the depth can reach many thousands, use a loop with your own [[stack]] instead.",
    "Count the calls, not only the depth. A shallow search tree can still have 2ⁿ leaves, which grows very fast."
  ],
  cases: [
    {
      title: "Summing a folder's size",
      setting: "A disk tool must show how much space a folder takes. The folder holds files and other folders, which hold more of both.",
      idea: "The size of a folder is the size of its files plus the size of each subfolder. Each subfolder is the same problem, smaller. A folder with no subfolders is the base case.",
      why: "The nesting can go any number of levels deep. Recursion follows it without knowing the depth in advance, and each file is visited once."
    },
    {
      title: "A sudoku solver",
      setting: "Sudoku is a 9×9 number puzzle. Each row, column and 3×3 box must hold the digits 1 to 9 once each. Some cells start filled.",
      idea: "Pick an empty cell and try each digit that breaks no rule. Recurse to the next empty cell. If a cell has no legal digit, undo the last choice and try the next.",
      why: "This is placing things under rules, so backtracking with pruning fits. A digit that breaks a rule is rejected at once, so far fewer than all grids are tried."
    },
    {
      title: "Reading nested data such as JSON",
      setting: "JSON, short for JavaScript Object Notation, is a text format for data. A list or an object in it can hold other lists and objects, to any depth.",
      idea: "A reader handles one value. If the value is a list or an object, the reader calls itself on each item inside. A number or a string is the base case.",
      why: "The shape of the data matches the shape of the code. The depth of the call stack equals the depth of the nesting, which is why very deep input can overflow it."
    }
  ],
  hooks: {
    "call-stack": "Watch `fact(n)` push one frame per call and pop one per return.",
    backtracking: "List every subset by taking an item, undoing it, then skipping it.",
    "n-queens": "Place queens row by row, skip attacked squares, and lift the last queen at a dead end."
  }
};

export default recursion;

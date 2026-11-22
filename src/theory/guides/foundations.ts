import type { Guide } from "../types";

const foundations: Guide = {
  section: "foundations",
  tagline: "How to measure an algorithm by counting its steps, and the array techniques that cut those steps down.",
  core: [
    "Adding up 10 numbers takes about 10 steps. Adding up a million numbers takes about a million. An algorithm, a step-by-step method for solving a problem, is judged by **how its step count grows** with the input size `n`. Seconds depend on the machine, so you count steps instead.",
    "You write that growth in Big-O. O(n) means the steps grow in proportion to `n`. O(n²) means doubling `n` roughly quadruples the work. O(1) means **the work stays the same at any size**.",
    "The array is the first data structure in this section. It keeps its items side by side in memory. So the computer finds item `i` with one calculation from the start address, the place in memory where the array begins. That is why **reading by index is O(1)**. Every technique here is built on that fact."
  ],
  analogy:
    "Picture a hallway of numbered lockers. With a locker number, you walk straight to it, and that takes one trip however long the hallway is. Without a number, you open lockers in turn until you find your bag, so a longer hallway means more steps. An array works the same way. Big-O is the habit of asking how the steps grow as the hallway gets longer.",
  prereqs: [
    "You can read and write variables, `if` statements and `for` loops in any one programming language.",
    "You can create an array in that language and read an item by its position. Nothing else is assumed."
  ],
  terms: [
    ["algorithm", "A step-by-step method that solves a problem, such as adding up a list of numbers."],
    ["data structure", "A way of arranging data in memory so that certain operations are fast. An array is one."],
    ["input size `n`", "How many items the algorithm works on. For an array of 6 numbers, `n` is 6."],
    ["time complexity", "How the number of steps an algorithm takes grows as `n` grows."],
    ["space complexity", "How the extra memory an algorithm needs grows as `n` grows, not counting the input itself."],
    ["Big-O", "A way to write growth that keeps only the fastest-growing term and drops constant factors. An algorithm that takes `3n + 5` steps is O(n)."],
    ["worst case", "The input of size `n` that takes the most steps. Big-O sets an upper limit on growth, so it can describe any case. In this course, a cost with no label means the worst case."],
    ["index", "The position number of an item in an array. Most languages start at 0, so the last index is `n - 1`."],
    ["contiguous", "Next to each other with no gaps, whether in memory or in an array."],
    ["subarray", "A contiguous run of items taken from an array. In `[4, 7, 2, 9]`, `[7, 2]` is a subarray and `[4, 2]` is not."],
    ["window", "A subarray you track by its left and right indexes as it moves along the array."],
    ["prefix sum", "The total of the first `i` items of an array. For `[3, 1, 4]` the prefix sums are 0, 3, 4 and 8."],
    ["pointer", "In this section, a variable that holds an index into an array, such as `lo` or `hi`."],
    ["amortized", "Averaged over a long run of operations. A rare slow step is spread across many fast ones."],
    ["dynamic array", "An array that grows by copying its items into a bigger block when it fills up. Python's `list` and Java's `ArrayList` work this way."],
    ["`log n`", "Roughly how many times you can halve `n` before you reach 1. For `n` = 1,000 that is about 10, so O(n log n) grows only a little faster than O(n)."],
    ["address", "The number that names a place in memory. An array's start address is where its first item sits."]
  ],
  cheat: {
    head: ["Operation", "Time", "Extra space", "Note"],
    rows: [
      ["Read `a[i]`", "O(1)", "O(1)", "The address is the start plus `i` times the item size."],
      ["Search an unsorted array", "O(n)", "O(1)", "In the worst case you look at every item."],
      ["Append to a dynamic array", "O(1) amortized", "O(1) amortized", "A full array copies itself into a bigger block, but rarely."],
      ["Insert or delete in the middle", "O(n)", "O(1)", "Every later item shifts one slot."],
      ["Two pointers on a sorted array", "O(n)", "O(1)", "Each step moves one pointer inward."],
      ["Sliding window", "O(n)", "O(1)", "Each item enters the window once and leaves once."],
      ["Build prefix sums", "O(n)", "O(n)", "One pass fills a table of `n + 1` totals."],
      ["Range-sum query", "O(1)", "O(1)", "With prefix sums in `p`, the sum from index `l` to `r` is one subtraction, `p[r + 1] - p[l]`."]
    ]
  },
  patterns: [
    ["A sorted array and a pair that must meet a target sum.", "Walk two pointers in from both ends. See [[two-pointers]]."],
    ["The best or total of a contiguous run under a condition, such as `k` items in a row.", "Slide a window along the array. See [[sliding-window]]."],
    ["Many range-sum questions on data that does not change.", "Build prefix sums once. See [[prefix-sums]]."],
    ["Nested loops over one array.", "Ask whether a pointer or a window can replace the inner loop, turning O(n²) into O(n)."]
  ],
  tips: [
    "Count the worst case. An early `return` can make one run fast, but a cost quoted with no label means the slowest input of size `n`.",
    "Watch the last index. An array of `n` items ends at index `n - 1`, and reading `a[n]` is out of range.",
    "Two pointers need sorted input. If the input arrives unsorted, sorting it takes more time than the O(n) walk, so the sort becomes the slowest part.",
    "Prefix sums go stale. If one value changes, every total after it is wrong until you rebuild in O(n).",
    "Inserting at the front of an array shifts every item. Doing it `n` times in a loop costs O(n²)."
  ],
  cases: [
    {
      title: "Running balances on a bank statement",
      setting: "A bank statement lists each deposit and withdrawal in date order, with the balance after each one.",
      idea: "Each balance is the opening balance plus a prefix sum of the transactions. The net change between two dates is one subtraction of two balances.",
      why: "Past transactions do not change, so the totals are worked out once. Every range question after that costs O(1)."
    },
    {
      title: "Requests in the last 60 seconds",
      setting: "A web service lets each client make, say, 100 requests in any 60 seconds. A rate limiter decides on every request whether to accept it.",
      idea: "A sliding window over time holds the timestamps of recent requests. New requests enter the window, and requests older than 60 seconds leave it.",
      why: "Each request enters the window once and leaves once, so the work stays small however long the service runs. Here the window is measured in seconds, not in items."
    },
    {
      title: "Merging two sorted logs by time",
      setting: "Two servers each write a log file sorted by time. You need one combined log, still in time order.",
      idea: "Keep one pointer in each log. Copy whichever current line is earlier, then move that pointer forward.",
      why: "Each line is copied once, so logs of `m` and `n` lines merge in O(m + n) time. It is the same merge step that [[merge-sort]] uses."
    }
  ],
  hooks: {
    "big-o-by-counting": "Count loop steps in a sum and an all-pairs check, and watch O(n) and O(n²) pull apart.",
    arrays: "See why indexing is instant and why inserting in the middle shifts everything after it.",
    strings: "Read characters by index, build a reversed copy, and test for a palindrome.",
    "two-pointers": "Find a pair with a target sum by walking in from both ends of a sorted array.",
    "sliding-window": "Find the best sum of `k` items in a row by adding one item and dropping one.",
    "prefix-sums": "Build running totals once, then answer any range sum with one subtraction."
  }
};

export default foundations;

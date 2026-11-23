import type { Guide } from "../types";

const advanced: Guide = {
  section: "advanced",
  tagline: "Three tools beyond the basics, namely bit tricks, greedy choices and the segment tree.",
  core: [
    "The three lessons here are separate techniques, and each is worth knowing on its own. **Bit manipulation** works on the bits of a number directly, which makes flags and some counting very cheap. A **greedy** method makes the locally best choice at each step and never looks back. A **segment tree** answers range queries and takes point updates in O(log n).",
    "Each tool has a condition for when it is safe. A bit trick needs you to know how the number is stored. A greedy method needs a proof that the local choice never hurts, called an exchange argument. A segment tree pays off when the data changes between questions.",
    "None of them depends on the others. Read the part that matches your problem, and treat the rest as a menu."
  ],
  analogy:
    "Think of a toolbox with three unrelated tools. A bit trick is a small precise screwdriver. Greedy is a hammer that is perfect for nails and wrong for screws. A segment tree is a drill that earns its weight on larger jobs.",
  prereqs: [
    "The [[arrays]] lesson. Bits sit in a number like items in an array, and a segment tree can be stored in one.",
    "The [[merge-sort]] lesson. Greedy intervals sorts first, and the sort dominates the cost.",
    "The [[prefix-sums]] lesson. It answers range sums when nothing changes, and the segment tree takes over when values do change.",
    "The [[binary-heap]] lesson. A segment tree is a binary tree laid out in an array, like a heap."
  ],
  terms: [
    ["bit", "A single 0 or 1. A number is stored as a row of bits, and a bit that is 1 is called set."],
    ["mask", "A number used to pick out or change certain bits, such as `1 << 3` for bit 3."],
    ["two's complement", "The usual way computers store negative whole numbers. To negate a number, flip every bit and add 1. So -x keeps the lowest set bit of x and every bit below it, flips the bits above, and `x & -x` isolates that bit."],
    ["greedy choice", "The locally best pick at the current step, such as the interval that ends first, made without revisiting it."],
    ["exchange argument", "A proof that swapping the first choice of any best answer for the greedy choice keeps the answer as good."],
    ["segment", "A range of positions written `l..r`. A segment tree stores one sum for each range that repeated halving produces."],
    ["range query", "A question about a stretch of positions, such as the sum of positions 3 to 7."],
    ["point update", "Changing one value in place. The tree then fixes only the sums on the path above it."]
  ],
  cheat: {
    head: ["Question", "Use", "Time"],
    rows: [
      ["Count set bits (k is how many are set)", "[[bit-manipulation]]", "O(k)"],
      ["Test for a power of two", "[[bit-manipulation]]", "O(1)"],
      ["Most non-overlapping intervals (n intervals)", "[[greedy-intervals]]", "O(n log n)"],
      ["Range sum with changing values (n positions)", "[[segment-tree]]", "O(log n)"],
      ["Range sum when nothing changes", "[[prefix-sums]]", "O(1)"]
    ]
  },
  patterns: [
    ["You need many on or off flags in one value, or the lowest set bit of a number.", "Use bit operations. `x & (x - 1)` clears the lowest set bit. See [[bit-manipulation]]."],
    ["You must pick the most jobs that never overlap.", "Sort by end and take each job that fits. See [[greedy-intervals]]."],
    ["You ask for sums of ranges and also change single values.", "Keep a segment tree. See [[segment-tree]]."],
    ["You ask for range sums and nothing ever changes.", "Build one prefix-sum array and subtract. See [[prefix-sums]]."]
  ],
  tips: [
    "Use a mask to read a bit. `(x >> k) & 1` gives bit k, and `x | (1 << k)` sets it.",
    "Know the width of your number type. A shift past the edge drops bits, and a left shift can change the sign.",
    "Before using greedy, try to break it. Pick a small input and compare it with an exhaustive answer. One counterexample settles it.",
    "Greedy is not a different name for DP. Taking the biggest coin first is wrong for coins 1, 3 and 4 at amount 6, where [[coin-change]] finds the fewest.",
    "Sorting by the wrong key is the common greedy bug. For intervals, sort by end, not by start or by length.",
    "Choose a segment tree when updates and queries are mixed. If nothing changes, a prefix-sum array is shorter and answers in O(1)."
  ],
  cases: [
    {
      title: "Permission flags",
      setting: "A file system stores whether a user may read, write or run a file. Millions of files carry these three yes or no answers.",
      idea: "Pack the three flags into the bits of one small number. A mask tests, sets or clears each flag with one operation.",
      why: "One number holds all the flags, and each operation touches every bit at once in O(1)."
    },
    {
      title: "Booking one meeting room",
      setting: "A room can hold one meeting at a time, and many people request a time slot. The goal is to fit the most meetings.",
      idea: "Sort the requests by end time and accept each one that starts at or after the end of the last accepted one.",
      why: "The exchange argument shows that the earliest-ending meeting is never worse than any other first choice, so the greedy count is the best possible."
    },
    {
      title: "Live leaderboard totals",
      setting: "A game shows the combined score of any range of players, while scores change after every match.",
      idea: "Store the players in a segment tree. A change fixes one path, and a range total reads a few stored sums.",
      why: "Both operations touch a few nodes per level, so each is O(log n). A prefix-sum array would need O(n) work to refresh after a change."
    }
  ],
  hooks: {
    "bit-manipulation": "Read a number as switches, combine rows with AND, OR and XOR, and clear the lowest set bit.",
    "greedy-intervals": "Sort by end, keep what fits, and see why the earliest end is safe.",
    "segment-tree": "Store the sum of every halved range, then answer range sums and apply point updates in O(log n)."
  }
};

export default advanced;

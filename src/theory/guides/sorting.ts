import type { Guide } from "../types";

const sorting: Guide = {
  section: "sorting",
  tagline: "How to find a value in an array, and how to put an array in order so that later searches get faster.",
  core: [
    "Say you look for 4 in [7, 3, 9, 4, 1, 8]. The values are in no order, so you check them one by one from the left. That is linear search, and it can take n checks. If the array is sorted, smallest to largest, you can check the middle first. One comparison then rules out half the array. That is binary search, and it needs about log₂ n checks.",
    "The simple sorts, bubble, selection and insertion, compare values pair by pair. They take O(n²) time in the worst case, because each value may be compared with up to n others. Merge sort and quick sort use divide and conquer: split the array, sort the parts, then combine them. Halving gives about log₂ n levels of O(n) work each. So merge sort always takes O(n log n), and quick sort does on average.",
    "No comparison sort beats O(n log n) in the worst case. n values can stand in `n!` orders, where `n!` (n factorial) is n × (n − 1) × … × 1. Each comparison has two outcomes, so telling the orders apart takes about n log₂ n comparisons. Counting sort escapes that limit because it never compares. It counts each small whole number, then writes the values back in order."
  ],
  analogy:
    "Picture a shelf of library books. If they stand in random order, you read every spine until you find yours. If they are sorted by title, you open near the middle, see whether your title comes before or after, and ignore the other half. Sorting is the work of putting the shelf in order once, so that every later search is fast.",
  prereqs: [
    "The [[arrays]] lesson: reading `a[i]` by its index, and why a loop over n cells costs O(n).",
    "The [[big-o-by-counting]] lesson, for counting steps and writing costs such as O(n) and O(n²).",
    "The [[guide:recursion|Recursion guide]], for merge sort and quick sort. Both call themselves on smaller parts of the array."
  ],
  terms: [
    ["sorted", "In order from smallest to largest. [1, 2, 4, 5, 8] is sorted. Equal values may sit side by side."],
    ["comparison", "Asking which of two values is smaller, or whether they are equal, such as `a[j] > a[j + 1]`."],
    ["swap", "Exchanging the values in two cells, so each value moves to the other's place."],
    ["in place", "Sorting inside the array itself, with only a few extra variables. The call stack, the memory for calls not yet returned, may add some more."],
    ["stable", "A sort is stable when equal values keep the order they had before. If 3a comes before 3b, a stable sort keeps 3a first."],
    ["pivot", "The value quick sort splits a range around. In this course it is the last value of the range."],
    ["partition", "Rearranging a range so values smaller than the pivot sit left of it and the rest sit right. The pivot is then in its final place."],
    ["divide and conquer", "Solving a problem by splitting it into smaller parts, solving each part the same way, then combining the answers."],
    ["logarithm", "log₂ n is how many halvings reach 1, starting from n. Halving 8 gives 4, 2, 1, so log₂ 8 is 3. It grows very slowly."],
    ["best, average and worst case", "The cost on the luckiest input, on typical inputs, and on the unluckiest input. A cost with no label is the worst case."],
    ["comparison sort", "A sort that learns the order only by comparing pairs of values. Every sort here except counting sort is one."],
    ["record", "An item that carries other data along with the value it is sorted by, such as a row with a name and an age."],
    ["merge", "Combining two sorted runs (stretches already in order) into one sorted run by taking the smaller front value again and again."]
  ],
  cheat: {
    head: ["Algorithm", "Best", "Average", "Worst", "Extra space", "Stable"],
    rows: [
      ["Linear search", "O(1)", "O(n)", "O(n)", "O(1)", "n/a"],
      ["Binary search (sorted input only)", "O(1)", "O(log n)", "O(log n)", "O(1)", "n/a"],
      ["Bubble sort (with early exit)", "O(n)", "O(n²)", "O(n²)", "O(1)", "yes"],
      ["Selection sort", "O(n²)", "O(n²)", "O(n²)", "O(1)", "no"],
      ["Insertion sort", "O(n)", "O(n²)", "O(n²)", "O(1)", "yes"],
      ["Merge sort", "O(n log n)", "O(n log n)", "O(n log n)", "O(n)", "yes"],
      ["Quick sort", "O(n log n)", "O(n log n)", "O(n²)", "O(log n) stack on average", "no"],
      ["Counting sort (k = largest value + 1)", "O(n + k)", "O(n + k)", "O(n + k)", "O(k)", "n/a: this version rewrites values instead of moving records"]
    ]
  },
  patterns: [
    ["You have sorted data and need to look up a value, or show it is absent.", "Use binary search. Each probe, one look at a middle cell, halves the range. See [[binary-search]]."],
    ["The input is small, or nearly sorted already.", "Use insertion sort. Each value stops after a few comparisons. See [[insertion-sort]]."],
    ["The sort must be stable and must stay O(n log n) on every input.", "Use merge sort. See [[merge-sort]]."],
    ["The values are whole numbers from a small range, such as 0 to 9.", "Use counting sort, which never compares. See [[counting-sort]]."]
  ],
  tips: [
    "Binary search on unsorted data gives wrong answers with no error. Sort first, or make sure the data is sorted.",
    "Sorting first costs O(n log n). It pays off before binary search only when you search the same data many times.",
    "Quick sort's extra space is O(log n) stack on average. If every pivot is the largest or smallest value, the stack reaches O(n) depth, and time becomes O(n²).",
    "Sorted input is the worst case for quick sort when the pivot is the last value. A random pivot makes that very unlikely.",
    "Stability matters when equal keys carry other data, such as two rows with the same surname. For plain numbers, equal values look the same either way.",
    "Counting sort needs one counter per possible value. Values up to a million need a million counters, even to sort 5 of them."
  ],
  cases: [
    {
      title: "Finding a bad commit with `git bisect`",
      setting: "Git is a tool that records a project's history as commits, saved snapshots of the code in time order. A bug appeared somewhere in the last 1,000 commits.",
      idea: "`git bisect` is a Git command that runs binary search over the commits. It checks out the middle commit, putting that version of the code in your folder, and you test it. If the bug is there, the bad commit is at or before it. Otherwise it is after.",
      why: "Once the bug is in, every later commit has it, so the commits run good then bad, like sorted data. Each test rules out half, so about 10 tests cover 1,000 commits."
    },
    {
      title: "Sorting a spreadsheet by two columns",
      setting: "A spreadsheet is a table of rows and columns. You have people with a city and a name, and want them by city, with names in order within each city.",
      idea: "Sort by name first. Then sort by city with a stable sort. Rows with the same city keep the name order from the first sort.",
      why: "A stable sort keeps the earlier order among equal keys. An unstable sort, such as quick sort, could shuffle the names inside each city."
    },
    {
      title: "How a library picks its default sort",
      setting: "A programming language ships a built-in sort. It must be fast on any input: huge, tiny, sorted, reversed or nearly sorted.",
      idea: "Python's sort and Java's sort for objects use Timsort, a merge sort that uses insertion sort on short pieces. C++ `std::sort` is usually introsort. That is quick sort, with insertion sort for small ranges and heap sort, another O(n log n) sort, if the recursion gets too deep.",
      why: "Each sort covers another's weakness. Insertion sort is fast on short runs. Merge sort is stable with a guaranteed O(n log n). Quick sort is fast in practice, and the switch caps its worst case."
    }
  ],
  hooks: {
    "linear-search": "Check every cell from the left and stop at the first match.",
    "binary-search": "Halve a sorted range at its middle until the target turns up.",
    "bubble-sort": "Swap neighbours that are out of order until a pass makes no swaps.",
    "selection-sort": "Scan for the smallest value left and swap it to the front.",
    "insertion-sort": "Slide each value left into a sorted front part that grows by one.",
    "merge-sort": "Split in half, sort each half, and merge the halves back in order.",
    "quick-sort": "Partition around a pivot, then sort each side the same way.",
    "counting-sort": "Count each small value, then write them back in order with no comparisons."
  }
};

export default sorting;

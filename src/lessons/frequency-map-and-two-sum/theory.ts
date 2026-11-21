import type { LessonTheory } from "../../theory/types";

const theory: LessonTheory = {
  definition:
    "A frequency map counts how often each value appears, and two-sum finds two indexes whose values add up to a target. Both make one pass over the array and let a hash map remember what you have seen.",
  analogy:
    "Think of a shop assistant tallying sales on a notepad, one mark per item sold. Now a customer has a 9 euro voucher and wants two items that use it up. Holding a 1 euro item, the assistant asks one question: have we seen an 8 euro item yet?",
  steps: [
    "A map, or hash map, stores pairs of a key and a value. You give it a key, the label you look up by, and it returns that key's value.",
    "It hashes the key, turning it into an array index, so `get` and `put` take O(1) on average. Average means typical inputs, not every input. See [[guide:hashing]].",
    "To count, start with an empty map `count`. For each value `x`, set `count[x]` to its old count plus 1, or to 1 if `x` is new.",
    "For two-sum, start with an empty map `seen` from value to index. For each `x` at index `i`, compute `need = target - x`.",
    "If `need` is a key in `seen`, return `[seen[need], i]`. Otherwise store `seen[x] = i` and move on.",
    "Check before you store. Then `x` is only compared with earlier values, so it never pairs with itself."
  ],
  ops: [
    ["count", "O(n) average time", "One pass, with one O(1) average map update per value. O(n²) worst if every key collides."],
    ["two-sum", "O(n) average time, O(n) space", "One lookup and one store per value. `seen` may end up holding every value."],
    ["brute force two-sum", "O(n²) time, O(1) space", "Checking every pair means about n²/2 sums, with no map."]
  ],
  useWhen: [
    "You need how many times each value appears, such as the most common item.",
    "You must find a partner value fast, such as two numbers that add up to a target, in an array that is not sorted.",
    "You can spare O(n) memory to save time. The map holds what a nested loop would recompute."
  ],
  avoidWhen: [
    "Memory is very tight. The map can grow to one entry per value.",
    "The array is already sorted. Two pointers from both ends find a pair in O(n) time and O(1) space, with no hashing. See [[two-pointers]]."
  ],
  example: [
    "Take `[3, 5, 1, 5, 8, 4]` with target 9. Counting gives `{3: 1, 5: 2, 1: 1, 8: 1, 4: 1}`, so 5 appears twice.",
    "Two-sum starts at 3, which needs 6. 6 is not in `seen`, so store `seen[3] = 0`. 5 needs 4, a miss, so store `seen[5] = 1`.",
    "1 needs 8, a miss, so store `seen[1] = 2`. The second 5 needs 4, another miss, and updates `seen[5]` to 3.",
    "At index 4, 8 needs 1. `seen[1]` is 2, so return `[2, 4]`, since 1 + 8 = 9."
  ],
  pitfalls: [
    "Storing `x` before checking for `need`. With target 10 and `x = 5`, the 5 would find itself and return a false pair.",
    "Looping over every pair out of habit. That costs O(n²), because each of the `n` values is compared with all the others.",
    "Counting with a plain array indexed by value. It needs one slot for every possible value, which can be huge or negative."
  ]
};

export default theory;

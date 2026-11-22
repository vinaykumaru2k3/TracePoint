import type { LessonTheory } from "../../theory/types";

const theory: LessonTheory = {
  definition:
    "A hash table with chaining is an array of buckets, where each bucket holds a short list, its chain, of the keys that land there. A hash function turns each key into a bucket number, so a lookup scans one chain instead of every key.",
  analogy:
    "Think of a wall of mail slots sorted by the last digit of a flat number. To find mail for flat 27, you go straight to slot 7. Several flats share that slot, so you leaf through the few letters in it. You never touch the other slots.",
  steps: [
    "A key is the thing you store or look up. Here the table is a set, a collection that holds each key once, and the keys are numbers.",
    "The table is an array of 5 buckets, slots that each hold a chain. A chain is a linked list: nodes, small objects that each hold a key and a pointer, the address of the next node. See [[singly-linked-list]].",
    "To place a key, hash it with `key % 5`, the remainder after dividing by 5. That number is the key's bucket. `12 % 5` is 2, so 12 goes in bucket 2.",
    "Two keys that land in the same bucket are a collision. Both stay in that bucket's chain, one after the other.",
    "To add, scan the bucket's chain. If the key is there, return false, because a set keeps one copy. Otherwise append it and return true.",
    "To check or remove, hash the key and scan only that chain. Return false if the chain ends without the key. Remove unlinks the matching node.",
    "The load factor is keys divided by buckets. When it grows, chains get long, so real tables resize: they build a bigger array and rehash every key. See [[guide:hashing]]."
  ],
  shots: [1, 1, 2, 10, 6, 21, 27],
  ops: [
    ["`add(k)`", "O(1) average, O(n) worst", "Average means typical inputs, with keys spread across buckets. The worst case is every key in one chain, so you scan them all."],
    ["`contains(k)`", "O(1) average, O(n) worst", "A miss scans the whole chain, which stays short while keys are spread out."],
    ["`remove(k)`", "O(1) average, O(n) worst", "Find the node in its chain, then unlink it. Other buckets are untouched."],
    ["resize", "O(n) once, O(1) amortized per add", "Real tables double the array and hash every key again. Doubling makes this rare, so averaged over many adds (amortized) it costs O(1) each."]
  ],
  useWhen: [
    "You need to ask \"is this key here?\" many times, and fast. A list would scan every key each time.",
    "Keys arrive and leave in any order, and you do not need them sorted.",
    "You want a table that keeps working as it fills, since a chain can always grow by one more node."
  ],
  avoidWhen: [
    "You need keys in sorted order, or the smallest key. A hash table keeps them by bucket, so use a sorted structure instead.",
    "Your keys share a pattern that the hash maps to one bucket, such as all multiples of 5 with `% 5`. Every lookup then costs O(n)."
  ],
  example: [
    "Add 12, 7 and 22. All three give `% 5 = 2`, so bucket 2's chain is 12 → 7 → 22. Then add 3, which goes in bucket 3.",
    "`contains(17)` hashes to bucket 2 and compares 12, 7 and 22. The chain ends, so it returns false.",
    "`contains(22)` hashes to bucket 2, compares 12 and 7, then finds 22 and returns true.",
    "`remove(7)` finds 7 in bucket 2 and unlinks it, leaving 12 → 22. `add(15)` hashes to empty bucket 0.",
    "The set now holds 4 keys in 5 buckets, a load factor of 0.8."
  ],
  pitfalls: [
    "Using a hash that maps many keys to one bucket. The chain then holds most keys, and each lookup scans them all in O(n).",
    "Forgetting the duplicate check in `add`. Without it, a set stores the same key twice, and remove leaves one copy behind.",
    "Never resizing. With a fixed bucket count, the load factor keeps climbing, so chains grow and every operation slows down."
  ]
};

export default theory;

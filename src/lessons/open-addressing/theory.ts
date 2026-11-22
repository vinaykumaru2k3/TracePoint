import type { LessonTheory } from "../../theory/types";

const theory: LessonTheory = {
  definition:
    "Open addressing is a hash table, a structure that computes where each key lives, that keeps every key in one array. When a key's slot is taken, it probes, or tries, the following slots until it finds a free one.",
  analogy:
    "Think of a car park where your ticket names a space. If someone is already in it, you take the next space along the row. To find your car later, you start at the named space and walk forward until you reach it.",
  steps: [
    "A key is the thing you store or look up. Here the table is a set, a collection that holds each key once, in an array of 7 slots.",
    "A hash function turns a key into a slot number. Here it is `key % 7`, the remainder after dividing by 7, and the result is the key's home slot.",
    "Two keys with the same home slot are a collision. Linear probing settles it: try the next slot, wrapping from slot 6 back to slot 0.",
    "To add, probe from home. Stop at an empty slot and write the key there. If you meet the key itself first, return false.",
    "To check, probe from home the same way. Finding the key returns true. An empty slot returns false, because an add would have stopped there.",
    "To remove, find the key and leave a tombstone, a marker that means \"a key was here, keep probing\". An empty slot would cut later searches short.",
    "A later add can write into the first tombstone it passed. It still probes to an empty slot first, to check the key is not further on."
  ],
  shots: [1, 2, 6, 10, 24, 19, 30],
  ops: [
    ["`add(k)`", "O(1) average, O(n) worst", "Average means typical inputs, with the table mostly empty. A long run of taken slots means probing through all of them."],
    ["`contains(k)`", "O(1) average, O(n) worst", "It walks the same probe path as `add`, past keys and tombstones."],
    ["`remove(k)`", "O(1) average, O(n) worst", "Find the key, then write a tombstone. Nothing moves."]
  ],
  useWhen: [
    "You want a hash set or map in one plain array, with no list nodes to allocate.",
    "The load factor, keys divided by slots, stays low, so probe paths stay short."
  ],
  avoidWhen: [
    "The table will be nearly full. Probe paths grow long, and a full table cannot take another key, as this lesson's array of 7 shows.",
    "You remove keys often. Tombstones pile up, and searches must walk past every one, so real tables clean them up when they resize. See [[guide:hashing]]."
  ],
  example: [
    "Add 10, 3, 17 and 24. All four have home slot 3, so they fill slots 3, 4, 5 and 6 in that order.",
    "`remove(17)` probes slots 3 and 4, finds 17 in slot 5, and leaves a tombstone there.",
    "`contains(24)` probes slots 3 and 4, walks past the tombstone in slot 5, and finds 24 in slot 6. It takes 4 probes.",
    "`add(31)` has home slot 3. It remembers the tombstone in slot 5 and probes on to empty slot 0, so 31 is not in the set.",
    "31 is written into slot 5, reusing the tombstone."
  ],
  pitfalls: [
    "Emptying a slot on remove. In the example, an empty slot 5 would stop `contains(24)` there, so it would wrongly return false.",
    "Writing into the first tombstone without probing on. The key may already sit further along, and the set would then hold it twice.",
    "Letting the table fill up. Probe paths get longer as clusters, runs of taken slots, join up, so real tables resize well before they are full."
  ]
};

export default theory;

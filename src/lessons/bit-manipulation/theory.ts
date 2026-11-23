import type { LessonTheory } from "../../theory/types";

const theory: LessonTheory = {
  definition:
    "A bit is a single 0 or 1, and bit manipulation works on the bits of a number directly. Operators such as `&`, `|`, `^`, `<<` and `>>` each handle every bit position in one step.",
  analogy:
    "Picture a row of 8 light switches. A number is a pattern of switches that are on or off. AND, OR and XOR compare two rows switch by switch, and a shift slides the whole row sideways.",
  steps: [
    "Write the number as 8 bits. Bit 0 is the rightmost bit and bit 7 is the leftmost. A bit that is 1 is called set. For example, 13 is 00001101, so bits 3, 2 and 0 are set.",
    "AND compares two numbers column by column. A result bit is set only where both inputs have a 1. In `13 & 6`, only bit 2 is set in both, so the result is 4. A number used this way to pick bits is called a mask.",
    "OR sets a result bit where either input has a 1. In `13 | 6`, the set bits of both numbers combine, and the result is 15.",
    "XOR sets a result bit where the two inputs differ. In `13 ^ 6`, bit 2 matches and is cleared, while the other set bits stay, so the result is 11.",
    "A shift slides every bit sideways by k places. `13 << 1` moves each bit one place left and gives 26. A bit pushed past the edge is dropped, so the code keeps only 8 bits with `& 0xFF`. `13 >> 2` drops the low bit and gives 3.",
    "To count set bits, clear the lowest one with `n & (n - 1)`. Subtracting 1 turns the lowest set bit into 0 and the bits below it into 1, so the AND removes only that bit. Count each clear.",
    "Repeat until n is 0. The number of clears is the number of set bits, so 13 takes 3 passes and the count is 3.",
    "To test for a power of two, run `n & (n - 1)` once. A power of two has exactly one set bit, so clearing it leaves 0. For 16 the result is 0 and the answer is true."
  ],
  shots: [1, 2, 3, 4, 5, 7, 10, 11],
  ops: [
    ["AND, OR, XOR", "O(1)", "One operation on the whole number, whatever the bit positions are."],
    ["shift", "O(1)", "One operation moves every bit at once."],
    ["count bits", "O(k)", "Here k is the number of set bits. Each pass of the loop clears one."],
    ["power of two", "O(1)", "One subtraction, one AND and one comparison with 0."]
  ],
  useWhen: [
    "You need to pack several on or off flags into one number, instead of keeping a separate array of booleans as in [[arrays]].",
    "You test whether a number is a power of two, or count how many bits it has set, and want it in a few operations."
  ],
  avoidWhen: [
    "Clear code matters more than speed. A plain comparison or an arithmetic expression often reads better than a bit trick.",
    "The value is negative or has more than 8 bits. This lesson shows only values from 0 to 255, so signs and wider numbers need extra care."
  ],
  example: [
    "Take 13 and 6. As 8 bits they are 00001101 and 00000110.",
    "AND keeps bit 2, the only column where both have a 1. `13 & 6` is 00000100, which is 4.",
    "Shift 200 left by one. 200 is 11001000, and bit 7 is set. It moves past the edge and is dropped, so `200 << 1` is 144.",
    "Count the bits of 13. Clearing the lowest set bit gives 12, then 8, then 0. That took 3 clears, so 13 has 3 set bits.",
    "Test 16 with `16 & 15`. 16 is 00010000 and 15 is 00001111, so they share no set bit. The result is 0 and 16 is a power of two."
  ],
  pitfalls: [
    "Reading ~~bit 0 as the leftmost bit~~. Bit 0 is the rightmost bit, and the numbers grow toward the left.",
    "Forgetting to mask after a left shift. Java, Python and C++ all hold more than 8 bits in an int, so `200 << 1` gives 400 until you apply `& 0xFF`.",
    "Skipping the `n > 0` check in the power-of-two test. For 0, `n & (n - 1)` is 0 too, but 0 has no set bit and is not a power of two.",
    "Counting a bit position as a value. A set bit 3 adds 8 to the number, not 3, because each position is worth a power of two."
  ]
};

export default theory;

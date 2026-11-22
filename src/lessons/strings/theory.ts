import type { LessonTheory } from "../../theory/types";

const theory: LessonTheory = {
  definition:
    "A string is a sequence of characters stored in order, like an array of letters. In Java and Python a string **cannot change once it is made**, so you build a new one instead.",
  analogy:
    "A string is like a word printed on a card. You can read any letter on it, but you cannot rub one out. To get the word backwards, you copy its letters onto a fresh card in the other order.",
  steps: [
    "Read a character by index with `s[i]`. It takes one step, as with an array.",
    "To reverse, create an empty builder. A builder is a growable list of characters that you add to.",
    "Loop `i` from the last index, `n - 1`, down to 0, and append `s[i]` to the builder.",
    "Turn the builder into a new string. That string is the reverse.",
    "A palindrome is a word that reads the same both ways, such as `level`. To test for one, compare `s` with its reverse, one character at a time.",
    "Stop at the first mismatch. If every character matches, the word is a palindrome."
  ],
  shots: [1, 2, 5, 8, 9, 9],
  ops: [
    ["`s[i]`", "O(1)", "Reads one character by index."],
    ["append to a builder", "O(1)", "Amortized, since the builder sometimes grows by copying."],
    ["reverse", "O(n)", "One append per character, then one copy into a string."],
    ["equals", "O(n)", "Can stop early at a mismatch, but the worst case checks all `n` characters."]
  ],
  useWhen: [
    "You build text piece by piece. Collect the pieces in a builder and make the string once at the end.",
    "You read or compare text by position, such as checking the first and last letters."
  ],
  avoidWhen: [
    "You add to a string with `+` inside a loop. Each step can copy the whole string, which adds up to O(n²).",
    "You change characters in place often. Work on a character array or list, then turn it into a string at the end."
  ],
  example: [
    "Take `s = \"level\"`, with indexes 0 to 4.",
    "Read it backwards, `l`, `e`, `v`, `e`, `l`. The builder now holds `\"level\"`.",
    "Compare that with `s` one character at a time. All 5 match, so `level` is a palindrome.",
    "With `stack`, the reverse is `kcats`. The first characters, `s` and `k`, differ, so the check stops there."
  ],
  pitfalls: [
    "Building with `+` in a loop. Use a builder or a list and join once.",
    "Getting the reverse loop bounds wrong. Start at `n - 1`, not ~~`n`~~, and include index 0.",
    "Comparing strings with ~~`==`~~ in Java. It checks whether they are the same object, not the same letters, so use `equals`."
  ]
};

export default theory;

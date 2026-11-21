import type { ParseResult, Step } from "../../engine/types";

export const MAX_WORD = 9;

export interface StringState {
  s: string[];
  out: string[];
  /** Index being read from s, or -1. */
  i: number;
  phase: "build" | "compare" | null;
  /** Result of the final equals check, once made. */
  same: boolean | null;
}

/** One word, letters only. */
export function parseWord(text: string): ParseResult<string> {
  const w = text.trim().toLowerCase();
  if (!w) return { ok: false, error: "Type a word." };
  if (!/^[a-z]+$/.test(w)) return { ok: false, error: "Letters only, no spaces or digits." };
  if (w.length < 3) return { ok: false, error: "Use at least 3 letters." };
  if (w.length > MAX_WORD) return { ok: false, error: `Keep it to ${MAX_WORD} letters so every cell fits.` };
  return { ok: true, input: w };
}

/** Reverses a word with a builder, one append per step, then checks whether it is a palindrome. */
export function generateString(word: string): Step<StringState>[] {
  const s = word.split("");
  const n = s.length;
  const out: string[] = [];
  const snap = (st: Omit<Step<StringState>, "state">, extra: Partial<StringState> = {}): Step<StringState> => ({
    ...st, state: { s, out: out.slice(), i: -1, phase: null, same: null, ...extra }
  });

  const steps: Step<StringState>[] = [snap({
    kind: "problem", op: null, anchors: [], notes: {},
    title: "A string is a row of characters",
    idea: "Each character has an index, just like an array slot.",
    text: `"${word}" is ${n} characters, indexes 0 to ${n - 1}. Strings cannot be changed in place, so to reverse one we build a new string. Then we check whether the word reads the same both ways.`
  }), snap({
    kind: "add", op: "new builder", anchors: ["rev.sig", "rev.new"],
    notes: { "rev.new": "an empty, growable buffer of characters" },
    title: "Start an empty builder",
    idea: "A builder is a growable character array. Appending is O(1) on average.",
    text: `s itself is read-only. Instead of gluing strings together, which copies the whole string each time, the code collects characters in a builder.`
  }, { phase: "build" })];

  for (let i = n - 1; i >= 0; i--) {
    out.push(s[i]);
    steps.push(snap({
      kind: "add", op: `append s[${i}]`,
      anchors: ["rev.sig", "rev.loop", "rev.append"],
      notes: { "rev.loop": `i = ${i}`, "rev.append": `appends '${s[i]}', builder holds "${out.join("")}"` },
      title: i === n - 1 ? "Read from the back" : `Append '${s[i]}'`,
      idea: "Walking i from the end to 0 visits the characters in reverse order.",
      text: i === n - 1
        ? `i starts at ${n - 1}, the last index. s[${i}] is '${s[i]}', so it goes into the builder first.`
        : `s[${i}] is '${s[i]}'. The builder now reads "${out.join("")}".`
    }, { i, phase: "build" }));
  }
  const rev = out.join("");
  steps.push(snap({
    kind: "found", op: `reverse("${word}")`, ret: `"${rev}"`, anchors: ["rev.sig", "rev.return"],
    notes: { "rev.return": `one copy into a new String: "${rev}"` },
    title: "Turn the builder into a string",
    idea: `n appends plus one final copy: reversing is O(n).`,
    text: `toString() copies the builder into a brand-new string, "${rev}". The original "${word}" was never modified.`
  }, { phase: "build" }));

  const same = rev === word;
  const diff = s.findIndex((c, k) => c !== out[k]);
  steps.push(snap({
    kind: "check", op: `isPalindrome("${word}")`, ret: String(same),
    anchors: ["pal.sig", "pal.check"],
    notes: { "pal.check": same ? `all ${n} characters match` : `first mismatch at index ${diff}: '${s[diff]}' vs '${out[diff]}'` },
    title: same ? "Same both ways" : "Not a palindrome",
    idea: "equals compares character by character and stops at the first difference.",
    text: same
      ? `"${word}" equals its reverse at every index, so it is a palindrome.`
      : `equals stops at index ${diff}: '${s[diff]}' in the word, '${out[diff]}' in the reverse. "${word}" is not a palindrome.`
  }, { phase: "compare", same, i: same ? -1 : diff }));

  steps.push(snap({
    kind: "recap", op: null, anchors: [], notes: {},
    title: "What happened",
    idea: "Read by index, build new strings with a builder, compare character by character.",
    text: `Reading s[i] was O(1) each time. Building the reverse took ${n} appends and one copy, O(n). Comparing took up to ${n} character checks, also O(n).`
  }));
  return steps;
}

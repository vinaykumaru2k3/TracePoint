import { describe, expect, it } from "vitest";
import { checkGuide, checkTheory, checkText } from "./check";
import type { Guide, LessonTheory } from "./types";

const links = new Set(["stack", "queue", "guide:foundations"]);
const words = (n: number, w = "word") => Array(n).fill(w).join(" ");

const guide = (): Guide => ({
  section: "linear",
  tagline: "Structures that keep items in a line.",
  core: ["A line of items.", "You add and remove at the ends."],
  analogy: "A stack of plates.",
  prereqs: ["[[guide:foundations]]"],
  terms: [["a", "one"], ["b", "two"], ["c", "three"], ["d", "four"]],
  cheat: { head: ["op", "time", "note"], rows: [["a", "O(1)", "x"], ["b", "O(1)", "y"], ["c", "O(n)", "z"]] },
  patterns: [["s1", "m1"], ["s2", "m2"], ["s3", "m3"]],
  tips: ["t1", "t2", "t3"],
  cases: [
    { title: "A", setting: "s", idea: "i", why: "w" },
    { title: "B", setting: "s", idea: "i", why: "w" },
  ],
  hooks: { stack: "Last in, first out." },
});

const theory = (): LessonTheory => ({
  definition: "A stack is a pile. You add and remove at the top.",
  analogy: "A pile of plates.",
  steps: ["one", "two", "three"],
  shots: [1, 2, 3],
  ops: [["push", "O(1)", "adds"]],
  useWhen: ["a", "b"],
  avoidWhen: ["a", "b"],
  example: ["l1", "l2"],
  pitfalls: ["a", "b"],
});

describe("checkText", () => {
  it("accepts clean text, code spans with banned words and symbols", () => {
    expect(checkText("Use `just` and `a != b` here.", "w", links)).toEqual([]);
    expect(checkText("See [[stack|the stack]] and [[guide:foundations]].", "w", links)).toEqual([]);
  });
  it("flags a 26-word sentence", () => {
    const r = checkText(words(26) + ".", "w", links);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatch(/^w: .*sentence over 25 words/);
  });
  it("flags an 81-word paragraph of short sentences", () => {
    const r = checkText(Array(27).fill("one two three.").join(" ") , "w", links);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatch(/paragraph over 80 words/);
  });
  it("flags a banned word", () => {
    const r = checkText("This is just a stack.", "w", links);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatch(/banned word "just"/);
  });
  it("flags an exclamation mark", () => {
    const r = checkText("Done!", "w", links);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatch(/exclamation mark/);
  });
  it("flags unknown links, including soon lessons", () => {
    for (const t of ["[[binary-serach]]", "[[trees]]"]) {
      const r = checkText(t, "w", links);
      expect(r).toHaveLength(1);
      expect(r[0]).toMatch(/unknown link/);
    }
  });
});

describe("checkGuide", () => {
  it("accepts a valid guide", () => {
    expect(checkGuide(guide(), ["stack"], links)).toEqual([]);
  });
  it("needs 4 terms", () => {
    const g = guide(); g.terms = g.terms.slice(0, 3);
    const r = checkGuide(g, ["stack"], links);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatch(/terms: need at least 4/);
  });
  it("needs cheat rows as wide as the head", () => {
    const g = guide(); g.cheat.rows[1] = ["b", "O(1)"];
    const r = checkGuide(g, ["stack"], links);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatch(/cheat row 1 has 2 cells/);
  });
  it("needs a hook for every live lesson", () => {
    const r = checkGuide(guide(), ["stack", "queue"], links);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatch(/hooks: missing queue/);
  });
  it("rejects hooks for lessons that are not live", () => {
    const r = checkGuide(guide(), [], links);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatch(/hooks: extra stack/);
  });
  it("checks plain strings that render: case titles, cheat head, terms", () => {
    const g = guide(); g.cases[0].title = "Just a cache";
    const r = checkGuide(g, ["stack"], links);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatch(/banned word "just"/);
    const h = guide(); h.cheat.head[0] = "Easy op"; h.terms[0][0] = "Done!";
    expect(checkGuide(h, ["stack"], links)).toHaveLength(2);
  });
  it("rejects a tagline of two sentences", () => {
    const g = guide(); g.tagline = "One. Two.";
    expect(checkGuide(g, ["stack"], links)[0]).toMatch(/tagline/);
  });
});

describe("checkTheory", () => {
  it("accepts a valid theory", () => {
    expect(checkTheory(theory(), "stack", links)).toEqual([]);
  });
  it("needs 2 pitfalls", () => {
    const t = theory(); t.pitfalls = ["a"];
    const r = checkTheory(t, "stack", links);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatch(/pitfalls: need at least 2/);
  });
  it("limits the definition to 2 sentences", () => {
    const t = theory(); t.definition = "One. Two. Three.";
    const r = checkTheory(t, "stack", links);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatch(/definition: over 2 sentences/);
  });
});

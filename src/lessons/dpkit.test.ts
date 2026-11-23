import { describe, expect, it } from "vitest";
import { BLANK, blankGrid, paint, parseInts, parseWords, tableMemory, UNSET } from "./dpkit";
import { LESSONS } from "./index";

describe("blankGrid and paint", () => {
  it("makes rows x cols null cells", () => {
    const g = blankGrid(2, 3);
    expect(g).toHaveLength(2);
    expect(g[0]).toHaveLength(3);
    expect(g.flat().every((c) => c.v === null)).toBe(true);
  });
  it("paint returns a copy and leaves the input alone", () => {
    const g = blankGrid(2, 2);
    const p = paint(g, [[0, 1], [1, 0]], "compare");
    expect(p[0][1].state).toBe("compare");
    expect(p[1][0].state).toBe("compare");
    expect(p[0][0].state).toBeUndefined();
    expect(g[0][1].state).toBeUndefined();
    expect(p).not.toBe(g);
  });
  it("ignores cells outside the grid", () => {
    expect(() => paint(blankGrid(1, 1), [[5, 5]], "found")).not.toThrow();
  });
});

describe("tableMemory", () => {
  it("lists each row as a memory cell", () => {
    const g = paint([[{ v: 0 }, { v: 1 }, { v: null }]], [[0, 1]], "active");
    const m = tableMemory("dp", g, ["i0"], ["a", "b", "c"], "note");
    expect(m.title).toBe("dp");
    expect(m.note).toBe("note");
    expect(m.cells).toHaveLength(1);
    expect(m.cells[0].v).toBe("0 1 _");
    expect(m.cells[0].tag).toBe("row i0");
    expect(m.cells[0].act).toBe(true);
    expect(m.cells[0].live).toBe(true);
  });
  it("marks an all-null row not live", () => {
    expect(tableMemory("dp", blankGrid(1, 2), ["x"], ["a", "b"], "").cells[0].live).toBe(false);
  });
});

describe("tableMemory columns and blanks", () => {
  const grid = [[{ v: 3 }, { v: "" }, { v: "x" }, { v: null }], [{ v: 12 }, { v: 4 }, { v: "" }, { v: "" }]];
  const m = tableMemory("t", grid, ["r0", "r1"], ["a", "b", "c", "d"], "");
  it("names the columns from colHead and asks for the table layout", () => {
    expect(m.layout).toBe("table");
    expect(m.head).toBe("a  b c d");
  });
  it("shows empty and uncomputed cells as visible marks, aligned by column", () => {
    expect(m.cells[0].v).toBe(`3  ${BLANK} x ${UNSET}`);
    expect(m.cells[1].v).toBe(`12 4 ${BLANK} ${BLANK}`);
  });
  it("keeps every column the same width in the head and the rows", () => {
    const cols = (t: string) => t.split(" ").filter(Boolean).length;
    expect(cols(m.head!)).toBe(4);
    for (const c of m.cells) expect(cols(String(c.v))).toBe(4);
  });
  it("a row of covered plates is never blank", () => {
    const r = tableMemory("t", [[{ v: "" }, { v: "" }]], ["r"], ["0", "1"], "");
    expect(String(r.cells[0].v).trim()).toBe(`${BLANK} ${BLANK}`);
  });
});

describe("parseInts messages", () => {
  const example = (e: string) => /like "([^"]+)"/.exec(e)?.[1] ?? "";
  for (const o of [{ min: 0, max: 15, maxCount: 1 }, { min: 1, max: 20, maxCount: 1 }, { min: 1, max: 8, maxCount: 4 }, { min: 1, max: 9, maxCount: 2 }, { min: 1, max: 9, maxCount: 3, example: "2 4" }]) {
    it(`the empty-input example parses (${JSON.stringify(o)})`, () => {
      const r = parseInts("", o);
      expect(r.ok).toBe(false);
      if (r.ok) return;
      const ex = example(r.error);
      expect(ex).not.toBe("");
      expect(parseInts(ex, o).ok, ex).toBe(true);
    });
  }
  it("single-number fields never say '1 numbers' or ask for commas", () => {
    const o = { min: 0, max: 15, maxCount: 1 };
    for (const t of ["", "x", "99", "1 2"]) {
      const r = parseInts(t, o);
      expect(r.ok).toBe(false);
      if (!r.ok) { expect(r.error).not.toMatch(/1 numbers/); expect(r.error).not.toMatch(/separated by commas/); }
    }
  });
  it("every lesson field built on parseInts gives an example its own field accepts", () => {
    const tries: [string, (e: string) => string][] = [
      ["fibonacci", (e) => e], ["climbing-stairs", (e) => e],
      ["coin-change", (e) => `coins 1 3 4, amount ${e}`], ["knapsack", (e) => `2:3 4:5, cap ${e}`]
    ];
    const empties: Record<string, string> = { fibonacci: "", "climbing-stairs": "", "coin-change": "coins 1 3 4, amount ", knapsack: "2:3 4:5, cap " };
    for (const [id, build] of tries) {
      const lesson = LESSONS.find((l) => l.id === id)!;
      const r = lesson.parse(empties[id]);
      expect(r.ok, id).toBe(false);
      if (r.ok) continue;
      expect(r.error, id).not.toMatch(/1 numbers/);
      const ex = example(r.error);
      expect(ex, id).not.toBe("");
      expect(lesson.parse(build(ex)).ok, `${id}: ${ex}`).toBe(true);
    }
  });
});

describe("parseInts", () => {
  const o = { min: 1, max: 9, maxCount: 3 };
  it("reads separated numbers", () => {
    expect(parseInts("1, 2 3", o)).toEqual({ ok: true, input: [1, 2, 3] });
  });
  it("rejects out-of-range values with a reason", () => {
    const r = parseInts("1, 10", o);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/10.*1 to 9/);
  });
  it("rejects too many values", () => {
    const r = parseInts("1 2 3 4", o);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/3/);
  });
  it("rejects empty and non-numeric text", () => {
    expect(parseInts("", o).ok).toBe(false);
    const r = parseInts("1, x", o);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("x");
  });
});

describe("parseWords", () => {
  const o = { maxLen: 4, count: 2 };
  it("reads exactly count words, upper-cased", () => {
    expect(parseWords("ab, cd", o)).toEqual({ ok: true, input: ["AB", "CD"] });
  });
  it("rejects the wrong count", () => {
    const r = parseWords("ab", o);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/2/);
  });
  it("rejects a word that is too long, empty or not letters", () => {
    const long = parseWords("abcde, ab", o);
    expect(long.ok).toBe(false);
    if (!long.ok) expect(long.error).toMatch(/4/);
    expect(parseWords("a1, ab", o).ok).toBe(false);
  });
});

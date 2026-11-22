import { describe, expect, it } from "vitest";
import { blankGrid, paint, parseInts, parseWords, tableMemory } from "./dpkit";

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

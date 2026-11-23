import { describe, expect, it } from "vitest";
import lesson from ".";
import { at, rets, run } from "../testkit";
import type { DPState } from "../dpkit";

const gridOf = (s: { state: DPState }) => (s.state.kind === "grid" ? s.state.grid.map((r) => r.map((c) => c.v)) : []);
const statesOf = (s: { state: DPState }) => (s.state.kind === "grid" ? s.state.grid.map((r) => r.map((c) => c.state)) : []);
const spelled = (s: { state: DPState }) => (s.state.strip?.cells.map((t) => t.v).join("") ?? "");
const isSubseq = (sub: string, word: string) => {
  let k = 0;
  for (const ch of word) if (k < sub.length && ch === sub[k]) k++;
  return k === sub.length;
};

describe("lcs generator", () => {
  it("finds length 2 for AGCAT GAC and spells a subsequence of both words", () => {
    const steps = run(lesson, lesson.defaultText);
    expect(at(rets(steps), -1)).toBe("2");
    const last = at(steps, -1);
    expect(gridOf(last)[5][3]).toBe(2);
    const word = spelled(last);
    expect(word.length).toBe(2);
    expect(isSubseq(word, "AGCAT")).toBe(true);
    expect(isSubseq(word, "GAC")).toBe(true);
    expect(steps[0].kind).toBe("problem");
    expect(last.kind).toBe("recap");
    expect(steps.length).toBeLessThanOrEqual(40);
  });

  it("has a table of (|a|+1) x (|b|+1) with zero edges and one step per inner cell", () => {
    const steps = run(lesson, "AGCAT GAC");
    const base = steps[1];
    expect(gridOf(base).length).toBe(6);
    expect(gridOf(base)[0]).toEqual([0, 0, 0, 0]);
    expect(gridOf(base).map((r) => r[0])).toEqual([0, 0, 0, 0, 0, 0]);
    expect(gridOf(base)[1][1]).toBe(null);
    expect(steps.filter((s) => /^i\d+ j\d+$/.test(s.op ?? "")).length).toBe(5 * 3);
  });

  it("add on a match reads the diagonal, check on a mismatch takes the max of up and left", () => {
    const steps = run(lesson, "AGCAT GAC");
    const match = steps.find((s) => s.op === "i1 j2")!; // A vs A
    expect(match.kind).toBe("add");
    expect(gridOf(match)[1][2]).toBe(1);
    expect(statesOf(match)[1][2]).toBe("active");
    expect(statesOf(match)[0][1]).toBe("compare");
    expect(match.anchors).toContain("lc.match");
    const miss = steps.find((s) => s.op === "i1 j1")!; // A vs G
    expect(miss.kind).toBe("check");
    expect(gridOf(miss)[1][1]).toBe(0);
    expect(miss.anchors).toEqual(expect.arrayContaining(["lc.match", "lc.max"]));
    expect(statesOf(miss)[0][1]).toBe("compare");
    expect(statesOf(miss)[1][0]).toBe("compare");
  });

  it("traceback marks compared cells, keeps the path found, and anchors every line it works on", () => {
    const steps = run(lesson, lesson.defaultText);
    const tb = steps.filter((s) => s.op?.startsWith("back"));
    expect(tb.length).toBeGreaterThan(0);
    for (const s of tb) {
      expect(s.anchors).toContain("lc.trace");
      expect(s.anchors).toContain("lc.tbmatch");
      expect(Object.keys(s.notes)).toEqual(expect.arrayContaining(s.anchors));
      expect(statesOf(s).flat()).toContain("compare");
    }
    const used = new Set(tb.flatMap((s) => s.anchors));
    for (const a of ["lc.trace", "lc.tbmatch", "lc.tbup"]) expect(used.has(a)).toBe(true);
    // The swapped preset walks left, which is the only run that reads the last branch.
    const swapped = run(lesson, "GAC AGCAT").filter((s) => s.op?.startsWith("back"));
    const left = swapped.find((s) => s.anchors.includes("lc.tbleft"))!;
    expect(left.title.toLowerCase()).toContain("left");
    expect(Object.keys(left.notes)).toContain("lc.tbleft");
    expect(tb.filter((s) => s.kind === "found").length).toBe(2);
  });

  it("moves up on a tie", () => {
    // A B / B A: corner 1 is a tie between up and left, so the first move is up.
    const steps = run(lesson, "AB BA");
    const first = steps.find((s) => s.op?.startsWith("back"))!;
    expect(first.title.toLowerCase()).toContain("up");
    expect(at(rets(steps), -1)).toBe("1");
  });

  it("gives 0 with no table cells to fill when a word is empty", () => {
    for (const t of ["- GAC", "AGCAT -"]) {
      const steps = run(lesson, t);
      expect(at(rets(steps), -1)).toBe("0");
      expect(steps.some((s) => /^i\d+ j\d+$/.test(s.op ?? ""))).toBe(false);
      expect(steps.some((s) => s.op?.startsWith("back"))).toBe(false);
      expect(spelled(at(steps, -1))).toBe("");
    }
    expect(lesson.parse("- -").ok).toBe(true);
  });

  it("handles no match and all match", () => {
    expect(at(rets(run(lesson, "ABC XYZ")), -1)).toBe("0");
    const all = run(lesson, "ABCDEF ABCDEF");
    expect(at(rets(all), -1)).toBe("6");
    expect(spelled(at(all, -1))).toBe("ABCDEF");
  });

  it("limits input and keeps runs short", () => {
    expect(lesson.parse("ABCDEFG AB").ok).toBe(false);
    expect(lesson.parse("AB").ok).toBe(false);
    expect(lesson.parse("AB, C1").ok).toBe(false);
    expect(lesson.parse("AB, CD, EF").ok).toBe(false);
    expect(lesson.parse("abc, bcd").ok).toBe(true);
    expect(run(lesson, "ABCDEF FEDCBA").length).toBeLessThanOrEqual(80);
    expect(run(lesson, "ABABAB BABABA").length).toBeLessThanOrEqual(80);
  });

  it("keeps every op within 14 characters on extreme inputs, unique against neighbours", () => {
    for (const t of ["ABCDEF ABCDEF", "ABCDEF UVWXYZ", "ABABAB BABABA", "- ABCDEF", "A B", "ABCDEF FEDCBA", "ZZZZZZ ZZZZZZ"]) {
      const s = run(lesson, t);
      expect(s.length).toBeLessThanOrEqual(80);
      s.forEach((x, i) => {
        expect(x.short !== undefined || (x.op ?? "").length <= 14).toBe(true);
        if (i) expect(x.short ?? x.op).not.toBe(s[i - 1].short ?? s[i - 1].op);
      });
    }
  });

  it("anchors the row line on the first cell of each row", () => {
    const steps = run(lesson, lesson.defaultText);
    for (const i of [1, 2, 3, 4, 5]) expect(steps.find((x) => x.op === `i${i} j1`)!.anchors).toContain("lc.row");
  });
});

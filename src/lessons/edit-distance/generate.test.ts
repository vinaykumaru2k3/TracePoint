import { describe, expect, it } from "vitest";
import lesson from ".";
import { at, rets, run } from "../testkit";
import type { DPState } from "../dpkit";

const gridOf = (s: { state: DPState }) => (s.state.kind === "grid" ? s.state.grid.map((r) => r.map((c) => c.v)) : []);
const statesOf = (s: { state: DPState }) => (s.state.kind === "grid" ? s.state.grid.map((r) => r.map((c) => c.state)) : []);
const edits = (s: { state: DPState }) => (s.state.strip?.cells.map((t) => String(t.v)) ?? []);
const isCell = (op: string | null) => /^i\d+ j\d+$/.test(op ?? "");

/** Apply a list of edit tags to word a, left to right; the result must be b. */
function apply(a: string, tags: string[]): string {
  let out = "", k = 0;
  for (const t of tags) {
    const [kind, ch] = t.split(" ");
    if (kind === "keep") { out += a[k]; k++; }
    else if (kind === "rep") { out += ch; k++; }
    else if (kind === "del") k++;
    else if (kind === "ins") out += ch;
  }
  return out;
}

describe("edit-distance generator", () => {
  it("turns horse into ros in 3 edits, with a table of (|a|+1) x (|b|+1)", () => {
    const steps = run(lesson, lesson.defaultText);
    expect(lesson.defaultText).toBe("horse ros");
    expect(at(rets(steps), -1)).toBe("3");
    const last = at(steps, -1);
    expect(gridOf(last).length).toBe(6);
    expect(gridOf(last)[5][3]).toBe(3);
    expect(steps[0].kind).toBe("problem");
    expect(last.kind).toBe("recap");
    expect(steps.length).toBeLessThanOrEqual(40);
    const tags = edits(last).filter((t) => !t.startsWith("keep"));
    expect(tags.length).toBe(3);
    expect(apply("HORSE", edits(last))).toBe("ROS");
  });

  it("starts with edges 0..n down the column and 0..m along the row, then one step per inner cell", () => {
    const steps = run(lesson, "horse ros");
    const base = steps[1];
    expect(gridOf(base)[0]).toEqual([0, 1, 2, 3]);
    expect(gridOf(base).map((r) => r[0])).toEqual([0, 1, 2, 3, 4, 5]);
    expect(gridOf(base)[1][1]).toBe(null);
    expect(base.anchors).toEqual(expect.arrayContaining(["ed.init", "ed.edgecol", "ed.edgerow"]));
    expect(steps.filter((s) => isCell(s.op)).length).toBe(5 * 3);
  });

  it("a match copies the diagonal (check); otherwise 1 + min of three (add) and names the winner", () => {
    const steps = run(lesson, "horse ros");
    const match = steps.find((s) => s.op === "i2 j2")!; // O vs O
    expect(match.kind).toBe("check");
    expect(gridOf(match)[2][2]).toBe(1);
    expect(statesOf(match)[2][2]).toBe("active");
    expect(statesOf(match)[1][1]).toBe("compare");
    expect(statesOf(match).flat().filter((x) => x === "compare").length).toBe(1);
    expect(match.anchors).toEqual(expect.arrayContaining(["ed.col", "ed.match"]));
    const miss = steps.find((s) => s.op === "i1 j1")!; // H vs R: replace from the corner
    expect(miss.kind).toBe("add");
    expect(gridOf(miss)[1][1]).toBe(1);
    expect(miss.title.toLowerCase()).toContain("replace");
    expect(miss.anchors).toEqual(expect.arrayContaining(["ed.col", "ed.match", "ed.min"]));
    for (const [r, c] of [[0, 0], [0, 1], [1, 0]]) expect(statesOf(miss)[r][c]).toBe("compare");
    for (const s of steps.filter((x) => x.kind === "add" && isCell(x.op))) expect(s.title.toLowerCase()).toMatch(/replace|delete|insert/);
    for (const i of [1, 2, 3, 4, 5]) expect(steps.find((x) => x.op === `i${i} j1`)!.anchors).toContain("ed.row");
  });

  it("names a replace in the traceback 'replace X', not like a keep", () => {
    const steps = run(lesson, lesson.defaultText);
    const reps = steps.filter((s) => s.op?.startsWith("back") && s.title.startsWith("Replace"));
    expect(reps.length).toBeGreaterThan(0);
    for (const s of reps) { expect(s.short).toMatch(/^replace [A-Z]/); expect(s.short!.length).toBeLessThanOrEqual(24); }
  });

  it("traceback names each edit, marks compared cells, keeps the path found, anchors every line", () => {
    const steps = run(lesson, lesson.defaultText);
    const tb = steps.filter((s) => s.op?.startsWith("back"));
    expect(tb.length).toBeGreaterThan(0);
    expect(tb[0].anchors).toContain("ed.tbstart");
    for (const s of tb) {
      expect(s.kind).toBe("found");
      expect(s.anchors).toEqual(expect.arrayContaining(["ed.trace", "ed.tbmatch"]));
      expect(Object.keys(s.notes)).toEqual(expect.arrayContaining(s.anchors));
      expect(statesOf(s).flat()).toContain("compare");
      expect(s.title).toMatch(/^(Keep|Replace|Delete|Insert)/);
    }
    expect(edits(at(tb, -1)).length).toBe(tb.length);
    expect(edits(at(steps, -1)).length).toBe(tb.length);
  });

  it("uses every declared anchor on some step of the default run or a preset", () => {
    const declared = ["ed.init", "ed.edgecol", "ed.edgerow", "ed.row", "ed.col", "ed.match", "ed.min", "ed.tbstart", "ed.trace", "ed.tbmatch", "ed.tbrep", "ed.tbdel", "ed.tbins", "ed.print", "ed.ret"];
    const used = new Set<string>();
    for (const t of [lesson.defaultText, ...lesson.presets!.map((p) => p.text)]) for (const s of run(lesson, t)) for (const a of s.anchors) used.add(a);
    for (const a of declared) expect(used.has(a), a).toBe(true);
    expect([...used].sort()).toEqual([...declared].sort());
  });

  it("gives 0 for equal words and the other word's length for an empty word", () => {
    const same = run(lesson, "abc abc");
    expect(at(rets(same), -1)).toBe("0");
    expect(edits(at(same, -1))).toEqual(["keep A", "keep B", "keep C"]);
    for (const [t, n] of [["- ABC", 3], ["ABCDEF -", 6], ["- -", 0]] as [string, number][]) {
      const steps = run(lesson, t);
      expect(at(rets(steps), -1)).toBe(String(n));
      expect(steps.some((s) => isCell(s.op))).toBe(false);
      expect(steps.length).toBeGreaterThanOrEqual(3);
    }
    expect(edits(at(run(lesson, "- ABC"), -1)).join(",")).toBe("ins A,ins B,ins C");
    expect(edits(at(run(lesson, "AB -"), -1)).join(",")).toBe("del A,del B");
    expect(lesson.parse("- -").ok).toBe(true);
  });

  it("the listed edits always turn a into b and their count is the answer", () => {
    for (const [a, b] of [["HORSE", "ROS"], ["ROS", "HORSE"], ["ABCDEF", "UVWXYZ"], ["KITTEN", "SITTIN"], ["ABAB", "BABA"], ["A", "B"]]) {
      const steps = run(lesson, `${a} ${b}`);
      const tags = edits(at(steps, -1));
      expect(apply(a, tags)).toBe(b);
      expect(tags.filter((t) => !t.startsWith("keep")).length).toBe(Number(at(rets(steps), -1)));
    }
  });

  it("limits input and keeps ops short and distinct from neighbours on extreme inputs", () => {
    expect(lesson.parse("ABCDEFG AB").ok).toBe(false);
    expect(lesson.parse("AB").ok).toBe(false);
    expect(lesson.parse("AB, C1").ok).toBe(false);
    expect(lesson.parse("AB, CD, EF").ok).toBe(false);
    expect(lesson.parse("abc, bcd").ok).toBe(true);
    const err = lesson.parse("AB");
    if (!err.ok) expect(err.error).toContain("Use - for an empty word");
    for (const t of ["ABCDEF ABCDEF", "ABCDEF UVWXYZ", "ABABAB BABABA", "- ABCDEF", "ABCDEF -", "A B", "ABCDEF FEDCBA", "ZZZZZZ ZZZZZZ", "ABCDEF A", "A ABCDEF"]) {
      const s = run(lesson, t);
      expect(s.length).toBeLessThanOrEqual(80);
      s.forEach((x, i) => {
        expect(x.short !== undefined || (x.op ?? "").length <= 14).toBe(true);
        if (i) expect(x.short ?? x.op).not.toBe(s[i - 1].short ?? s[i - 1].op);
      });
    }
  });

  it("sweeps every pair of words over {A,B} up to 4 letters (empty included): bounded steps, correct distance", () => {
    const words = [""];
    for (let len = 1; len <= 4; len++) for (let k = 0; k < 2 ** len; k++) words.push([...k.toString(2).padStart(len, "0")].map((x) => "AB"[+x]).join(""));
    const lev = (a: string, b: string) => {
      const d = Array.from({ length: a.length + 1 }, (_, i) => Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
      for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = a[i - 1] === b[j - 1] ? d[i - 1][j - 1] : 1 + Math.min(d[i - 1][j - 1], d[i - 1][j], d[i][j - 1]);
      return d[a.length][b.length];
    };
    for (const a of words) for (const b of words) {
      const steps = run(lesson, `${a || "-"} ${b || "-"}`);
      expect(steps.length).toBeLessThanOrEqual(80);
      expect(at(rets(steps), -1)).toBe(String(lev(a, b)));
      expect(apply(a, edits(at(steps, -1)))).toBe(b);
    }
  });

  it("the measured worst case is 47 steps", () => {
    expect(run(lesson, "AABBAA BBAABB").length).toBe(47);
  });
});

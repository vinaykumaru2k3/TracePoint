import { describe, expect, it } from "vitest";
import lesson from ".";
import { at, run } from "../testkit";
import type { DPState } from "../dpkit";

const grid = (s: { state: DPState }) => (s.state.kind === "grid" ? s.state : null)!;
const heads = (s: { state: DPState }) => grid(s).rowHead;
const picked = (text: string) => {
  const steps = run(lesson, text);
  return steps.filter((s) => s.anchors.includes("greedy.take")).map((s) => s.op!.replace("take ", ""));
};

describe("greedy-intervals generator", () => {
  it("the default run picks 1-3, 4-7, 8-10 (3)", () => {
    expect(lesson.defaultText).toBe("1-3, 2-5, 4-7, 1-8, 5-9, 8-10");
    const steps = run(lesson, lesson.defaultText);
    expect(picked(lesson.defaultText)).toEqual(["1-3", "4-7", "8-10"]);
    expect(at(steps, -2).ret).toBe("3");
    expect(steps.length).toBe(11);
    expect(steps[0].kind).toBe("problem");
    expect(at(steps, -1).kind).toBe("recap");
  });

  it("one move step shows the rows sorted by end, equal ends keep input order", () => {
    const steps = run(lesson, "5-9, 1-3, 4-7, 2-3");
    expect(heads(steps[0])).toEqual(["5-9", "1-3", "4-7", "2-3"]);
    const sort = steps[1];
    expect(sort.kind).toBe("move");
    expect(sort.anchors).toContain("greedy.sort");
    expect(heads(sort)).toEqual(["1-3", "2-3", "4-7", "5-9"]);
    expect(sort.text).toMatch(/input order/);
    expect(grid(sort).colHead).toHaveLength(13);
  });

  it("rejects overlaps as check steps, dimmed, and takes the rest as add steps", () => {
    const steps = run(lesson, lesson.defaultText);
    const skip = steps.find((s) => s.op === "skip 2-5")!;
    expect(skip.kind).toBe("check");
    expect(skip.text).toMatch(/overlap/);
    expect(skip.anchors).not.toContain("greedy.take");
    const g = grid(skip).grid;
    expect(g[1][2].state).toBe("stale");
    expect(g[1][4].state).toBe("stale");
    const take = steps.find((s) => s.op === "take 4-7")!;
    expect(take.kind).toBe("add");
    expect(grid(take).grid[2][4].state).toBe("active");
    expect(grid(take).grid[0][1].state).toBe("found");
  });

  it("a skip names the interval it clashes with, not a span that may be free", () => {
    const skip = run(lesson, "5-6, 1-7").find((s) => s.op === "skip 1-7")!;
    expect(skip.text).toMatch(/1-7 starts at 1, before 5-6 ends at 6/);
    expect(skip.text).not.toMatch(/already used/);
    expect(skip.text).toMatch(/overlap/);
  });

  it("touching intervals 1-3, 3-5 take both and say why", () => {
    expect(picked("1-3, 3-5")).toEqual(["1-3", "3-5"]);
    const steps = run(lesson, "1-3, 3-5");
    const take = steps.find((s) => s.op === "take 3-5")!;
    expect(take.text).toMatch(/touch/);
    expect(take.text).toMatch(/no time/);
    expect(at(steps, -2).ret).toBe("2");
  });

  it("matches a brute force best count over many inputs", () => {
    const best = (iv: number[][]) => {
      let b = 0;
      for (let m = 0; m < 1 << iv.length; m++) {
        const ch = iv.filter((_, i) => m >> i & 1).sort((a, b) => a[0] - b[0]);
        if (ch.every((x, i) => i === 0 || ch[i - 1][1] <= x[0])) b = Math.max(b, ch.length);
      }
      return b;
    };
    let seed = 7;
    const rnd = (n: number) => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) % n;
    for (let t = 0; t < 200; t++) {
      const n = 1 + rnd(7), iv: number[][] = [];
      for (let i = 0; i < n; i++) { const s = rnd(12); iv.push([s, s + 1 + rnd(12 - s)]); }
      const text = iv.map(([s, e]) => `${s}-${e}`).join(", ");
      expect(at(run(lesson, text), -2).ret, text).toBe(String(best(iv)));
    }
  });

  it("a single interval is taken", () => {
    const steps = run(lesson, "0-12");
    expect(picked("0-12")).toEqual(["0-12"]);
    expect(at(steps, -2).ret).toBe("1");
  });

  it("sweep: 7 intervals with two-digit bounds fit the rail, neighbours differ, at most 80 steps", () => {
    const texts = ["10-12, 10-12, 10-12, 10-12, 10-12, 10-12, 10-12", "0-12, 0-12, 0-12, 0-12, 0-12, 0-12, 0-12",
      "10-12, 1-3, 3-5, 5-7, 7-9, 9-10, 0-1", "11-12, 10-12, 10-11, 1-12, 0-12, 2-12, 3-12", "1-2, 1-2"];
    for (const t of texts) {
      const steps = run(lesson, t);
      expect(steps.length).toBeLessThanOrEqual(80);
      expect(steps.length).toBe(5 + t.split(",").length);
      steps.forEach((s, i) => {
        expect(s.op === null || s.op.length <= 14 || s.short !== undefined, `${t} / ${s.op}`).toBe(true);
        if (s.short !== undefined) expect(s.short.length).toBeLessThanOrEqual(14);
        const name = (x: typeof s) => x.short ?? x.op;
        if (i > 0 && s.op) expect(name(s), `${t} step ${i}`).not.toBe(name(steps[i - 1]));
      });
    }
  });

  it("rejects bad input with a sentence that says why", () => {
    const bad: [string, RegExp][] = [["", /interval/], ["3-3", /before/], ["5-2", /before/], ["1-13", /0 to 12/], ["a-3", /Could not read/],
      ["1-3 4", /Could not read/], ["1-2, 1-2, 1-2, 1-2, 1-2, 1-2, 1-2, 1-2", /7/], ["-1-3", /Could not read/]];
    for (const [t, re] of bad) {
      const r = lesson.parse(t);
      expect(r.ok, t).toBe(false);
      if (!r.ok) { expect(r.error.length).toBeGreaterThan(20); expect(r.error, t).toMatch(re); }
    }
    expect(lesson.parse("1-3,3-5\n 0 - 12").ok).toBe(true);
  });

  it("anchors: every declared anchor is used by the default run or a preset", () => {
    const used = new Set<string>();
    for (const t of [lesson.defaultText, ...lesson.presets!.map((p) => p.text)]) run(lesson, t).forEach((s) => s.anchors.forEach((a) => used.add(a)));
    for (const a of ["greedy.sort", "greedy.init", "greedy.loop", "greedy.cmp", "greedy.take", "greedy.last", "greedy.ret"]) expect(used.has(a), a).toBe(true);
  });
});

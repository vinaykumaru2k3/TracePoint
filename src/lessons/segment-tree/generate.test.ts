import { describe, expect, it } from "vitest";
import lesson from ".";
import { SEG_MAX } from "./generate";
import { at, rets, run } from "../testkit";

describe("segment-tree generator", () => {
  it("answers the default queries: 9, then 4 after update 2 0", () => {
    const steps = run(lesson, lesson.defaultText);
    expect(rets(steps, "query")).toEqual(["9", "4"]);
    expect(steps.length).toBeLessThanOrEqual(40);
  });

  it("builds one add per internal node, bottom-up", () => {
    const steps = run(lesson, "array 2 1 5 3 4, query 0 4");
    const adds = steps.filter((s) => s.op?.startsWith("sum "));
    expect(adds.map((s) => s.op)).toEqual(["sum 0..1", "sum 0..2", "sum 3..4", "sum 0..4"]);
    expect(adds.every((s) => s.kind === "add")).toBe(true);
  });

  it("a one-element array answers its own value", () => {
    const steps = run(lesson, "array 7, query 0 0, update 0 4, query 0 0");
    expect(rets(steps, "query")).toEqual(["7", "4"]);
  });

  it("answers a two-element array", () => {
    expect(rets(run(lesson, "array 3 9, query 0 1, query 1 1"), "query")).toEqual(["12", "9"]);
  });

  it("matches a plain sum on every range of every length", () => {
    for (let n = 1; n <= SEG_MAX; n++) {
      const nums = Array.from({ length: n }, (_, i) => (i * 37 + 11) % 100);
      for (let l = 0; l < n; l++) for (let r = l; r < n; r++) {
        const got = rets(run(lesson, `array ${nums.join(" ")}, query ${l} ${r}`), "query")[0];
        expect(got).toBe(String(nums.slice(l, r + 1).reduce((x, y) => x + y, 0)));
      }
    }
  });

  it("applies updates to later queries", () => {
    expect(rets(run(lesson, "array 1 2 3 4 5 6 7 8, update 7 0, query 4 7, update 4 9"), "query")).toEqual(["18"]);
  });

  it("rejects bad input with a reason", () => {
    const bad = (t: string, re: RegExp) => { const r = lesson.parse(t); expect(r.ok).toBe(false); if (!r.ok) expect(r.error).toMatch(re); };
    bad("", /array/i);
    bad("query 0 1", /array/i);
    bad("array", /at least one/i);
    bad("array 1 2 3 4 5 6 7 8 9", /8/);
    bad("array 100", /0 to 99/);
    bad("array 1 2 3", /at least one operation/i);
    bad("array 1 2 3, query 2 1", /not after|before/i);
    bad("array 1 2 3, query 0 3", /outside/i);
    bad("array 1 2 3, update 3 4", /outside/i);
    bad("array 1 2 3, update 1 100", /0 to 99/);
    bad("array 1 2 3, sum 0 1", /query|update/);
    bad("array 1 2 3, query 0 1, query 0 1, query 0 1, query 0 1", /3/);
  });

  it("stays inside the step budget with readable rails on awkward inputs", () => {
    const ranges = [[1, 6], [1, 5], [2, 6], [0, 6], [1, 4], [3, 6], [0, 0], [7, 7], [0, 7]];
    const check = (n: number, ops: string) => {
      const steps = run(lesson, `array ${Array.from({ length: n }, (_, i) => i + 1).join(" ")}, ${ops}`);
      expect(steps.length).toBeLessThanOrEqual(80);
      expect(steps.length).toBeGreaterThanOrEqual(6);
      for (const s of steps.filter((x) => x.kind !== "recap")) {
        // compare tiles in a: a query range or a position being changed; compare nodes: children being read
        const tile = s.state.strip?.tiles.some((x: { state?: string }) => x.state === "compare");
        if (tile) expect(["query", "update"]).toContain(s.state.phase);
        if (s.state.nodes.some((x: { state?: string }) => x.state === "compare") && s.state.phase !== "query") expect(["add", "move", "check"]).toContain(s.kind);
      }
      steps.forEach((s, i) => {
        if (s.op) expect((s.short ?? s.op).length).toBeLessThanOrEqual(14);
        if (i > 0) expect(s.short ?? s.op ?? "").not.toBe(steps[i - 1].short ?? steps[i - 1].op ?? "");
      });
      return steps.length;
    };
    for (const n of [1, 2, 3, 5, 7, 8]) {
      for (const [l, r] of ranges) {
        if (r >= n) continue;
        check(n, `query ${l} ${r}, update ${r} 5, query ${l} ${r}`);
        check(n, `update ${l} 5, update ${r} 6, query ${l} ${r}`);
      }
    }
    let worst = 0;
    for (const a of ranges) for (const b of ranges) for (const c of ranges) {
      worst = Math.max(worst, check(8, `query ${a.join(" ")}, query ${b.join(" ")}, query ${c.join(" ")}`));
    }
    expect(worst).toBeLessThanOrEqual(80);
  });

  it("keeps a bare one-value run and repeated updates readable", () => {
    expect(run(lesson, "array 7, query 0 0").length).toBeGreaterThanOrEqual(6);
    const steps = run(lesson, "array 7, update 0 4, update 0 4, query 0 0");
    steps.forEach((s, i) => { if (i) expect(s.short ?? s.op).not.toBe(steps[i - 1].short ?? steps[i - 1].op); });
    expect(steps.some((s) => /already holds/.test(s.text))).toBe(true);
  });

  it("keeps nodes at one depth at least two columns apart", () => {
    for (let n = 1; n <= SEG_MAX; n++) {
      const s = at(run(lesson, `array ${Array.from({ length: n }, () => 1).join(" ")}, query 0 0`), -2).state;
      const byDepth = new Map<number, number[]>();
      for (const x of s.nodes) byDepth.set(x.depth, [...(byDepth.get(x.depth) ?? []), x.col]);
      for (const cols of byDepth.values()) {
        cols.sort((p, q) => p - q);
        cols.slice(1).forEach((c, i) => expect(c - cols[i]).toBeGreaterThanOrEqual(2));
      }
    }
  });
});

import { describe, expect, it } from "vitest";
import lesson from ".";
import { at, rets, run } from "../testkit";
import type { DPState } from "../dpkit";

const memoOf = (s: { state: DPState }) => (s.state.kind === "row" ? s.state.cells.map((c) => c.v) : []);

describe("fibonacci generator", () => {
  it("computes fib(6) = 8 and fills the memo 0 1 1 2 3 5 8", () => {
    const steps = run(lesson, "6");
    expect(at(rets(steps), -1)).toBe("8");
    expect(memoOf(at(steps, -1))).toEqual([0, 1, 1, 2, 3, 5, 8]);
  });

  it("makes exactly 11 calls for n = 6, 3 of them memo hits", () => {
    const steps = run(lesson, "6");
    expect(steps.filter((s) => s.kind === "add" && s.anchors.includes("fib.sig")).length).toBe(11);
    expect(steps.filter((s) => s.anchors.includes("fib.hit")).length).toBe(3);
    expect(steps.filter((s) => s.anchors.includes("fib.store")).length).toBe(5);
  });

  it("answers n = 0 and n = 1 at once", () => {
    for (const [n, v] of [["0", "0"], ["1", "1"]]) {
      const steps = run(lesson, n);
      expect(rets(steps)).toEqual([v]);
      expect(steps.filter((s) => s.anchors.includes("fib.sig")).length).toBe(1);
      expect(steps.some((s) => s.anchors.includes("fib.store"))).toBe(false);
    }
  });

  it("limits input and keeps runs short", () => {
    expect(lesson.parse("16").ok).toBe(false);
    expect(lesson.parse("-1").ok).toBe(false);
    expect(lesson.parse("3 4").ok).toBe(false);
    expect(run(lesson, lesson.defaultText).length).toBeLessThanOrEqual(40);
    expect(run(lesson, "15").length).toBeLessThanOrEqual(80);
    expect(at(rets(run(lesson, "15")), -1)).toBe("610");
  });
});

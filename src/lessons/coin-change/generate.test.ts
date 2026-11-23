import { describe, expect, it } from "vitest";
import lesson from ".";
import { at, rets, run } from "../testkit";
import type { DPState } from "../dpkit";

const tableOf = (s: { state: DPState }) => (s.state.kind === "row" ? s.state.cells.map((c) => c.v) : []);
const statesOf = (s: { state: DPState }) => (s.state.kind === "row" ? s.state.cells.map((c) => c.state) : []);
const picked = (s: { state: DPState }) => s.state.strip?.cells.map((t) => t.v) ?? [];

describe("coin change generator", () => {
  it("needs 2 coins (3 3) for amount 6 with coins 1 3 4", () => {
    const steps = run(lesson, "coins 1 3 4, amount 6");
    expect(at(rets(steps), -1)).toBe("2");
    expect(tableOf(at(steps, -1))).toEqual([0, 1, 2, 1, 1, 2, 2]);
    expect(picked(at(steps, -1))).toEqual([3, 3]);
    expect(steps.filter((s) => s.kind === "found").length).toBe(2);
  });

  it("separates a coin that beats the cell (add) from one that does not (check)", () => {
    const steps = run(lesson, "coins 1 3 4, amount 6");
    const adds = steps.filter((s) => s.anchors.includes("coin.take"));
    const checks = steps.filter((s) => s.anchors.includes("coin.try") && s.kind === "check");
    expect(adds.every((s) => s.kind === "add")).toBe(true);
    // dp[4]: coin 1 writes 2, coin 3 does not beat it, coin 4 writes 1
    expect(adds.filter((s) => s.op?.startsWith("a4 ")).map((s) => tableOf(s)[4])).toEqual([2, 1]);
    expect(checks.length).toBeGreaterThan(0);
    const c = checks.find((s) => s.op === "a4 c3")!;
    expect(statesOf(c)[1]).toBe("compare");
    expect(tableOf(c)[4]).toBe(2);
  });

  it("answers amount 0 with 0 coins and no loop", () => {
    const steps = run(lesson, "coins 1 3 4, amount 0");
    expect(at(rets(steps), -1)).toBe("0");
    expect(tableOf(at(steps, -1))).toEqual([0]);
    expect(steps.some((s) => s.kind === "check" || s.kind === "found")).toBe(false);
    expect(steps[0].kind).toBe("problem");
    expect(at(steps, -1).kind).toBe("recap");
  });

  it("gives -1 when the amount cannot be made (coins 2, amount 3)", () => {
    const steps = run(lesson, "coins 2, amount 3");
    expect(at(rets(steps), -1)).toBe("-1");
    expect(tableOf(at(steps, -1))).toEqual([0, "∞", 1, "∞"]);
    expect(steps.some((s) => s.kind === "found")).toBe(false);
    expect(at(steps, -1).text).toContain("-1");
  });

  it("limits input and keeps runs short", () => {
    expect(lesson.parse("coins 1 3 4, amount 13").ok).toBe(false);
    expect(lesson.parse("coins 21, amount 3").ok).toBe(false);
    expect(lesson.parse("coins 1 2 3 4 5, amount 3").ok).toBe(false);
    expect(lesson.parse("coins 1 1, amount 3").ok).toBe(false);
    expect(lesson.parse("1 3 4").ok).toBe(false);
    expect(run(lesson, lesson.defaultText).length).toBeLessThanOrEqual(40);
    expect(run(lesson, "coins 1 2 3 4, amount 12").length).toBeLessThanOrEqual(80);
  });

  it("never repeats an op on neighbouring steps", () => {
    for (const t of ["coins 1 3 4, amount 6", "coins 1 2 3 4, amount 12", "coins 2, amount 3"]) {
      const s = run(lesson, t);
      s.forEach((x, i) => { if (i) expect(x.op).not.toBe(s[i - 1].op); });
    }
  });
});

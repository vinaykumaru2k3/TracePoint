import { describe, expect, it } from "vitest";
import lesson from ".";
import { at, rets, run } from "../testkit";
import type { DPState } from "../dpkit";

const tableOf = (s: { state: DPState }) => (s.state.kind === "row" ? s.state.cells.map((c) => c.v) : []);
const statesOf = (s: { state: DPState }) => (s.state.kind === "row" ? s.state.cells.map((c) => c.state) : []);

describe("climbing stairs generator", () => {
  it("gives ways(6) = 13 and the table 1 1 2 3 5 8 13", () => {
    const steps = run(lesson, "6");
    expect(at(rets(steps), -1)).toBe("13");
    expect(tableOf(at(steps, -1))).toEqual([1, 1, 2, 3, 5, 8, 13]);
  });

  it("reads two cells then writes one, for each i", () => {
    const steps = run(lesson, "6");
    const checks = steps.filter((s) => s.kind === "check");
    const writes = steps.filter((s) => s.anchors.includes("stairs.fill"));
    expect(checks.length).toBe(5);
    expect(writes.length).toBe(5);
    const c = checks[2]; // i = 4
    expect(statesOf(c)[3]).toBe("compare");
    expect(statesOf(c)[2]).toBe("compare");
    expect(tableOf(c)[4]).toBeNull();
    expect(statesOf(writes[2])[4]).toBe("active");
    expect(tableOf(writes[2])[4]).toBe(5);
  });

  it("answers n = 1 with 1 and never reaches the loop", () => {
    const steps = run(lesson, "1");
    expect(at(rets(steps), -1)).toBe("1");
    expect(tableOf(at(steps, -1))).toEqual([1, 1]);
    expect(steps.some((s) => s.kind === "check")).toBe(false);
    expect(steps[0].kind).toBe("problem");
    expect(at(steps, -1).kind).toBe("recap");
  });

  it("limits input and keeps runs short", () => {
    expect(lesson.parse("0").ok).toBe(false);
    expect(lesson.parse("21").ok).toBe(false);
    expect(lesson.parse("3 4").ok).toBe(false);
    expect(run(lesson, lesson.defaultText).length).toBeLessThanOrEqual(40);
    expect(run(lesson, "20").length).toBeLessThanOrEqual(80);
    expect(at(rets(run(lesson, "20")), -1)).toBe("10946");
  });
});

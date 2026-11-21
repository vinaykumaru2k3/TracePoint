import { describe, expect, it } from "vitest";
import lesson from ".";
import { at, rets, run } from "../testkit";

describe("counting-sort generator", () => {
  it("sorts by counting", () => {
    expect(at(rets(run(lesson, "3 1 2 3 0")), -1)).toBe("[0, 1, 2, 3, 3]");
  });

  it("has the right counts after the counting phase", () => {
    const counted = run(lesson, "3 1 2 3 0").filter((s) => s.op?.startsWith("count["));
    expect(at(counted, -1).state.aux).toEqual([1, 1, 1, 2]);
  });

  it("rejects values over 9", () => {
    expect(lesson.parse("3 12 1").ok).toBe(false);
  });

  it("never compares, and gives two values a full lesson", () => {
    expect(run(lesson, "7 3 9 3 1 0 5 2").filter((s) => s.kind === "check")).toHaveLength(0);
    expect(run(lesson, "1 2").length).toBeGreaterThanOrEqual(6);
  });
});

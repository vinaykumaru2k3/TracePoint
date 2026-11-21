import { describe, expect, it } from "vitest";
import lesson from ".";
import { at, rets, run } from "../testkit";

describe("selection-sort generator", () => {
  it("sorts the default input", () => {
    expect(at(rets(run(lesson, "5 1 4 2 8")), -1)).toBe("[1, 2, 4, 5, 8]");
  });

  it("makes at most n - 1 swaps", () => {
    expect(at(run(lesson, "6 5 4 3 2 1"), -1).state.swaps).toBeLessThanOrEqual(5);
  });

  it("sorts duplicates", () => {
    expect(at(rets(run(lesson, "3 1 3 2")), -1)).toBe("[1, 2, 3, 3]");
  });

  it("always compares n(n-1)/2 times", () => {
    expect(run(lesson, "5 1 4 2 8").filter((s) => s.kind === "check")).toHaveLength(10);
  });

  it("keeps the max input under 80 steps and gives two values a full lesson", () => {
    expect(run(lesson, "8 7 6 5 4 3 2 1").length).toBeLessThanOrEqual(80);
    expect(run(lesson, "1 2").length).toBeGreaterThanOrEqual(6);
  });
});

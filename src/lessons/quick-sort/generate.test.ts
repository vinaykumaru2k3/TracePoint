import { describe, expect, it } from "vitest";
import lesson from ".";
import { at, rets, run } from "../testkit";

describe("quick-sort generator", () => {
  it("sorts the default input", () => {
    expect(at(rets(run(lesson, "5 1 4 2 8 3")), -1)).toBe("[1, 2, 3, 4, 5, 8]");
  });

  it("sorts duplicates", () => {
    expect(at(rets(run(lesson, "3 1 3 2")), -1)).toBe("[1, 2, 3, 3]");
  });

  it("counts every swap the code runs, self-swaps included (9 compares, 7 swaps on the default)", () => {
    const end = at(run(lesson, "5 1 4 2 8 3"), -1).state;
    expect(end.compares).toBe(9);
    expect(end.swaps).toBe(7);
  });

  it("hits the n(n-1)/2 worst case on sorted input", () => {
    expect(at(run(lesson, "1 2 3 4 5"), -1).state.compares).toBe(10);
  });

  it("keeps the max input under 80 steps and gives two values a full lesson", () => {
    expect(run(lesson, "8 7 6 5 4 3 2 1").length).toBeLessThanOrEqual(80);
    expect(run(lesson, "1 2 3 4 5 6 7 8").length).toBeLessThanOrEqual(80);
    expect(run(lesson, "1 2").length).toBeGreaterThanOrEqual(6);
  });
});

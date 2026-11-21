import { describe, expect, it } from "vitest";
import lesson from ".";
import { at, rets, run } from "../testkit";

describe("two-pointers generator", () => {
  it("finds the pair by moving the ends inward", () => {
    expect(rets(run(lesson, "1 3 4 6 8 11 target 10"))).toEqual(["[2, 3]"]);
  });

  it("reports no pair when the pointers meet", () => {
    expect(rets(run(lesson, "2 4 5 9 12 target 8"))).toEqual(["[]"]);
  });

  it("sorts unsorted input first", () => {
    const s = run(lesson, "9 2 14 5 7 1 target 12");
    expect(at(s, -2)?.kind).toBe("found");
  });
});

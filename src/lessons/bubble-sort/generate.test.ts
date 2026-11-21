import { describe, expect, it } from "vitest";
import lesson from ".";
import { at, rets, run } from "../testkit";

describe("bubble-sort generator", () => {
  it("sorts the default input", () => {
    expect(at(rets(run(lesson, "5 1 4 2 8")), -1)).toBe("[1, 2, 4, 5, 8]");
  });

  it("stops after one clean pass on sorted input", () => {
    expect(run(lesson, "1 2 3 4 5").filter((s) => s.kind === "check")).toHaveLength(4);
  });

  it("sorts duplicates", () => {
    expect(at(rets(run(lesson, "3 1 3 2")), -1)).toBe("[1, 2, 3, 3]");
  });

  it("keeps the max input under 80 steps", () => {
    expect(run(lesson, "8 7 6 5 4 3 2 1").length).toBeLessThanOrEqual(80);
  });

  it("gives two values a full lesson", () => {
    expect(run(lesson, "1 2").length).toBeGreaterThanOrEqual(6);
  });
});

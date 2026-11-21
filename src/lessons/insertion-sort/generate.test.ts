import { describe, expect, it } from "vitest";
import lesson from ".";
import { at, rets, run } from "../testkit";

describe("insertion-sort generator", () => {
  it("sorts the default input", () => {
    expect(at(rets(run(lesson, "5 1 4 2 8")), -1)).toBe("[1, 2, 4, 5, 8]");
  });

  it("needs one compare per item on sorted input", () => {
    expect(run(lesson, "1 2 3 4 5").filter((s) => s.kind === "check")).toHaveLength(4);
  });

  it("sorts duplicates", () => {
    expect(at(rets(run(lesson, "3 1 3 2")), -1)).toBe("[1, 2, 3, 3]");
  });

  it("shows the lifted cell as empty while the key is out", () => {
    const lifted = run(lesson, "5 1 4 2 8").filter((s) => s.kind === "remove");
    expect(lifted.length).toBeGreaterThan(0);
    for (const s of lifted) {
      expect(s.state.a.filter((v: number | null) => v === null)).toHaveLength(1);
      expect(s.state.aux).toHaveLength(1);
    }
  });

  it("keeps the max input under 80 steps and gives two values a full lesson", () => {
    expect(run(lesson, "8 7 6 5 4 3 2 1").length).toBeLessThanOrEqual(80);
    expect(run(lesson, "1 2").length).toBeGreaterThanOrEqual(6);
  });
});

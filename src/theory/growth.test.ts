import { describe, expect, it } from "vitest";
import { LESSONS } from "../lessons";
import { growthRank } from "./growth";

describe("growthRank", () => {
  it("ranks each class on the ladder", () => {
    expect(growthRank("O(1)")).toBe(0);
    expect(growthRank("O(1) avg")).toBe(0);
    expect(growthRank("O(log n)")).toBe(1);
    expect(growthRank("O(n)")).toBe(2);
    expect(growthRank("O(n + k)")).toBe(2);
    expect(growthRank("O(k)")).toBe(2);
    expect(growthRank("O(n log n) avg, O(n^2) worst")).toBe(3);
    expect(growthRank("O(n²)")).toBe(4);
    expect(growthRank("O(n^2), O(n) if sorted")).toBe(4);
    expect(growthRank("O(n × k)")).toBe(4);
    expect(growthRank("O(n · 2^n)")).toBe(5);
    expect(growthRank("O(n!) worst case")).toBe(6);
  });
  it("returns null for text with no class", () => {
    expect(growthRank("at most n - 1")).toBeNull();
    expect(growthRank("O(weird)")).toBeNull();
  });
  it("ranks every lesson cost that names a class", () => {
    for (const l of LESSONS) for (const [name, cost] of l.costs)
      if (cost.includes("O(")) expect(growthRank(cost), `${l.id} ${name}`).not.toBeNull();
  });
});

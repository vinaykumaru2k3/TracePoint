import { describe, expect, it } from "vitest";
import lesson from ".";
import { rets, run } from "../testkit";

describe("frequency map and two-sum generator", () => {
  it("counts every value", () => {
    const s = run(lesson, "3 5 1 5 8 4 target 9");
    const done = s.find((x) => x.anchors.includes("count.return"))!;
    expect(done.state.count).toEqual([[3, 1], [5, 2], [1, 1], [8, 1], [4, 1]]);
  });

  it("finds the pair with the seen map", () => {
    expect(rets(run(lesson, "3 5 1 5 8 4 target 9"), "twoSum")).toEqual(["[2, 4]"]);
    expect(rets(run(lesson, "6 3 6 target 12"), "twoSum")).toEqual(["[0, 2]"]);
  });

  it("reports none when no pair fits", () => {
    expect(rets(run(lesson, "1 2 4 8 target 20"), "twoSum")).toEqual(["none"]);
  });

  it("requires a target", () => {
    expect(lesson.parse("1 2 3").ok).toBe(false);
  });

  it("labels the hash costs as averages and states the worst case", () => {
    const costs = Object.fromEntries(lesson.costs);
    expect(costs.count).toBe("O(n) avg");
    expect(costs.twoSum).toBe("O(n) avg");
    expect(costs["worst case"]).toBe("O(n²)");
  });
});

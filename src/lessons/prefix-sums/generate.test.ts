import { describe, expect, it } from "vitest";
import lesson from ".";
import { rets, run } from "../testkit";

describe("prefix-sums generator", () => {
  it("answers range queries from the prefix array", () => {
    expect(rets(run(lesson, "3 1 4 1 5 9 query 1 3 query 2 5"))).toEqual(["6", "19"]);
  });

  it("handles a query over the whole array", () => {
    expect(rets(run(lesson, "2 4 6 query 0 2"))).toEqual(["12"]);
  });
});

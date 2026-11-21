import { describe, expect, it } from "vitest";
import lesson from ".";
import { rets, run } from "../testkit";

describe("sliding-window generator", () => {
  it("returns the best window sum", () => {
    expect(rets(run(lesson, "2 1 5 1 3 2 k 3"))).toEqual(["9"]);
    expect(rets(run(lesson, "1 9 1 1 k 2"))).toEqual(["10"]);
  });

  it("requires k smaller than the array", () => {
    expect(lesson.parse("1 2 3 k 3").ok).toBe(false);
  });
});

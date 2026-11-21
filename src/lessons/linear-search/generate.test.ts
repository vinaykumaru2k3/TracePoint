import { describe, expect, it } from "vitest";
import lesson from ".";
import { rets, run } from "../testkit";

describe("linear-search generator", () => {
  it("returns the index of the target", () => {
    expect(rets(run(lesson, "7 3 9 4 1 8 target 4"))).toEqual(["3"]);
  });

  it("returns -1 with an empty step when the target is absent", () => {
    const s = run(lesson, "7 3 9 target 5");
    expect(rets(s)).toEqual(["-1"]);
    expect(s.find((x) => x.ret === "-1")?.kind).toBe("empty");
  });

  it("stops at the first match among duplicates", () => {
    expect(rets(run(lesson, "2 5 5 1 target 5"))).toEqual(["1"]);
  });

  it("checks every cell for an absent target at max length", () => {
    expect(run(lesson, "1 2 3 4 5 6 7 8 target 99").filter((s) => s.kind === "check")).toHaveLength(8);
  });
});

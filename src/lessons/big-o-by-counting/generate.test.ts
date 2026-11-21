import { describe, expect, it } from "vitest";
import lesson from ".";
import { rets, run } from "../testkit";

describe("big-o generator", () => {
  it("sums the array and finds no duplicate", () => {
    const s = run(lesson, "4 8 1 9");
    expect(rets(s, "sum")).toEqual(["22"]);
    expect(rets(s, "hasDuplicate")).toEqual(["false"]);
  });

  it("stops at the first duplicate pair", () => {
    const s = run(lesson, "4 8 4");
    expect(s.find((x) => x.ret === "true")?.op).toBe("a[0] == a[2]");
  });
});

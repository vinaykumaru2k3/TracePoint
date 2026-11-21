import { describe, expect, it } from "vitest";
import lesson from ".";
import { rets, run } from "../testkit";

describe("arrays generator", () => {
  it("reads, inserts with shifts and removes by index", () => {
    const s = run(lesson, "append 4, append 6, get 1, insert 0 9, remove 1, get 1");
    expect(rets(s, "get")).toEqual(["6", "6"]);
    expect(rets(s, "remove")).toEqual(["4"]);
  });

  it("throws on a bad index and when full", () => {
    expect(rets(run(lesson, "append 1, get 3"), "get")).toEqual(["throws"]);
    const full = run(lesson, "append 1, append 2, append 3, append 4, append 5, append 6, append 7, append 8");
    expect(full.find((x) => x.retNote === "array is full")?.op).toBe("append(8)");
  });
});

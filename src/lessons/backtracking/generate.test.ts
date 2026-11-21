import { describe, expect, it } from "vitest";
import lesson from ".";
import { run } from "../testkit";

const recorded = (text: string) => run(lesson, text).filter((s) => s.kind === "found").map((s) => s.ret);

describe("backtracking (subsets) generator", () => {
  it("records every subset in take-first order", () => {
    expect(recorded("1 2 3")).toEqual(["[1, 2, 3]", "[1, 2]", "[1, 3]", "[1]", "[2, 3]", "[2]", "[3]", "[]"]);
  });

  it("finds 2^n subsets", () => {
    expect(recorded("1 2")).toHaveLength(4);
  });

  it("keeps the largest input under 40 steps", () => {
    expect(run(lesson, "1 2 3").length).toBeLessThanOrEqual(40);
  });

  it("rejects repeated items", () => {
    expect(lesson.parse("1 1 2").ok).toBe(false);
  });
});

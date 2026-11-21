import { describe, expect, it } from "vitest";
import lesson from ".";
import { rets, run } from "../testkit";
import type { CallStackState } from "./generate";

describe("call-stack generator", () => {
  it("returns each frame's value on the way back up", () => {
    expect(rets(run(lesson, "4"))).toEqual(["1", "1", "2", "6", "24"]);
  });

  it("treats fact(0) as a full lesson that hits the base case", () => {
    const s = run(lesson, "0");
    expect(s.some((x) => x.kind === "found" && x.ret === "1")).toBe(true);
    expect(s.length).toBeGreaterThanOrEqual(6);
  });

  it("stacks n + 1 frames at the deepest point", () => {
    const s = run(lesson, "4");
    expect(Math.max(...s.map((x) => (x.state as CallStackState).frames.length))).toBe(5);
  });

  it("keeps the largest input short", () => {
    expect(run(lesson, "7").length).toBeLessThanOrEqual(20);
  });
});

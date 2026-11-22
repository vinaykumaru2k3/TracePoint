import { describe, expect, it } from "vitest";
import lesson from ".";
import { at, rets, run } from "../testkit";

describe("representations generator", () => {
  it("builds both lists for every edge", () => {
    const steps = run(lesson, "A-B, A-C, B-D, C-D, D-E");
    expect(at(steps, -1).state.lists).toEqual({ A: ["B", "C"], B: ["A", "D"], C: ["A", "D"], D: ["B", "C", "E"], E: ["D"] });
  });

  it("answers hasEdge(A, D) both ways and lists D's neighbours", () => {
    const steps = run(lesson, "A-B, A-C, B-D, C-D, D-E");
    expect(rets(steps, "hasEdge")).toEqual(["false", "false"]);
    expect(rets(steps, "neighbours")).toEqual(["[B, C, E]"]);
    const m = steps.find((s) => s.anchors.includes("has.mat"))!;
    expect(m.state.strip!.tiles.map((t: { v: unknown }) => t.v)).toEqual([0, 1, 1, 0, 0]);
  });

  it("skips hasEdge when the start touches every node", () => {
    const steps = run(lesson, "A-B, A-C");
    expect(rets(steps, "hasEdge")).toEqual([]);
    expect(steps.length).toBeGreaterThanOrEqual(6);
  });

  it("rejects loops, repeats and letters past H", () => {
    expect(lesson.parse("A-A").ok).toBe(false);
    expect(lesson.parse("A-B, B-A").ok).toBe(false);
    expect(lesson.parse("A-Z").ok).toBe(false);
  });

  it("keeps the biggest graph under 80 steps", () => {
    expect(run(lesson, "A-B, A-C, A-D, A-E, A-F, A-G, A-H, B-C, C-D, D-E, E-F, F-G").length).toBeLessThanOrEqual(80);
  });
});

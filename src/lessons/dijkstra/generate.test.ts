import { describe, expect, it } from "vitest";
import lesson from ".";
import { at, rets, run } from "../testkit";

describe("dijkstra generator", () => {
  it("finds the cheapest costs from A", () => {
    expect(rets(run(lesson, lesson.defaultText), "dijkstra")).toEqual(["A0 B3 C1 D8 E10"]);
  });

  it("skips out-of-date entries instead of settling twice", () => {
    const steps = run(lesson, lesson.defaultText);
    expect(steps.filter((s) => s.anchors.includes("dij.stale")).map((s) => s.notes["dij.pop"])).toEqual(["B:4", "D:9"]);
    const settled = steps.filter((s) => s.anchors.includes("dij.pop") && !s.anchors.includes("dij.stale")).map((s) => s.notes["dij.pop"][0]);
    expect(settled).toEqual(["A", "C", "B", "D", "E"]);
  });

  it("leaves an island at ∞ and prefers a cheap detour", () => {
    expect(rets(run(lesson, "A-B 2, B-C 3, A-C 9, D-E 1"), "dijkstra")).toEqual(["A0 B2 C5 D∞ E∞"]);
    expect(rets(run(lesson, "A-D 10, A-B 1, B-C 1, C-D 1"), "dijkstra")).toEqual(["A0 B1 C2 D3"]);
    expect(at(run(lesson, lesson.defaultText), -1).state.pq).toEqual([]);
  });

  it("rejects bad weights and keeps runs short", () => {
    expect(lesson.parse("A-B").ok).toBe(false);
    expect(lesson.parse("A-B -3").ok).toBe(false);
    expect(run(lesson, lesson.defaultText).length).toBeLessThanOrEqual(40);
    expect(run(lesson, "A-B 9, A-C 8, A-D 7, A-E 6, A-F 5, A-G 4, A-H 3, B-C 1, C-D 1, D-E 1, E-F 1, F-G 1").length).toBeLessThanOrEqual(80);
  });
});

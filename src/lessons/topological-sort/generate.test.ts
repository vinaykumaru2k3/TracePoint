import { describe, expect, it } from "vitest";
import lesson from ".";
import { at, rets, run } from "../testkit";

describe("topological sort generator", () => {
  it("orders the default graph", () => {
    expect(rets(run(lesson, lesson.defaultText), "topoSort()")).toEqual(["[A, B, C, D, E, F]"]);
  });

  it("stops on a cycle with nodes left over", () => {
    const steps = run(lesson, "A-B, B-C, C-D, D-B, D-E");
    expect(rets(steps, "topoSort()")).toEqual(["cycle"]);
    expect(at(steps, -2).state.order).toEqual(["A"]);
  });

  it("follows the arrows, not the letters", () => {
    expect(rets(run(lesson, "E-D, D-C, C-B, B-A"), "topoSort()")).toEqual(["[E, D, C, B, A]"]);
  });

  it("keeps runs short", () => {
    expect(run(lesson, lesson.defaultText).length).toBeLessThanOrEqual(40);
    expect(run(lesson, "A-B, A-C, A-D, A-E, A-F, A-G, A-H, B-C, C-D, D-E, E-F, F-G").length).toBeLessThanOrEqual(80);
  });
});

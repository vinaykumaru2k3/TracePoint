import { describe, expect, it } from "vitest";
import lesson from ".";
import { at, rets, run } from "../testkit";

describe("dfs generator", () => {
  it("visits the default graph depth first", () => {
    expect(rets(run(lesson, "A-B, A-C, B-D, C-D, C-E, D-F, E-F"), "dfs")).toEqual(["[A, B, D, C, E, F]"]);
  });

  it("holds the current path on the stack", () => {
    const steps = run(lesson, "A-B, A-C, B-D, C-D, C-E, D-F, E-F");
    const deep = steps.find((s) => s.title === "Go deeper to F")!;
    expect(deep.state.stack).toEqual(["A", "B", "D", "C", "E", "F"]);
    expect(at(steps, -1).state.stack).toEqual([]);
  });

  it("leaves an island unvisited", () => {
    expect(rets(run(lesson, "A-B, B-C, A-C, D-E"), "dfs")).toEqual(["[A, B, C]"]);
  });

  it("stays under the step limits", () => {
    expect(run(lesson, lesson.defaultText).length).toBeLessThanOrEqual(40);
    expect(run(lesson, "A-B, A-C, A-D, A-E, A-F, A-G, A-H, B-C, C-D, D-E, E-F, F-G").length).toBeLessThanOrEqual(80);
  });
});

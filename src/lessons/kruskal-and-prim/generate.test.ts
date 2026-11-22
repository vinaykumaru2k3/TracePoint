import { describe, expect, it } from "vitest";
import lesson from ".";
import { rets, run } from "../testkit";

describe("kruskal and prim generator", () => {
  it("both find the tree of cost 11", () => {
    const steps = run(lesson, lesson.defaultText);
    expect(rets(steps, "kruskal")).toEqual(["11 [AC, BC, DE, BD]"]);
    expect(rets(steps, "prim")).toEqual(["11 [AC, BC, BD, DE]"]);
  });

  it("skips edges that would close a loop", () => {
    const steps = run(lesson, lesson.defaultText);
    expect(steps.filter((s) => s.anchors.includes("kr.skip")).map((s) => s.notes["kr.skip"])).toEqual(["skip AB"]);
    expect(steps.filter((s) => s.anchors.includes("pr.skip")).map((s) => s.notes["pr.pop"])).toEqual(["AB:4"]);
  });

  it("ends with a forest when the graph is in pieces", () => {
    const steps = run(lesson, "A-B 1, B-C 2, A-C 3, D-E 4");
    expect(rets(steps, "kruskal")).toEqual(["7 [AB, BC, DE], forest of 2"]);
    expect(rets(steps, "prim")).toEqual(["3 [AB, BC], spans 3 of 5"]);
  });

  it("keeps runs short", () => {
    expect(run(lesson, lesson.defaultText).length).toBeLessThanOrEqual(40);
    expect(run(lesson, "A-B 9, A-C 8, A-D 7, A-E 6, A-F 5, A-G 4, A-H 3, B-C 1, C-D 1, D-E 1, E-F 1, F-G 1").length).toBeLessThanOrEqual(80);
  });
});

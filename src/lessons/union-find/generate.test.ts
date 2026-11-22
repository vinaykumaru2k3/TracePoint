import { describe, expect, it } from "vitest";
import lesson from ".";
import { at, rets, run } from "../testkit";

describe("union-find generator", () => {
  it("finds D's root and compresses its link", () => {
    const steps = run(lesson, lesson.defaultText);
    expect(rets(steps, "find")).toEqual(["A"]);
    const link = steps.find((s) => s.op === "find(D)" && s.anchors.includes("find.link"))!;
    expect(link.state.parent.D).toBe("A");
  });

  it("answers connected from the roots", () => {
    expect(rets(run(lesson, lesson.defaultText), "connected")).toEqual(["true", "false"]);
    expect(rets(run(lesson, "union A B, connected A G, find G"), "connected")).toEqual(["false"]);
    expect(rets(run(lesson, "union A B, connected A G, find G"), "find")).toEqual(["G"]);
  });

  it("reports a second union as already joined", () => {
    const steps = run(lesson, "union A B, union B C, union A C, connected A C, connected A D");
    expect(rets(steps, "union")).toEqual(["true", "true", "false"]);
    expect(steps.some((s) => s.anchors.includes("union.same"))).toBe(true);
  });

  it("hangs the smaller tree under the larger and keeps runs short", () => {
    const steps = run(lesson, "union A B, union C D, union A C, union E F, union G H, union E G, union A E, find H");
    expect(at(steps, -1).state.size.A).toBe(8);
    expect(run(lesson, lesson.defaultText).length).toBeLessThanOrEqual(40);
    expect(steps.length).toBeLessThanOrEqual(80);
    expect(lesson.parse("union A A").ok).toBe(false);
    expect(lesson.parse("merge A B").ok).toBe(false);
  });
});

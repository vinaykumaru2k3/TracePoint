import { describe, expect, it } from "vitest";
import lesson from ".";
import { at, rets, run } from "../testkit";

describe("bfs generator", () => {
  it("finds the fewest edges from A", () => {
    expect(rets(run(lesson, "A-B, A-C, B-D, C-D, C-E, D-F, E-F"), "bfs")).toEqual(["A0 B1 C1 D2 E2 F3"]);
  });

  it("polls nodes in order of distance", () => {
    const polls = run(lesson, "A-B, A-C, B-D, C-D, C-E, D-F, E-F").filter((s) => s.anchors.includes("bfs.poll"));
    expect(polls.map((s) => s.notes["bfs.poll"].slice(4, 5))).toEqual(["A", "B", "C", "D", "E", "F"]);
  });

  it("leaves an island unreached", () => {
    const steps = run(lesson, "A-B, B-C, A-C, D-E");
    expect(rets(steps, "bfs")).toEqual(["A0 B1 C1 D∞ E∞"]);
    expect(at(steps, -1).state.queue).toEqual([]);
  });

  it("honours start and keeps the default short", () => {
    expect(rets(run(lesson, "A-B, B-C, C-D, D-E, start C"), "bfs")).toEqual(["A2 B1 C0 D1 E2"]);
    expect(run(lesson, lesson.defaultText).length).toBeLessThanOrEqual(40);
    expect(run(lesson, "A-B, A-C, A-D, A-E, A-F, A-G, A-H, B-C, C-D, D-E, E-F, F-G").length).toBeLessThanOrEqual(80);
    expect(lesson.parse("A-B, start Z").ok).toBe(false);
  });
});

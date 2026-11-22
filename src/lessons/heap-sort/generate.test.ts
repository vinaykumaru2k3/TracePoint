import { describe, expect, it } from "vitest";
import lesson from ".";
import { at, rets, run } from "../testkit";

describe("heap-sort generator", () => {
  it("sorts the default input", () => {
    const steps = run(lesson, lesson.defaultText);
    expect(rets(steps, "heapSort")).toEqual(["[1, 2, 3, 4, 5, 8]"]);
    expect(steps.length).toBeLessThanOrEqual(40);
  });

  it("has a max-heap after the build phase", () => {
    const steps = run(lesson, lesson.defaultText);
    const first = steps.find((s) => s.op?.startsWith("swap"))!;
    const before = steps[steps.indexOf(first) - 1].state.a;
    expect(before.every((v: number, i: number) => i === 0 || before[(i - 1) >> 1] >= v)).toBe(true);
  });

  it("sorts duplicates and sorted input", () => {
    expect(at(rets(run(lesson, "4 2 4 1 2"), "heapSort"), -1)).toBe("[1, 2, 2, 4, 4]");
    expect(at(rets(run(lesson, "1 2 3 4 5 6"), "heapSort"), -1)).toBe("[1, 2, 3, 4, 5, 6]");
    expect(at(rets(run(lesson, "2 1"), "heapSort"), -1)).toBe("[1, 2]");
  });

  it("keeps eight reversed values under 80 steps", () => {
    const steps = run(lesson, "8 7 6 5 4 3 2 1");
    expect(steps.length).toBeLessThanOrEqual(80);
    expect(at(steps, -1).state.heap).toBe(0);
  });
});

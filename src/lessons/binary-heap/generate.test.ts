import { describe, expect, it } from "vitest";
import lesson from ".";
import { at, rets, run } from "../testkit";

const isHeap = (a: number[]) => a.every((v, i) => i === 0 || a[(i - 1) >> 1] <= v);

describe("binary-heap generator", () => {
  it("pops the default heap smallest first and keeps the heap rule", () => {
    const steps = run(lesson, lesson.defaultText);
    expect(rets(steps, "pop")).toEqual(["1", "2", "3"]);
    expect(steps.every((s) => s.kind !== "recap" && s.kind !== "check" || isHeap(s.state.a))).toBe(true);
    expect(at(steps, -1).state.a).toEqual([5, 9, 8]);
    expect(steps.length).toBeLessThanOrEqual(40);
  });

  it("returns null when popping an empty heap", () => {
    const steps = run(lesson, "pop, push 4, pop, pop");
    expect(rets(steps, "pop")).toEqual(["null", "4", "null"]);
    expect(steps.filter((s) => s.kind === "empty").length).toBe(2);
  });

  it("keeps duplicates", () => {
    const steps = run(lesson, "push 3, push 3, push 1, push 3, pop, pop");
    expect(rets(steps, "pop")).toEqual(["1", "3"]);
    expect(at(steps, -1).state.a).toEqual([3, 3]);
  });

  it("sorts anything it is given, one pop at a time", () => {
    const vals = [7, 2, 9, 4, 4, 0, 8, 1, 6, 3];
    const text = [...vals.map((v) => `push ${v}`), ...vals.slice(0, 6).map(() => "pop")].join(", ");
    const steps = run(lesson, text);
    expect(rets(steps, "pop")).toEqual(["0", "1", "2", "3", "4", "4"]);
    expect(steps.length).toBeLessThanOrEqual(80);
    expect(lesson.parse(Array.from({ length: 11 }, (_, i) => `push ${i}`).join(", ")).ok).toBe(false);
  });
});

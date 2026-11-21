import { describe, expect, it } from "vitest";
import lesson from ".";
import { at, rets, run } from "../testkit";

describe("merge-sort generator", () => {
  it("sorts the default input", () => {
    expect(at(rets(run(lesson, "5 1 4 2 8 3")), -1)).toBe("[1, 2, 3, 4, 5, 8]");
  });

  it("sorts duplicates", () => {
    expect(at(rets(run(lesson, "3 1 3 2")), -1)).toBe("[1, 2, 3, 3]");
  });

  it("keeps the max input under 80 steps", () => {
    expect(run(lesson, "8 7 6 5 4 3 2 1").length).toBeLessThanOrEqual(80);
  });

  it("gives no step to a one-element range", () => {
    expect(run(lesson, "5 1 4 2 8 3").filter((s) => /^split (\d)\.\.\1$/.test(s.op ?? ""))).toHaveLength(0);
  });

  it("gives two values a full lesson", () => {
    expect(run(lesson, "1 2").length).toBeGreaterThanOrEqual(6);
  });
  it("highlights the left or right take line for the half the value came from", () => {
    for (const [f, src] of Object.entries(lesson.code)) {
      const lines = (src as string).split("\n");
      const line = (a: string) => lines.find((l: string) => new RegExp(`@a ${a.replace(".", "\\.")}\\b`).test(l)) ?? "";
      expect(line("ms.takeL"), f).toMatch(/a\[i/);
      expect(line("ms.takeR"), f).toMatch(/a\[j/);
      expect(line("ms.restL"), f).toMatch(/a\[i/);
      expect(line("ms.restR"), f).toMatch(/a\[j/);
    }
    const steps = run(lesson, "5 1 4 2 8 3");
    const takes = steps.filter((s) => s.kind === "add");
    expect(takes.some((s) => s.anchors.includes("ms.takeL"))).toBe(true);
    expect(takes.some((s) => s.anchors.includes("ms.takeR"))).toBe(true);
    expect(takes.some((s) => s.anchors.includes("ms.restL") || s.anchors.includes("ms.restR"))).toBe(true);
  });
});

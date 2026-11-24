import { describe, expect, it } from "vitest";
import lesson from ".";
import { at, rets, run } from "../testkit";
import type { DPState } from "../dpkit";

const gridOf = (s: { state: DPState }) => (s.state.kind === "grid" ? s.state.grid.map((r) => r.map((c) => c.v)) : []);
const statesOf = (s: { state: DPState }) => (s.state.kind === "grid" ? s.state.grid.map((r) => r.map((c) => c.state)) : []);
const taken = (s: { state: DPState }) => s.state.strip?.cells.map((t) => t.v) ?? [];

describe("knapsack generator", () => {
  it("finds best value 7 with items 1 and 2 for the default input", () => {
    const steps = run(lesson, lesson.defaultText);
    expect(at(rets(steps), -1)).toBe("7");
    const last = at(steps, -1);
    expect(gridOf(last)[4][5]).toBe(7);
    expect(taken(last)).toEqual(["3:4", "2:3"]);
    expect(steps.filter((s) => s.kind === "found").length).toBe(2);
    expect(steps[0].kind).toBe("problem");
    expect(last.kind).toBe("recap");
  });

  it("starts with row 0 all zeros and one step per cell", () => {
    const steps = run(lesson, lesson.defaultText);
    const base = steps[1];
    expect(gridOf(base)[0]).toEqual([0, 0, 0, 0, 0, 0]);
    expect(gridOf(base).map((r) => r[0])).toEqual([0, 0, 0, 0, 0]);
    expect(gridOf(base)[1][3]).toBe(null);
    expect(steps.filter((s) => s.kind === "add" || s.kind === "check").length).toBe(1 + 4 * 5);
  });

  it("add takes the item, check copies from above, and read cells are compare", () => {
    const steps = run(lesson, "items 2:3, 3:4, 4:5, 5:6 cap 5");
    const add = steps.find((s) => s.op === "i1 w2")!;
    expect(add.kind).toBe("add");
    expect(gridOf(add)[1][2]).toBe(3);
    expect(statesOf(add)[1][2]).toBe("active");
    expect(statesOf(add)[0][0]).toBe("compare");
    const check = steps.find((s) => s.op === "i1 w1")!;
    expect(check.kind).toBe("check");
    expect(gridOf(check)[1][1]).toBe(0);
  });

  it("never takes an item heavier than the capacity; its row equals the row above", () => {
    const steps = run(lesson, "items 2:3, 7:9, 3:4 cap 5");
    const heavy = steps.filter((s) => s.op?.startsWith("i2 "));
    expect(heavy.length).toBe(5);
    expect(heavy.every((s) => s.kind === "check")).toBe(true);
    const g = gridOf(at(steps, -1));
    expect(g[2]).toEqual(g[1]);
    expect(taken(at(steps, -1))).not.toContain("7:9");
    expect(at(rets(steps), -1)).toBe("7");
  });

  it("takes nothing when no item fits", () => {
    const steps = run(lesson, "items 5:9 cap 3");
    expect(at(rets(steps), -1)).toBe("0");
    expect(steps.some((s) => s.kind === "found")).toBe(false);
  });

  it("limits input and keeps runs short", () => {
    expect(lesson.parse("items 2:3 cap 9").ok).toBe(false);
    expect(lesson.parse("items 2:3 cap 0").ok).toBe(false);
    expect(lesson.parse("items 9:3 cap 5").ok).toBe(false);
    expect(lesson.parse("items 2:21 cap 5").ok).toBe(false);
    expect(lesson.parse("items 1:1, 2:2, 3:3, 4:4, 5:5 cap 5").ok).toBe(false);
    expect(lesson.parse("items 2 3 cap 5").ok).toBe(false);
    expect(lesson.parse("2:3 3:4").ok).toBe(false);
    expect(run(lesson, lesson.defaultText).length).toBeLessThanOrEqual(40);
    expect(run(lesson, "items 1:20, 2:19, 3:18, 4:17 cap 8").length).toBeLessThanOrEqual(80);
  });

  it("keeps every op within 14 characters on extreme inputs, unique against neighbours", () => {
    for (const t of ["items 1:20, 2:19, 3:18, 4:17 cap 8", "items 8:20, 8:20, 8:20, 8:20 cap 8", "items 1:1 cap 1", "items 1:10, 1:10, 1:10, 1:10 cap 8"]) {
      const s = run(lesson, t);
      s.forEach((x, i) => {
        expect(x.short !== undefined || (x.op ?? "").length <= 14).toBe(true);
        if (i) expect(x.short ?? x.op).not.toBe(s[i - 1].short ?? s[i - 1].op);
      });
    }
  });

  it("anchors the copy line on check steps and the traceback lines on found steps", () => {
    const steps = run(lesson, lesson.defaultText);
    for (const s of steps.filter((x) => x.kind === "check")) expect(s.anchors).toContain("kn.copy");
    for (const s of steps.filter((x) => x.kind === "found")) {
      expect(s.anchors).toEqual(expect.arrayContaining(["kn.tb", "kn.step"]));
      expect(Object.keys(s.notes)).toEqual(expect.arrayContaining(["kn.tb", "kn.step"]));
      expect(statesOf(s).flat()).toContain("compare");
    }
    for (const i of [1, 2, 3, 4]) expect(steps.find((x) => x.op === `i${i} w1`)!.anchors).toContain("kn.item");
  });
  it("names the row headers as weight:value in the metrics line", () => {
    const steps = run(lesson, lesson.defaultText);
    const step = steps.find((x) => x.state.i === 1)!;
    const m = lesson.metrics!({ state: step.state } as never);
    expect(m.find((x) => x.label === "weight:value")?.value).toBe("2:3");
    expect(lesson.metrics!({ state: steps[0].state } as never).find((x) => x.label === "weight:value")?.value).toBe("-");
  });
});

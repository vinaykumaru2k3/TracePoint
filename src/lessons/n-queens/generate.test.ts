import { describe, expect, it } from "vitest";
import lesson from ".";
import { rets, run } from "../testkit";

describe("n-queens generator", () => {
  it("finds the first 4-queens solution", () => {
    expect(rets(run(lesson, "4"))).toEqual(["[1, 3, 0, 2]"]);
  });

  it("finds the first 5-queens solution", () => {
    expect(rets(run(lesson, "5"))).toEqual(["[0, 2, 4, 1, 3]"]);
  });

  it("reports that a 3x3 board has no solution", () => {
    const s = run(lesson, "3");
    expect(rets(s)).toEqual(["[]"]);
    expect(s.find((x) => x.ret === "[]")?.kind).toBe("empty");
  });

  it("keeps runs short", () => {
    expect(run(lesson, "4").length).toBeLessThanOrEqual(60);
    expect(run(lesson, "5").length).toBeLessThanOrEqual(60);
  });
  it("only calls a lift a dead end of attacked squares when the next row had no safe square", () => {
    for (const text of ["4", "3", "5"]) {
      const steps = run(lesson, text);
      steps.forEach((s, i) => {
        if (s.kind !== "remove") return;
        const r = (s.state as { row: number }).row;
        let p = i - 1;
        while (!(steps[p].kind === "add" && (steps[p].state as { row: number }).row === r)) p--;
        const placedBelow = steps.slice(p + 1, i).some((x) => x.kind === "add" && (x.state as { row: number }).row === r + 1);
        expect(/Every square in row \d+ is attacked/.test(s.text), `${text} step ${i + 1}`).toBe(!placedBelow);
      });
    }
  });
});

import { describe, expect, it } from "vitest";
import lesson from ".";
import { rets, run } from "../testkit";

const A = "1 3 4 6 8 11 14 17";

describe("binary-search generator", () => {
  it("returns the index of the target", () => {
    expect(rets(run(lesson, `${A} target 11`))).toEqual(["5"]);
  });

  it("returns -1 for absent targets inside, below and above the range", () => {
    for (const t of [5, 0, 99]) {
      const s = run(lesson, `${A} target ${t}`);
      expect(rets(s), String(t)).toEqual(["-1"]);
      expect(s.find((x) => x.ret === "-1")?.kind).toBe("empty");
    }
  });

  it("never needs more than 4 probes over 8 values", () => {
    for (let t = 0; t <= 18; t++) {
      expect(run(lesson, `${A} target ${t}`).filter((s) => s.kind === "check").length, String(t)).toBeLessThanOrEqual(4);
    }
  });

  it("sorts unsorted input first", () => {
    expect(rets(run(lesson, "9 2 14 5 7 1 target 7"))).toEqual(["3"]);
  });
});

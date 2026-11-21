import { describe, expect, it } from "vitest";
import lesson from ".";
import { rets, run } from "../testkit";

describe("fast and slow pointers generator", () => {
  it("detects a cycle", () => {
    expect(rets(run(lesson, "1 2 3 4 5 6 cycle 2"))).toEqual(["true"]);
    expect(rets(run(lesson, "5 6 7 8 cycle 3"))).toEqual(["true"]);
  });

  it("reports no cycle when fast hits null", () => {
    expect(rets(run(lesson, "3 1 4 1 5"))).toEqual(["false"]);
    expect(rets(run(lesson, "3 1 4 1"))).toEqual(["false"]);
  });

  it("meets on the same node", () => {
    const met = run(lesson, "1 2 3 4 cycle 0").find((x) => x.kind === "found")!;
    expect(met.state.slow).toBe(met.state.fast);
  });

  it("rejects a cycle index past the end", () => {
    expect(lesson.parse("1 2 3 cycle 3").ok).toBe(false);
  });
});

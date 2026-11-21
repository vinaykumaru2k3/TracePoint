import { describe, expect, it } from "vitest";
import lesson from ".";
import { at, rets, run } from "../testkit";

describe("hash table chaining generator", () => {
  it("adds, finds and removes through one bucket", () => {
    const s = run(lesson, "add 12, add 7, add 22, contains 17, contains 22, remove 7, add 12");
    expect(rets(s)).toEqual(["true", "true", "true", "false", "true", "true", "false"]);
    const chains = at(s, -1)!.state.chains as { v: number }[][];
    expect(chains[2].map((e) => e.v)).toEqual([12, 22]);
  });

  it("scans each entry of the chain", () => {
    const s = run(lesson, "add 5, add 10, add 15, contains 20");
    expect(s.filter((x) => x.op === "contains(20)" && x.anchors.includes("contains.scan"))).toHaveLength(3);
  });

  it("rejects chains longer than the stage", () => {
    expect(lesson.parse("add 0, add 5, add 10, add 15, add 20, add 25").ok).toBe(false);
  });
});

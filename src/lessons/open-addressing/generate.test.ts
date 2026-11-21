import { describe, expect, it } from "vitest";
import lesson from ".";
import { TOMB } from "./generate";
import { at, rets, run } from "../testkit";

describe("open addressing generator", () => {
  it("probes forward on collisions and wraps", () => {
    const s = run(lesson, "add 6, add 13, add 20");
    expect(at(s, -1)!.state.slots).toEqual([13, 20, null, null, null, null, 6]);
  });

  it("finds keys past a tombstone and reuses it", () => {
    const s = run(lesson, "add 10, add 3, add 17, add 24, remove 17, contains 24, add 31");
    expect(rets(s)).toEqual(["true", "true", "true", "true", "true", "true", "true"]);
    expect(at(s, -1)!.state.slots).toEqual([null, null, null, 10, 3, 31, 24]);
    const removed = s.find((x) => x.op === "remove(17)" && x.kind === "remove")!;
    expect(removed.state.slots[5]).toBe(TOMB);
  });

  it("rejects duplicates and a full table", () => {
    expect(rets(run(lesson, "add 9, add 16, add 9"))).toEqual(["true", "true", "false"]);
    const full = run(lesson, "add 1, add 2, add 3, add 4, add 5, add 6, add 7, add 8");
    expect(at(full, -2)).toMatchObject({ ret: "false", retNote: "table is full" });
  });

  it("misses when it reaches an empty slot", () => {
    expect(rets(run(lesson, "add 6, add 13, contains 27"))).toEqual(["true", "true", "false"]);
  });
});

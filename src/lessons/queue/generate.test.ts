import { describe, expect, it } from "vitest";
import { parseOps } from "../parseOps";
import { generateQueue } from "./generate";

const run = (text: string) => {
  const r = parseOps(text, "offer", ["poll", "peek"]);
  if (!r.ok) throw new Error(r.error);
  return generateQueue(r.input);
};

describe("queue generator", () => {
  it("polls in first-in-first-out order", () => {
    const s = run("offer 4 offer 9 offer 2 poll poll poll");
    expect(s.filter((x) => x.op === "poll()").map((x) => x.ret)).toEqual(["4", "9", "2"]);
  });

  it("wraps the rear around the array", () => {
    const s = run("offer 4 offer 9 offer 2 poll offer 7 offer 5");
    const last = s[s.length - 2];
    expect(last.state.wrapped).toBe(true);
    expect(last.state.cell).toBe(0);
    expect(last.state.size).toBe(4);
  });

  it("keeps size equal to the number of items", () => {
    for (const st of run("offer 4 offer 9 peek poll offer 7 poll poll poll")) {
      expect(st.state.size).toBe(st.state.items.length);
    }
  });

  it("returns null for poll and peek on empty, throws when full", () => {
    expect(run("poll")[1]).toMatchObject({ kind: "empty", ret: "null" });
    expect(run("peek")[1]).toMatchObject({ kind: "empty", ret: "null" });
    const full = run("offer 1 offer 2 offer 3 offer 4 offer 5");
    expect(full[5]).toMatchObject({ kind: "empty", ret: "throws" });
  });
});

import { describe, expect, it } from "vitest";
import lesson from ".";
import { at, rets, run } from "../testkit";

describe("deque generator", () => {
  it("pops from both ends in the right order", () => {
    const s = run(lesson, "pushback 4, pushback 9, pushfront 2, pushfront 7, popback, popfront, popfront, popfront");
    expect(rets(s, "pop")).toEqual(["9", "7", "2", "4"]);
  });

  it("wraps head backwards from slot 0", () => {
    const s = run(lesson, "pushfront 3");
    expect(s[1].state).toMatchObject({ head: 5, wrapped: true });
  });

  it("keeps size equal to the number of items", () => {
    for (const st of run(lesson, "pushback 1, pushfront 2, popback, pushback 3, popfront, popfront")) {
      expect(st.state.size).toBe(st.state.items.length);
    }
  });

  it("throws when empty or full", () => {
    expect(run(lesson, "popfront")[1]).toMatchObject({ kind: "empty", retNote: "deque is empty" });
    const full = run(lesson, "pushback 1, pushback 2, pushback 3, pushback 4, pushback 5, pushback 6, pushfront 7");
    expect(at(full, -2)).toMatchObject({ kind: "empty", retNote: "deque is full" });
  });
});

import { describe, expect, it } from "vitest";
import lesson from ".";
import { at, rets, run } from "../testkit";

const order = (st: { nodes: { v: number; lift?: boolean }[] }) => st.nodes.filter((n) => !n.lift).map((n) => n.v);

describe("singly linked list generator", () => {
  it("adds at both ends", () => {
    const s = run(lesson, "addlast 4, addlast 9, addfirst 2");
    expect(order(at(s, -1)!.state)).toEqual([2, 4, 9]);
  });

  it("walks one node per step for contains", () => {
    const s = run(lesson, "addlast 1, addlast 2, addlast 3, contains 3, contains 8");
    expect(rets(s, "contains")).toEqual(["true", "false"]);
    expect(s.filter((x) => x.op === "contains(3)")).toHaveLength(3);
  });

  it("deletes head, middle and tail and keeps tail right", () => {
    const s = run(lesson, "addlast 1, addlast 2, addlast 3, addlast 4, delete 1, delete 3, delete 4, delete 9");
    expect(rets(s, "delete")).toEqual(["true", "true", "true", "false"]);
    const end = at(s, -1)!.state;
    expect(order(end)).toEqual([2]);
    expect(end.tail).toBe(end.head);
  });

  it("limits adds to what fits", () => {
    expect(lesson.parse("addlast 1, addlast 2, addlast 3, addlast 4, addlast 5, addlast 6, addfirst 7").ok).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import lesson from ".";
import { at, rets, run } from "../testkit";

type N = { id: number; v: number; next: number | null; prev: number | null; lift?: boolean };

describe("doubly linked list generator", () => {
  it("removes from both ends", () => {
    const s = run(lesson, "addlast 5, addlast 8, addfirst 3, removelast, removefirst, removefirst");
    expect(rets(s, "remove")).toEqual(["8", "3", "5"]);
    expect(at(s, -1)!.state).toMatchObject({ head: null, tail: null });
  });

  it("keeps next and prev consistent after every op", () => {
    const s = run(lesson, "addfirst 2, addlast 4, addfirst 1, addlast 6, removelast, removefirst");
    for (const n of at(s, -1)!.state.nodes as N[]) {
      const all = at(s, -1)!.state.nodes as N[];
      if (n.next !== null) expect(all.find((m) => m.id === n.next)!.prev).toBe(n.id);
      if (n.prev !== null) expect(all.find((m) => m.id === n.prev)!.next).toBe(n.id);
    }
  });

  it("throws on an empty list", () => {
    expect(run(lesson, "removelast")[1]).toMatchObject({ kind: "empty", ret: "throws" });
  });
});

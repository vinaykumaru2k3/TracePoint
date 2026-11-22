import { describe, expect, it } from "vitest";
import lesson from ".";
import { at, rets, run } from "../testkit";
import type { TNode, TPointer } from "../../iso/TreeNodes";

describe("tree-traversals generator", () => {
  it("walks the default tree in all four orders", () => {
    expect(rets(run(lesson, "4 2 6 1 3 5 7")).slice(0, 4)).toEqual([
      "[4, 2, 1, 3, 6, 5, 7]", "[1, 2, 3, 4, 5, 6, 7]", "[1, 3, 2, 5, 7, 6, 4]", "[4, 2, 6, 1, 3, 5, 7]"
    ]);
  });

  it("marks the recursion path on the way down", () => {
    const s = run(lesson, "4 2 6 1 3 5 7").find((x) => x.op === "preorder(1)")!;
    expect(s.state.stack).toEqual([4, 2, 1]);
    expect(s.state.nodes.filter((n: TNode) => n.state === "visited").map((n: TNode) => n.v).sort()).toEqual([2, 4]);
  });

  it("rejects duplicate keys", () => {
    expect(lesson.parse("3 1 3").ok).toBe(false);
  });

  it("keeps nine sorted keys under 80 steps and one key a full lesson", () => {
    expect(run(lesson, "1 2 3 4 5 6 7 8 9").length).toBeLessThanOrEqual(80);
    expect(run(lesson, "7").length).toBeGreaterThanOrEqual(6);
    expect(at(rets(run(lesson, "7")), -1)).toBe("[7]");
  });
});

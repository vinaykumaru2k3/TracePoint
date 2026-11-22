import { describe, expect, it } from "vitest";
import lesson from ".";
import { at, rets, run } from "../testkit";
import type { TNode, TPointer } from "../../iso/TreeNodes";

const inorder = (s: { state: { nodes: { v: number | string; col: number; state?: string }[] } }) =>
  [...s.state.nodes].filter((n) => n.state !== "stale").sort((a, b) => a.col - b.col).map((n) => n.v);

describe("bst generator", () => {
  it("finds a key that is there and misses one that is not", () => {
    const steps = run(lesson, lesson.defaultText);
    expect(rets(steps, "search")).toEqual(["true", "false"]);
    expect(steps.length).toBeLessThanOrEqual(40);
  });

  it("keeps keys sorted after deleting a node with two children", () => {
    const steps = run(lesson, lesson.defaultText);
    expect(steps.some((s) => s.anchors.includes("del.copy"))).toBe(true);
    expect(inorder(at(steps, -1))).toEqual([40, 60, 70, 80]);
  });

  it("deletes the root and keeps the tree searchable", () => {
    const steps = run(lesson, "insert 8, insert 4, insert 12, insert 10, delete 8, search 10");
    const last = at(steps, -1);
    expect(inorder(last)).toEqual([4, 10, 12]);
    expect(last.state.ptrs.find((p: TPointer) => p.label === "root")!.node).toBe(last.state.nodes.find((n: TNode) => n.v === 10)!.id);
    expect(at(rets(steps, "search"), -1)).toBe("true");
  });

  it("ignores a duplicate insert", () => {
    const steps = run(lesson, "insert 5, insert 3, insert 5");
    expect(rets(steps, "insert")).toEqual(["true", "true", "false"]);
    expect(at(steps, -1).state.size).toBe(2);
  });

  it("handles leaf, one-child and missing deletes, and an empty tree", () => {
    const steps = run(lesson, "delete 4, search 4, insert 5, insert 3, insert 2, delete 3, delete 2, delete 9");
    expect(inorder(at(steps, -1))).toEqual([5]);
    expect(steps.filter((s) => s.kind === "empty").length).toBe(3);
  });

  it("turns sorted input into a chain as tall as the input", () => {
    const steps = run(lesson, "insert 1, insert 2, insert 3, insert 4, insert 5, insert 6, insert 7, insert 8, insert 9, search 9");
    expect(at(steps, -1).state.height).toBe(9);
    expect(steps.length).toBeLessThanOrEqual(80);
    expect(lesson.parse("insert 1, insert 2, insert 3, insert 4, insert 5, insert 6, insert 7, insert 8, insert 9, insert 10").ok).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import lesson from ".";
import { at, run } from "../testkit";
import type { TNode, TPointer } from "../../iso/TreeNodes";

const sorted = (s: { state: { nodes: { v: number | string; col: number }[] } }) => [...s.state.nodes].sort((a, b) => a.col - b.col).map((n) => n.v);
const rootOf = (s: { state: { nodes: { v: number | string; depth: number }[] } }) => s.state.nodes.find((n) => n.depth === 0)!.v;

describe("avl-rotations generator", () => {
  it("balances the default input with root 20", () => {
    const steps = run(lesson, lesson.defaultText);
    const last = at(steps, -1);
    expect(sorted(last)).toEqual([4, 5, 10, 20, 25, 28, 30]);
    expect(rootOf(last)).toBe(20);
    expect(last.state.cases).toEqual(["RR", "LR", "LL"]);
    expect(steps.length).toBeLessThanOrEqual(40);
  });

  it("turns sorted input into a perfect tree of height 3", () => {
    const last = at(run(lesson, "1 2 3 4 5 6 7"), -1);
    expect(last.state.height).toBe(3);
    expect(rootOf(last)).toBe(4);
    expect(last.state.nodes.every((n: TNode) => n.tag === "bf 0")).toBe(true);
  });

  it("covers the right-left case", () => {
    const last = at(run(lesson, "10 30 20"), -1);
    expect(last.state.cases).toEqual(["RL"]);
    expect(rootOf(last)).toBe(20);
  });

  it("ignores a duplicate and never leaves a balance factor beyond 1", () => {
    const steps = run(lesson, "5 3 8 3");
    expect(at(steps, -1).state.size).toBe(3);
    expect(steps.some((s) => s.anchors.includes("ins.dup"))).toBe(true);
    const worst = run(lesson, "8 7 6 5 4 3 2 1");
    expect(worst.length).toBeLessThanOrEqual(80);
    expect(at(worst, -1).state.nodes.every((n: TNode) => ["bf 0", "bf +1", "bf -1"].includes(n.tag!))).toBe(true);
  });
});

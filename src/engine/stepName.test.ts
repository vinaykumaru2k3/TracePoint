import { describe, expect, it } from "vitest";
import { runOpOf, stepName } from "./stepName";
import type { Step } from "./types";

const step = (p: Partial<Step<unknown>>): Step<unknown> => ({ kind: "check", title: "t", idea: "i", text: "x", anchors: [], notes: {}, op: null, state: {}, ...p } as Step<unknown>);

describe("stepName", () => {
  it("returns short when set", () => {
    const steps = [step({ op: "a1 b2", short: "A = B" })];
    expect(stepName(steps, 0, null)).toBe("A = B");
  });
  it("returns the kind when the op is the run op", () => {
    const steps = [step({ op: "go", kind: "add" }), step({ op: "go", kind: "check" }), step({ op: "other" })];
    const op = runOpOf(steps);
    expect(op).toBe("go");
    expect(stepName(steps, 0, op)).toBe("add");
    expect(stepName(steps, 2, op)).toBe("other");
  });
  it("names op-less first and last steps start and recap", () => {
    const steps = [step({}), step({ op: "x" }), step({})];
    expect(stepName(steps, 0, null)).toBe("start");
    expect(stepName(steps, 2, null)).toBe("recap");
  });
  it("runOpOf is null when no op reaches 40%", () => {
    const steps = [step({ op: "a" }), step({ op: "b" }), step({ op: "c" }), step({ op: "d" }), step({ op: "e" })];
    expect(runOpOf(steps)).toBeNull();
  });
});

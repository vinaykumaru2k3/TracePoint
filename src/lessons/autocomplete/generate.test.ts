import { describe, expect, it } from "vitest";
import lesson from ".";
import { at, rets, run } from "../testkit";
import { parseAc } from "./generate";

describe("autocomplete generator", () => {
  it("suggests the default words in order", () => {
    const steps = run(lesson, lesson.defaultText);
    expect(rets(steps, "complete")).toEqual(["[car, care, cart, cat]"]);
    expect(at(steps, -1).state.out).toEqual(["car", "care", "cart", "cat"]);
  });

  it("includes the prefix when it is a word", () => {
    expect(rets(run(lesson, "app apple apply ape, prefix app"), "complete")).toEqual(["[app, apple, apply]"]);
  });

  it("returns an empty list for a missing prefix", () => {
    const steps = run(lesson, "sun sand sea, prefix so");
    expect(rets(steps, "complete")).toEqual(["[]"]);
    expect(steps.some((s) => s.kind === "empty")).toBe(true);
  });

  it("ignores duplicate words", () => {
    expect(rets(run(lesson, "go go gone, prefix go"), "complete")).toEqual(["[go, gone]"]);
  });

  it("rejects bad input", () => {
    expect(parseAc("car cat").ok).toBe(false);
    expect(parseAc("car c4t, prefix ca").ok).toBe(false);
    expect(parseAc("a b c d e f g h i, prefix a").ok).toBe(false);
    expect(parseAc("car, prefix").ok).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import lesson from ".";
import { at, rets, run } from "../testkit";
import { parseTrie } from "./generate";

describe("trie generator", () => {
  it("answers the default run", () => {
    const steps = run(lesson, lesson.defaultText);
    expect(rets(steps, "search")).toEqual(["true", "false", "false"]);
    expect(rets(steps, "startsWith")).toEqual(["true", "true"]);
    expect(at(steps, -1).state.words).toBe(4);
  });

  it("finds a word only once it is inserted", () => {
    expect(rets(run(lesson, "insert cart, search car"), "search")).toEqual(["false"]);
    expect(rets(run(lesson, "insert cart, insert car, search car"), "search")).toEqual(["true"]);
  });

  it("shares prefix nodes and ignores a second insert", () => {
    const steps = run(lesson, "insert tea, insert ten, insert tea");
    expect(at(steps, -1).state.size).toBe(5);
    expect(at(steps, -1).state.words).toBe(2);
  });

  it("checks prefixes", () => {
    expect(rets(run(lesson, "insert dog, prefix do, prefix da"), "startsWith")).toEqual(["true", "false"]);
  });

  it("rejects bad input", () => {
    expect(parseTrie("insert Cat9").ok).toBe(false);
    expect(parseTrie("insert abcdefg").ok).toBe(false);
    expect(parseTrie("delete cat").ok).toBe(false);
    expect(parseTrie("insert abcdef, insert ghijkl, insert mnopqr, insert stuvwx, insert yz").ok).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import lesson from ".";
import { rets, run } from "../testkit";

describe("strings generator", () => {
  it("reverses and detects a palindrome", () => {
    const s = run(lesson, "level");
    expect(rets(s, "reverse")).toEqual(['"level"']);
    expect(rets(s, "isPalindrome")).toEqual(["true"]);
  });

  it("rejects a non-palindrome", () => {
    const s = run(lesson, "stack");
    expect(rets(s, "reverse")).toEqual(['"kcats"']);
    expect(rets(s, "isPalindrome")).toEqual(["false"]);
  });
});

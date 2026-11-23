import { describe, expect, it, vi } from "vitest";
import { readAsked, runMax } from "./useLessonRun";

describe("readAsked and runMax", () => {
  it("reads the asked input, falling back to the default with a reason", () => {
    const parse = vi.fn((t: string) => t === "ok" ? { ok: true, input: 1 } : { ok: false, error: "Bad." });
    const L = { parse, defaultText: "ok" } as never;
    expect(readAsked(L, null)).toEqual({ text: "ok", linkError: "" });
    expect(readAsked(L, "x".repeat(400_000)).linkError).toMatch(/too long/);
    expect(parse).not.toHaveBeenCalled();
    expect(readAsked(L, "zz")).toEqual({ text: "ok", linkError: "This link's input could not run, so the default run is shown. Bad." });
    expect(readAsked(L, "ok")).toEqual({ text: "ok", linkError: "" });
  });
  it("restarts the furthest step for a different input only", () => {
    expect(runMax({ text: "a", max: 9 }, "b", 2)).toEqual({ text: "b", max: 2 });
    expect(runMax({ text: "a", max: 9 }, "a", 4)).toEqual({ text: "a", max: 9 });
  });
});

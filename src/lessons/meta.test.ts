import { describe, expect, it } from "vitest";
import { LESSONS } from ".";
import { DEFAULT_LESSON, LESSON_META, META_BY_ID } from "./meta";

describe("lesson meta", () => {
  it("matches the eager registry: ids in order, titles, sections, default-run lengths", () => {
    expect(LESSON_META.map((m) => m.id)).toEqual(LESSONS.map((l) => l.id));
    for (const l of LESSONS) {
      const m = META_BY_ID[l.id];
      expect([m.title, m.section]).toEqual([l.title, l.section]);
      const r = l.parse(l.defaultText);
      expect(m.steps).toBe(r.ok ? l.generate(r.input).length : 1);
    }
    expect(DEFAULT_LESSON).toBe(LESSONS[0].id);
  });

  it("app code never imports the eager registry", () => {
    const files = import.meta.glob<string>(["/src/**/*.{ts,tsx}", "!/src/**/*.test.*", "!/src/test/**"], { query: "?raw", import: "default", eager: true });
    expect(Object.keys(files).length).toBeGreaterThan(50);
    const bad = Object.entries(files).filter(([, text]) => /from\s+["'](\.\.?\/)+lessons(\/index)?["']/.test(text)).map(([f]) => f);
    expect(bad).toEqual([]);
  });
});

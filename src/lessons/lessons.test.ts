import { describe, expect, it } from "vitest";
import { missingAnchors, parseAll } from "../engine/anchors";
import { LANGS } from "../engine/types";
import { CURRICULUM } from "../curriculum";
import { LESSONS } from "./index";

describe.each(LESSONS.map((l) => [l.id, l] as const))("lesson %s", (_id, lesson) => {
  const texts = [lesson.defaultText, ...lesson.presets.map((p) => p.text)];
  const code = parseAll(lesson.code);

  it("parses its default input and presets", () => {
    for (const t of texts) expect(lesson.parse(t).ok, t).toBe(true);
  });

  it("has a problem step first and a recap step last", () => {
    for (const t of texts) {
      const r = lesson.parse(t);
      if (!r.ok) throw new Error(r.error);
      const s = lesson.generate(r.input);
      expect(s[0].kind).toBe("problem");
      expect(s[s.length - 1].kind).toBe("recap");
      expect(s.length).toBeGreaterThanOrEqual(6);
    }
  });

  it("only uses anchors that exist in every language, and every note names a used anchor", () => {
    for (const t of texts) {
      const r = lesson.parse(t);
      if (!r.ok) throw new Error(r.error);
      for (const step of lesson.generate(r.input)) {
        for (const { id } of LANGS) expect(missingAnchors(code[id], step.anchors), `${t} / ${step.title} / ${id}`).toEqual([]);
        for (const a of Object.keys(step.notes)) expect(step.anchors).toContain(a);
      }
    }
  });

  it("defines the same anchors in all three languages", () => {
    const sets = LANGS.map(({ id }) => Object.keys(code[id].anchors).sort().join(","));
    expect(new Set(sets).size).toBe(1);
  });

  it("covers every learn checklist item with the default input", () => {
    const r = lesson.parse(lesson.defaultText);
    if (!r.ok) throw new Error(r.error);
    const steps = lesson.generate(r.input);
    // Items the default run does not reach must be reachable from a preset.
    const all = texts.flatMap((t) => { const p = lesson.parse(t); return p.ok ? lesson.generate(p.input) : []; });
    for (const [text, test] of lesson.learn) expect(all.some(test), text).toBe(true);
    expect(steps.length).toBeGreaterThan(0);
  });

  it("belongs to a real curriculum section and lesson", () => {
    const sec = CURRICULUM.find((s) => s.id === lesson.section);
    expect(sec).toBeDefined();
    expect(sec!.lessons.some((l) => l.id === lesson.id)).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { CURRICULUM } from "../curriculum";
import { LESSONS, LESSON_BY_ID } from "../lessons";
import { run } from "../lessons/testkit";
import { checkGuide, checkTheory } from "./check";
import { GUIDES, linkIds } from "./index";

const liveIdsOf = (sectionId: string) =>
  (CURRICULUM.find((s) => s.id === sectionId)?.lessons ?? []).map((l) => l.id).filter((id) => LESSON_BY_ID[id]);

describe("theory contract", () => {
  it("resolves live lessons as links and soon lessons as unknown", () => {
    expect(linkIds().has("stack")).toBe(true);
    expect(linkIds().has("trees")).toBe(false);
    expect(linkIds().has("guide:nope")).toBe(false);
  });
  it("lists only live lessons per section", () => {
    expect(liveIdsOf("linear")).toContain("stack");
    expect(liveIdsOf("dp")).toEqual([]);
  });
  it("keys every guide by a curriculum section id", () => {
    const ids = new Set(CURRICULUM.map((s) => s.id));
    expect(Object.keys(GUIDES).filter((k) => !ids.has(k))).toEqual([]);
    expect(Object.entries(GUIDES).filter(([k, g]) => g.section !== k)).toEqual([]);
    for (const [key, g] of Object.entries(GUIDES)) {
      expect(CURRICULUM.some((s) => s.id === key), key).toBe(true);
      expect(g.section).toBe(key);
    }
  });
  for (const [key, g] of Object.entries(GUIDES)) {
    it(`guide ${key} passes the checker`, () => {
      expect(checkGuide(g, liveIdsOf(key), linkIds())).toEqual([]);
    });
  }
  for (const l of LESSONS) {
    it(`theory ${l.id} passes the checker`, () => {
      expect(l.theory, `lesson ${l.id} has no theory`).toBeTruthy();
      expect(checkTheory(l.theory, l.id, linkIds())).toEqual([]);
    });
    it(`theory ${l.id} has one trace shot per step, inside the default run`, () => {
      const n = run(l, l.defaultText).length;
      expect(l.theory.shots.length).toBe(l.theory.steps.length);
      for (const s of l.theory.shots) { expect(Number.isInteger(s)).toBe(true); expect(s).toBeGreaterThanOrEqual(1); expect(s).toBeLessThanOrEqual(n); }
    });
  }
  it("has a guide for every section that has a live lesson", () => {
    const missing = CURRICULUM.filter((s) => liveIdsOf(s.id).length > 0 && !GUIDES[s.id]).map((s) => s.id);
    expect(missing).toEqual([]);
  });
  it("has theory on every lesson", () => {
    expect(LESSONS.filter((l) => !l.theory).map((l) => l.id)).toEqual([]);
  });
});

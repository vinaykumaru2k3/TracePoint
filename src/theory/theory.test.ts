import { describe, expect, it } from "vitest";
import { CURRICULUM } from "../curriculum";
import { LESSONS, LESSON_BY_ID } from "../lessons";
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
    expect(liveIdsOf("trees")).toEqual([]);
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
    if (!l.theory) continue;
    it(`theory ${l.id} passes the checker`, () => {
      expect(checkTheory(l.theory!, l.id, linkIds())).toEqual([]);
    });
  }
});

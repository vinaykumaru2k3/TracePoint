import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "../app/App";
import { LESSONS } from ".";
import { LESSON_META } from "./meta";
import { clearLessons, loadLesson, peekLesson, primeLessons, setLoadersForTest } from "./load";

const renderAt = (path: string, onVisit: (id: string, idx: number) => void) => renderToStaticMarkup(
  <MemoryRouter initialEntries={[path]}><AppRoutes progress={{}} onVisit={onVisit} courseOpen={false} onCloseCourse={() => {}} /></MemoryRouter>);

describe("lesson loader", () => {
  beforeAll(() => {
    const mq = { matches: false, addEventListener() {}, removeEventListener() {} };
    vi.stubGlobal("window", { innerHeight: 900, innerWidth: 1440, matchMedia: () => mq });
  });
  afterAll(() => { vi.unstubAllGlobals(); primeLessons(LESSONS); });

  it("loads a lesson module by id and caches it", async () => {
    clearLessons();
    const l = await loadLesson("stack");
    expect(l.id).toBe("stack");
    expect(peekLesson("stack")).toBe(l);
    primeLessons(LESSONS);
  });

  it("has a loader for every lesson in the registry, keyed by its folder", async () => {
    clearLessons();
    try {
      for (const m of LESSON_META) await expect(loadLesson(m.id)).resolves.toMatchObject({ id: m.id });
    } finally { primeLessons(LESSONS); }
  });

  it("keeps the page frame while a lesson's chunk is still loading", () => {
    clearLessons();
    setLoadersForTest({ stack: () => new Promise(() => {}) });
    try {
      const html = renderAt("/stack/1", () => {});
      expect(html).toContain('aria-busy="true"');
      expect(html).toContain("DSA");
      expect(html).toContain('aria-label="Course"');
      expect(html).toContain('class="page');
    } finally { setLoadersForTest(); primeLessons(LESSONS); }
  });

  it("rejects an unknown id", async () => {
    await expect(loadLesson("nope")).rejects.toThrow("No lesson called nope");
  });

  it("rejects with the loader's error, then retries on the next call", async () => {
    clearLessons();
    const stack = LESSONS.find((l) => l.id === "stack")!;
    let calls = 0;
    const loader = vi.fn(async () => { calls++; if (calls === 1) throw new Error("chunk failed"); return { default: stack }; });
    setLoadersForTest({ stack: loader });
    try {
      await expect(loadLesson("stack")).rejects.toThrow("chunk failed");
      expect(peekLesson("stack")).toBeUndefined();
      await expect(loadLesson("stack")).resolves.toBe(stack);
      expect(loader).toHaveBeenCalledTimes(2);
    } finally {
      setLoadersForTest();
      primeLessons(LESSONS);
    }
  });

  it("renders a loading state on a cold deep link and reports no progress", () => {
    clearLessons();
    const onVisit = vi.fn();
    const html = renderAt("/bst/7", onVisit);
    primeLessons(LESSONS);
    expect(html).toContain('aria-busy="true"');
    expect(onVisit).not.toHaveBeenCalled();
  });

  it("renders the asked step once the lesson is cached", () => {
    primeLessons(LESSONS);
    expect(renderAt("/bst/7", () => {})).toContain("Step 7 of");
  });
});

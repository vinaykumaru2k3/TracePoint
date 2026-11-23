import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "../app/App";
import { LESSONS } from ".";
import { clearLessons, loadLesson, peekLesson, primeLessons } from "./load";

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

  it("rejects an unknown id", async () => {
    await expect(loadLesson("nope")).rejects.toThrow("No lesson called nope");
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

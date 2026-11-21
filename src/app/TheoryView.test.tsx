import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { makeKeyHandler } from "../hooks/useKeyboard";
import { LESSON_BY_ID } from "../lessons";
import { AppRoutes } from "./App";
import CourseSidebar from "./CourseSidebar";
import TheoryView, { LessonTabs } from "./TheoryView";

const at = (path: string) => renderToStaticMarkup(
  <MemoryRouter initialEntries={[path]}><AppRoutes progress={{}} onVisit={() => {}} courseOpen={false} onCloseCourse={() => {}} /></MemoryRouter>);

describe("TheoryView", () => {
  const lesson = LESSON_BY_ID["arrays"];
  const html = renderToStaticMarkup(<MemoryRouter><TheoryView lesson={lesson} search="" /></MemoryRouter>);

  it("renders the parts in spec order (Operations only when the lesson has them)", () => {
    const h2 = [...html.matchAll(/<h2[^>]*>(.*?)<\/h2>/g)].map((m) => m[1]);
    expect(h2).toEqual(["Definition", "Analogy", "How it works", "Operations", "At a glance", "Use it when", "Avoid it when", "Worked example", "Pitfalls"]);
  });
  it("renders How it works as an ordered list", () => {
    expect(html).toMatch(/id="steps-h">How it works<\/h2><ol/);
  });
  it("puts every cost in the At a glance table", () => {
    const table = html.slice(html.indexOf("At a glance"), html.indexOf("Use it when"));
    expect(table).toContain("<table");
    for (const [name, cost] of lesson.costs) { expect(table).toContain(name); expect(table).toContain(cost); }
  });
  it("ends with a primary Watch it run link to step 1, keeping the search", () => {
    const h = renderToStaticMarkup(<MemoryRouter><TheoryView lesson={lesson} search="?in=1%202" /></MemoryRouter>);
    expect(h).toMatch(/<a[^>]*class="btn primary[^"]*"[^>]*href="\/arrays\/1\?in=1%202"/);
    expect(h).toContain("Watch it run");
  });
});

describe("LessonTabs", () => {
  it("links the tabs and keeps the search", () => {
    const h = renderToStaticMarkup(<MemoryRouter><LessonTabs id="stack" view="theory" search="?in=1%202" /></MemoryRouter>);
    expect(h).toContain('aria-label="Lesson view"');
    expect(h).toContain('href="/stack/learn?in=1%202"');
    expect(h).toContain('href="/stack/1?in=1%202"');
    expect(h.match(/aria-current="page"/g)?.length).toBe(1);
    expect(h).toMatch(/aria-current="page"[^>]*>theory|href="\/stack\/learn[^"]*"[^>]*aria-current="page"/);
  });
});

describe("theory route", () => {
  const html = at("/stack/learn");
  it("shows Watch it run and no timeline", () => {
    expect(html).toContain("Watch it run");
    expect(html).not.toContain("timeline");
    expect(html).not.toContain('class="rail');
  });
});

describe("explorer link", () => {
  const sidebar = (progress: Record<string, number>) => renderToStaticMarkup(
    <MemoryRouter><CourseSidebar currentId="" currentIdx={0} progress={progress} /></MemoryRouter>);
  it("opens theory for an unstarted lesson and the trace for a started one", () => {
    expect(sidebar({})).toMatch(/href="\/stack\/learn"/);
    expect(sidebar({ stack: 2 })).toMatch(/href="\/stack\/1"/);
    expect(sidebar({ stack: 2 })).not.toMatch(/href="\/stack\/learn"/);
  });
});

describe("makeKeyHandler", () => {
  const key = (k: string) => ({ key: k, preventDefault: () => {}, target: null }) as unknown as KeyboardEvent;
  const handlers = () => ({ prev: vi.fn(), next: vi.fn(), first: vi.fn(), last: vi.fn(), toggle: vi.fn(), reset: vi.fn() });
  it("does nothing when disabled", () => {
    const h = handlers();
    makeKeyHandler(h, false)(key("ArrowRight"));
    expect(h.next).not.toHaveBeenCalled();
  });
  it("steps when enabled", () => {
    const h = handlers();
    makeKeyHandler(h, true)(key("ArrowRight"));
    expect(h.next).toHaveBeenCalledTimes(1);
  });
});

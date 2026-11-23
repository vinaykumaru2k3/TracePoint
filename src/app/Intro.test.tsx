import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "./App";
import Intro from "./Intro";
import type { Progress } from "../hooks/useProgress";

const store = (data: Record<string, string>) => vi.stubGlobal("localStorage", { getItem: (k: string) => data[k] ?? null, setItem() {} });
const intro = (p: Progress = {}) => renderToStaticMarkup(<MemoryRouter><Intro progress={p} /></MemoryRouter>);
const at = (path: string, progress: Progress = {}) => renderToStaticMarkup(
  <MemoryRouter initialEntries={[path]}><AppRoutes progress={progress} onVisit={() => {}} courseOpen={false} onCloseCourse={() => {}} /></MemoryRouter>);

beforeAll(() => {
  const mq = { matches: false, addEventListener() {}, removeEventListener() {} };
  vi.stubGlobal("window", { innerHeight: 900, innerWidth: 1440, matchMedia: () => mq });
});
afterAll(() => { vi.unstubAllGlobals(); });
afterEach(() => { vi.stubGlobal("localStorage", undefined); });

describe("intro", () => {
  it("shows the heading, the way in and the first step for a new visitor", () => {
    store({});
    const html = intro();
    expect(html).toContain("Watch an algorithm run, one line at a time.");
    expect(html).toContain('href="/big-o-by-counting/1"');
    expect(html).toContain("Step 1 of 3");
    expect(html).toContain("Hide");
  });
  it("is quiet on mount", () => {
    store({});
    expect(intro()).toMatch(/aria-live="polite"[^>]*><\/p>/);
  });
  it("renders nothing once any lesson has progress", () => {
    store({});
    expect(intro({ stack: 2 })).toBe("");
  });
  it("renders nothing when hidden", () => {
    store({ "tracepoint-intro-hidden": "1" });
    expect(intro()).toBe("");
  });
  it("sits before the guide h1 on the home route only", () => {
    store({});
    const home = at("/");
    expect(home.indexOf("intro-h")).toBeGreaterThan(-1);
    expect(home.indexOf("intro-h")).toBeLessThan(home.indexOf("<h1"));
    expect(at("/guide/foundations")).not.toContain("intro-h");
    expect(at("/")).not.toContain('class="skip"');
  });
});

describe("trace tip", () => {
  it("shows on step 1 with both pointer strings", () => {
    store({});
    const html = at("/stack/1");
    expect(html).toContain('class="tip-fine"');
    expect(html).toContain('class="tip-coarse">Tap Next, or drag the timeline.');
    expect(html).toContain("Step with ");
    expect(html).toContain('aria-label="Dismiss tip"');
  });
  it("is hidden once seen", () => {
    store({ "tracepoint-tip-seen": "1" });
    expect(at("/stack/1")).not.toContain('aria-label="Dismiss tip"');
  });
  it("is hidden from step 3 on", () => {
    store({});
    expect(at("/stack/3")).not.toContain('aria-label="Dismiss tip"');
  });
});

describe("one primary way in", () => {
  const hero = (html: string) => html.match(/<a class="([^"]*)" href="\/big-o-by-counting\/learn"/)![1];
  it("demotes the hero button while the intro shows", () => {
    store({});
    expect(hero(at("/"))).toBe("btn");
  });
  it("keeps the hero primary once the intro is hidden", () => {
    store({ "tracepoint-intro-hidden": "1" });
    expect(hero(at("/"))).toBe("btn primary");
  });
});

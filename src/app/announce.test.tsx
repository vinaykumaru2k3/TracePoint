import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "./App";

const at = (path: string) => renderToStaticMarkup(
  <MemoryRouter initialEntries={[path]}><AppRoutes progress={{}} onVisit={() => {}} courseOpen={false} onCloseCourse={() => {}} /></MemoryRouter>);

describe("screen-reader step announcement", () => {
  beforeAll(() => {
    const mq = { matches: false, addEventListener() {}, removeEventListener() {} };
    vi.stubGlobal("window", { innerHeight: 900, innerWidth: 1440, matchMedia: () => mq });
  });
  afterAll(() => { vi.unstubAllGlobals(); });

  it("announces the step number, title and text in one live region", () => {
    const html = at("/stack/2");
    const live = html.match(/<p class="sr" aria-live="polite" aria-atomic="true">([^<]*)<\/p>/)?.[1] ?? "";
    expect(live).toMatch(/^Step 2 of \d+\. .+\. .+/);
    expect(html.match(/aria-live/g)?.length).toBe(1);
  });

  it("describes the diagram's state for the current step", () => {
    const html = at("/stack/3");
    expect(html).toContain('aria-describedby="scene-state"');
    const state = html.match(/<p class="sr" id="scene-state">([^<]*)<\/p>/)?.[1] ?? "";
    expect(state.length).toBeGreaterThan(10);
    expect(state).not.toBe(at("/stack/1").match(/<p class="sr" id="scene-state">([^<]*)<\/p>/)?.[1]);
  });

  it("lets the heading take focus on a page change", () => {
    expect(at("/stack/1")).toContain('<h1 tabindex="-1">');
    expect(at("/guide/graphs")).toContain('<h1 tabindex="-1">');
  });
});

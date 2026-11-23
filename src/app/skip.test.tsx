import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { AppRoutes, SkipLink } from "./App";
// @ts-expect-error node:fs has no types in the app tsconfig
import { readFileSync } from "node:fs";

const at = (path: string) => renderToStaticMarkup(<MemoryRouter initialEntries={[path]}><SkipLink /><AppRoutes progress={{}} onVisit={() => {}} courseOpen={false} onCloseCourse={() => {}} /></MemoryRouter>);
const FOCUSABLE = /<(a|button|input|select|textarea)\b[^>]*>/;

beforeAll(() => {
  const mq = { matches: false, addEventListener() {}, removeEventListener() {} };
  vi.stubGlobal("window", { innerHeight: 900, innerWidth: 1440, matchMedia: () => mq });
  vi.stubGlobal("localStorage", { getItem: () => null, setItem() {} });
});
afterAll(() => { vi.unstubAllGlobals(); });

describe("skip link", () => {
  it("is the first child of the app shell", () => {
    const src: string = readFileSync("src/app/App.tsx", "utf8");
    expect(src).toMatch(/<div className="app">\s*<SkipLink \/>\s*<TopNav/);
  });
  it("is the first focusable element on a lesson route", () => {
    const html = at("/stack/3");
    expect(html.match(FOCUSABLE)![0]).toBe('<a class="skip" href="#step-controls">');
    expect(html).toContain("Skip to step controls</a>");
  });
  it("on step 1 the first enabled button in the controls is Next, not the disabled Back", () => {
    const html = at("/stack/1");
    const nav = html.match(/<div[^>]*id="step-controls"[^>]*>.*?<\/div>/)![0];
    expect(nav.match(/<button[^>]*>/)![0]).toContain("disabled");
    const enabled = [...nav.matchAll(/<button([^>]*)>/g)].filter((m) => !/disabled/.test(m[1]));
    expect(enabled).toHaveLength(1);
    expect(enabled[0][1]).toContain("primary");
  });
  it("focuses an enabled button, so it works when Back is disabled", () => {
    const src: string = readFileSync("src/app/App.tsx", "utf8");
    expect(src).toContain('querySelector<HTMLButtonElement>("button:not(:disabled)")');
  });
  it("is absent on guide and theory routes", () => {
    expect(at("/")).not.toContain('class="skip"');
    expect(at("/guide/trees")).not.toContain('class="skip"');
    expect(at("/stack/learn")).not.toContain('class="skip"');
  });
  it("has exactly one id=step-controls on the trace page", () => {
    expect(at("/stack/3").match(/id="step-controls"/g)).toHaveLength(1);
  });
});

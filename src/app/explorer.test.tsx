import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
// @ts-expect-error the project has no node typings; vitest runs in node
import { readFileSync } from "node:fs";
import { MemoryRouter } from "react-router-dom";
import { DEFAULT_EXPLORER, parseExplorer, type ExplorerPrefs } from "../hooks/useExplorer";
import { AppRoutes } from "./App";
import SideCol from "./SideCol";

const at = (path: string, explorer?: ExplorerPrefs) => renderToStaticMarkup(
  <MemoryRouter initialEntries={[path]}><AppRoutes progress={{}} onVisit={() => {}} courseOpen={false} onCloseCourse={() => {}} explorer={explorer} /></MemoryRouter>);
const pageClass = (html: string) => html.match(/<div class="(page[^"]*)"/)?.[1];
const toggle = (html: string) => html.match(/<button class="icon-btn side-toggle"[^>]*>/)?.[0] ?? "";

describe("explorer fold", () => {
  /* The trace view reads the window size while rendering; give it a wide desktop one. */
  beforeAll(() => {
    const mq = { matches: false, addEventListener() {}, removeEventListener() {} };
    vi.stubGlobal("window", { innerHeight: 900, innerWidth: 1440, matchMedia: () => mq });
  });
  afterAll(() => { vi.unstubAllGlobals(); });
  it("starts folded on a trace, so the stage gets the width", () => {
    const html = at("/arrays/1");
    expect(pageClass(html)).toBe("page side-shut");
    expect(html).toContain('class="side-col shut"');
    expect(toggle(html)).toContain('aria-expanded="false"');
    expect(toggle(html)).toContain('aria-controls="explorer"');
    expect(toggle(html)).toContain('title="Show explorer"');
    expect(at("/arrays")).toContain('class="page side-shut"');
  });
  it("stays open on guides and theory tabs", () => {
    for (const path of ["/", "/guide/linear", "/arrays/learn"]) {
      const html = at(path);
      expect(pageClass(html), path).toBe("page");
      expect(toggle(html), path).toContain('aria-expanded="true"');
    }
  });
  it("follows the stored choice for each kind of page", () => {
    expect(pageClass(at("/arrays/1", { trace: true, read: true }))).toBe("page");
    expect(pageClass(at("/guide/linear", { trace: false, read: false }))).toBe("page side-shut");
    expect(pageClass(at("/arrays/learn", { trace: true, read: false }))).toBe("page side-shut");
  });
  it("keeps the tree mounted and names it as the toggle's target", () => {
    const html = renderToStaticMarkup(<SideCol open={false} onToggle={() => {}}><nav className="side">tree</nav></SideCol>);
    expect(html).toContain('<div class="side-body" id="explorer"><nav class="side">tree</nav></div>');
  });
});

describe("parseExplorer", () => {
  it("defaults to folded on traces and open elsewhere", () => {
    expect(DEFAULT_EXPLORER).toEqual({ trace: false, read: true });
    expect(parseExplorer(null)).toEqual(DEFAULT_EXPLORER);
  });
  it("reads a stored choice and ignores junk", () => {
    expect(parseExplorer('{"trace":true,"read":false}')).toEqual({ trace: true, read: false });
    expect(parseExplorer('{"trace":"yes"}')).toEqual(DEFAULT_EXPLORER);
    expect(parseExplorer("not json")).toEqual(DEFAULT_EXPLORER);
    expect(parseExplorer("null")).toEqual(DEFAULT_EXPLORER);
  });
});

describe("explorer fold css", () => {
  const css: string = readFileSync("src/app.css", "utf8");
  it("narrows the first column to a strip and animates the width", () => {
    expect(css).toMatch(/\.page\.side-shut\s*\{[^}]*--side-w:\s*44px/);
    expect(css).toMatch(/\.page\s*\{[^}]*grid-template-columns:\s*var\(--side-w\)[^}]*transition:\s*grid-template-columns/);
    expect(css).toMatch(/\.side-col\.shut \.side-body\s*\{[^}]*visibility:\s*hidden/);
  });
  it("drops the animation under reduced motion", () => {
    const rm = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(rm.slice(0, rm.indexOf("\n}"))).toMatch(/\.page, \.side-body, \.side-col\.shut \.side-body \{ transition: none; \}/);
  });
});

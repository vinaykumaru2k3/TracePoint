import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
// @ts-expect-error the project has no node typings; vitest runs in node
import { readFileSync } from "node:fs";
import SearchDialog, { countText } from "./SearchDialog";

const css: string = readFileSync("src/app.css", "utf8");
const html = renderToStaticMarkup(<MemoryRouter><SearchDialog open onClose={() => {}} /></MemoryRouter>);

describe("search combobox", () => {
  it("wires the input to a listbox of options", () => {
    expect(html).toMatch(/role="combobox"/);
    expect(html).toMatch(/aria-controls="search-list"/);
    expect(html).toMatch(/aria-autocomplete="list"/);
    expect(html).toMatch(/aria-expanded="true"/);
    expect(html).toMatch(/aria-activedescendant="search-opt-0"/);
    expect(html).toMatch(/<ul id="search-list" role="listbox" aria-label="Results"/);
    expect(html).toMatch(/<li id="search-opt-0" role="option" aria-selected="true"/);
  });
  it("has no buttons with aria-selected and a result-count status", () => {
    expect(html).not.toMatch(/<button[^>]*aria-selected/);
    expect(html).toMatch(/<p role="status" class="sr">\d+ results?<\/p>/);
  });
});

describe("search combobox with no results", () => {
  const empty = renderToStaticMarkup(<MemoryRouter><SearchDialog open onClose={() => {}} initialQuery="zzzzqq" /></MemoryRouter>);
  it("collapses and points at nothing", () => {
    expect(empty).toContain('aria-expanded="false"');
    expect(empty).not.toContain("aria-activedescendant");
    expect(empty).not.toContain("aria-controls");
    expect(empty).not.toContain('id="search-list"');
    expect(empty).toContain("Nothing matches");
  });
});

describe("encoding and copy", () => {
  it("keeps the placeholder and the soon label as real UTF-8", () => {
    expect(html).toContain("placeholder=\"Search lessons…\"");
    const src: string = readFileSync("src/app/SearchDialog.tsx", "utf8");
    expect(src).toContain("\" · soon\"");
    for (const f of ["src/app/SearchDialog.tsx", "src/app.css", "src/app/SearchDialog.test.tsx"])
      expect(readFileSync(f, "utf8")).not.toContain(String.fromCharCode(0xfffd));
  });
  it("says 1 result in the singular", () => {
    expect(countText(1)).toBe("1 result");
    expect(countText(0)).toBe("No results");
    expect(countText(5)).toBe("5 results");
  });
});

describe("touch targets", () => {
  it("enforces 44px on coarse pointers with logical properties", () => {
    expect(css).toMatch(/@media \(pointer: coarse\)[^}]*min-block-size: 44px/);
    expect(css).toMatch(/@media \(pointer: coarse\)[^}]*min-inline-size: 44px/);
    expect(css).toMatch(/@media \(pointer: coarse\)[^}]*\.btn\.sm[^}]*min-block-size: 44px/);
    expect(css).toMatch(/\.search-btn \{ min-block-size: 44px; \}/);
  });
});

import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
// @ts-expect-error the project has no node typings; vitest runs in node
import { readFileSync } from "node:fs";
import SearchDialog from "./SearchDialog";

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
    expect(html).toMatch(/<p role="status" class="sr">\d+ results<\/p>/);
  });
});

describe("touch targets", () => {
  it("enforces 44px on coarse pointers with logical properties", () => {
    expect(css).toMatch(/@media \(pointer: coarse\)[^}]*min-block-size: 44px/);
    expect(css).toMatch(/@media \(pointer: coarse\)[^}]*min-inline-size: 44px/);
  });
});

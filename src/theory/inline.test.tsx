import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { linkTargets, parseInline, Rich } from "./inline";

describe("parseInline", () => {
  it("splits code and bold", () => {
    expect(parseInline("a `x` and **b**")).toEqual([
      { t: "text", v: "a " }, { t: "code", v: "x" }, { t: "text", v: " and " }, { t: "bold", v: "b" }]);
  });
  it("parses links with and without labels", () => {
    expect(parseInline("see [[stack]] or [[guide:hashing|the guide]]")).toEqual([
      { t: "text", v: "see " }, { t: "link", target: "stack", label: "" }, { t: "text", v: " or " },
      { t: "link", target: "guide:hashing", label: "the guide" }]);
  });
  it("treats an unclosed marker as text", () => {
    expect(parseInline("a `b")).toEqual([{ t: "text", v: "a `b" }]);
  });
  it("lists link targets", () => {
    expect(linkTargets("[[stack]] [[guide:linear]]")).toEqual(["stack", "guide:linear"]);
  });
  it("renders a lesson link", () => {
    const html = renderToStaticMarkup(<MemoryRouter><Rich text="[[stack]]" /></MemoryRouter>);
    expect(html).toContain('href="/stack/learn"');
    expect(html).toContain("Stack");
  });
  it("renders a guide link with a default label", () => {
    const html = renderToStaticMarkup(<MemoryRouter><Rich text="[[guide:hashing]] `c` **b**" /></MemoryRouter>);
    expect(html).toContain('href="/guide/hashing"');
    expect(html).toContain("Hashing guide");
    expect(html).toContain("<code>c</code>");
    expect(html).toContain("<strong>b</strong>");
  });
});

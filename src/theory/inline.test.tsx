import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { leadSplit, linkTargets, parseInline, Rich } from "./inline";

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
  it("parses a struck wrong form that holds code", () => {
    expect(parseInline("use ~~`<`~~ not")).toEqual([
      { t: "text", v: "use " }, { t: "strike", v: "`<`" }, { t: "text", v: " not" }]);
  });
  it("renders a struck wrong form with its code", () => {
    const html = renderToStaticMarkup(<MemoryRouter><Rich text="~~`lo = mid`~~" /></MemoryRouter>);
    expect(html).toContain('<s class="wrong"><code>lo = mid</code></s>');
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

describe("leadSplit", () => {
  it("splits after the first sentence", () => {
    expect(leadSplit("Off by one. The loop never ends.")).toEqual(["Off by one.", "The loop never ends."]);
  });
  it("never splits inside code", () => {
    expect(leadSplit("Writing `a. b` wrong. Then more.")).toEqual(["Writing `a. b` wrong.", "Then more."]);
  });
  it("keeps a single sentence whole", () => {
    expect(leadSplit("Only one sentence.")).toEqual(["Only one sentence.", ""]);
  });
});

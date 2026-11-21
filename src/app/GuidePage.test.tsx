import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { CURRICULUM } from "../curriculum";
import { GUIDES } from "../theory";
import { AppRoutes } from "./App";
import CourseSidebar from "./CourseSidebar";
import { GuideView, resolveGuide } from "./GuidePage";
import { SEARCH_ITEMS } from "./SearchDialog";

const at = (path: string) => renderToStaticMarkup(
  <MemoryRouter initialEntries={[path]}><AppRoutes progress={{}} onVisit={() => {}} courseOpen={false} onCloseCourse={() => {}} /></MemoryRouter>);

describe("GuideView", () => {
  const html = renderToStaticMarkup(<MemoryRouter><GuideView guide={GUIDES.foundations} /></MemoryRouter>);
  it("renders the parts in spec order", () => {
    const h2 = [...html.matchAll(/<h2[^>]*>(.*?)<\/h2>/g)].map((m) => m[1]);
    expect(h2).toEqual(["Core idea", "Analogy", "Before you start", "Key terms", "Cheat sheet", "When you see…", "Tips and traps", "Case studies", "Lessons here"]);
  });
  it("puts the cheat sheet in a scrolling table wrapper", () => {
    expect(html).toMatch(/class="table-wrap"[^>]*><table/);
  });
  it("links live lessons to their theory tab and marks soon lessons", () => {
    expect(html).toContain('href="/arrays/learn"');
    /* A section whose lessons are not built yet lists them as plain text with a soon tag. */
    const soon = renderToStaticMarkup(<MemoryRouter><GuideView guide={{ ...GUIDES.foundations, section: "trees" }} /></MemoryRouter>);
    expect(soon).toContain('class="soon-tag">soon</small>');
    expect(soon).not.toContain("/learn\">Binary tree");
  });
});

describe("guide routes", () => {
  it("sends an unknown section home", () => {
    expect(resolveGuide("nope")).toBe("redirect");
    expect(at("/guide/nope")).not.toContain("arrives with its lessons");
  });
  it("says a section without a guide arrives with its lessons", () => {
    expect(resolveGuide("trees")).toBe("missing");
    const html = at("/guide/trees");
    expect(html).toContain("arrives with its lessons");
    expect(html).toContain('href="/guide/foundations"');
  });
  it("opens the Foundations guide at the root", () => {
    expect(at("/")).toMatch(/<h1[^>]*>Foundations<\/h1>/);
    expect(at("/guide/foundations")).toMatch(/<h1[^>]*>Foundations<\/h1>/);
  });
});

describe("explorer", () => {
  it("starts each folder with a README.md entry", () => {
    const html = renderToStaticMarkup(<MemoryRouter><CourseSidebar currentId="stack" currentIdx={0} progress={{}} /></MemoryRouter>);
    for (const sec of CURRICULUM) {
      const i = html.indexOf(`href="/guide/${sec.id}"`);
      expect(i, sec.id).toBeGreaterThan(-1);
      expect(html.slice(i, i + 400)).toContain("README.md");
      expect(html.lastIndexOf("<ul>", i)).toBeGreaterThan(html.lastIndexOf("</ul>", i));
    }
  });
  it("marks the open guide as current", () => {
    const html = renderToStaticMarkup(<MemoryRouter><CourseSidebar currentId="" currentIdx={0} progress={{}} guideId="foundations" /></MemoryRouter>);
    expect(html).toMatch(/class="lnk live on"[^>]*aria-current="page"[^>]*>(?:(?!<\/a>).)*README\.md/);
  });
});

describe("search", () => {
  it("lists guides and keeps lesson links", () => {
    expect(SEARCH_ITEMS).toContainEqual({ name: "Foundations guide", section: "Foundations", to: "/guide/foundations" });
    expect(SEARCH_ITEMS.some((i) => i.to === "/stack/1")).toBe(true);
  });
});

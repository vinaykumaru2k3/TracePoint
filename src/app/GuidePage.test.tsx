import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
// @ts-expect-error the project has no node typings; vitest runs in node
import { readFileSync } from "node:fs";
import { MemoryRouter } from "react-router-dom";
import { CURRICULUM } from "../curriculum";
import { GUIDES } from "../theory";
import { AppRoutes } from "./App";
import CourseSidebar from "./CourseSidebar";
import { GuideView, resolveGuide } from "./GuidePage";
import { SEARCH_ITEMS } from "./SearchDialog";

const at = (path: string) => renderToStaticMarkup(
  <MemoryRouter initialEntries={[path]}><AppRoutes progress={{}} onVisit={() => {}} courseOpen={false} onCloseCourse={() => {}} /></MemoryRouter>);

/** Every real section is live now, so a section "that has no lessons yet" is a synthetic one added to the curriculum for the length of `fn`. */
const NO_SECTION = "not-a-section";
function withUnbuiltSection<T>(fn: () => T): T {
  CURRICULUM.push({ id: NO_SECTION, n: "99", name: "Not a section", color: "var(--sec-01)", lessons: [{ id: "not-a-lesson", name: "Fibonacci" }] });
  try { return fn(); } finally { CURRICULUM.pop(); }
}

describe("GuideView", () => {
  const html = renderToStaticMarkup(<MemoryRouter><GuideView guide={GUIDES.foundations} /></MemoryRouter>);
  it("sets a cheat-sheet row name as a row header with its qualifier on its own line, and tints cost cells", () => {
    const sorting = renderToStaticMarkup(<MemoryRouter><GuideView guide={GUIDES.sorting} /></MemoryRouter>);
    expect(sorting).toContain('<th scope="row"><span class="cheat-name">Binary search</span><span class="cheat-qual">sorted input only</span></th>');
    expect(sorting).toMatch(/<td class="heat t-swap"><span class="cost"><span class="cost-v">O\(n²\)/);
  });
  it("renders the parts in spec order", () => {
    const h2 = [...html.matchAll(/<h2[^>]*>(.*?)<\/h2>/g)].map((m) => m[1]);
    expect(h2).toEqual(["Core idea", "Analogy", "Before you start", "Key terms", "Cheat sheet", "When you see…", "Tips and traps", "Case studies", "Lessons here"]);
  });
  it("draws the growth chart under the cheat sheet, inking the classes it names", () => {
    const cheat = html.slice(html.indexOf('id="cheat"'), html.indexOf('id="patterns"'));
    expect(cheat).toContain('class="growth"');
    expect(cheat).toContain('class="g-curve on"');
    expect(cheat).toContain('class="meter');
  });
  it("shows a still of each live lesson's scene in Lessons here", () => {
    const lessons = html.slice(html.indexOf('id="lessons"'));
    expect(lessons).toContain('class="glessons gallery"');
    expect(lessons.match(/class="thumb"/g)?.length).toBe(6);
  });
  it("puts the cheat sheet in a scrolling table wrapper", () => {
    expect(html).toMatch(/class="table-wrap"[^>]*><table/);
  });
  it("links live lessons to their theory tab and marks soon lessons", () => {
    expect(html).toContain('href="/arrays/learn"');
    /* A section whose lessons are not built yet lists them as plain text with a soon tag. */
    const soon = withUnbuiltSection(() => renderToStaticMarkup(<MemoryRouter><GuideView guide={{ ...GUIDES.foundations, section: NO_SECTION }} /></MemoryRouter>));
    expect(soon).toContain('class="soon-tag">soon</small>');
    expect(soon).not.toContain("/learn\">Fibonacci");
  });
});

describe("guide routes", () => {
  it("sends an unknown section home", () => {
    expect(resolveGuide("nope")).toBe("redirect");
    expect(at("/guide/nope")).not.toContain("arrives with its lessons");
  });
  it("says a section without a guide arrives with its lessons", () => {
    const html = withUnbuiltSection(() => {
      expect(resolveGuide(NO_SECTION)).toBe("missing");
      return at(`/guide/${NO_SECTION}`);
    });
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

const css: string = readFileSync("src/app.css", "utf8");

describe("guide crumb", () => {
  it("separates folder and file with a single slash", () => {
    const full = at("/guide/sorting");
    const html = full.slice(full.indexOf('class="crumb"'), full.indexOf("</h1>"));
    expect(html).toContain("05-sorting</span>");
    expect(html).not.toContain("05-sorting/</span>");
    expect(html).not.toMatch(/\/<\/span><span aria-hidden="true">\/<\/span>/);
  });
});

describe("guide css", () => {
  it("has no !important in guide rules and keeps list padding", () => {
    const guide = css.slice(css.indexOf("/* ---------- guide"));
    expect(guide).not.toContain("!important");
    expect(guide).toMatch(/\.guide-lessons \.glessons\.glessons \{[^}]*padding: 10px 14px/);
  });
  it("keeps the short-window rule off the guide head", () => {
    expect(css).toContain(".lesson-head:not(.guide-head) .sub");
    expect(css).not.toMatch(/\n\s*\.sub, \.memnote, \.crumb \{ display: none/);
  });
  it("makes the cheat table scroll in its wrapper", () => {
    expect(css).toMatch(/\.cheat \{[^}]*min-width: 34rem/);
    expect(css).toMatch(/\.table-wrap \{ overflow-x: auto/);
  });
  it("never breaks a cost class inside its chip, and tints chips by growth class", () => {
    expect(css).toMatch(/\.cheat td\.heat \.cost-v \{ min-width: 10\.5ch/);
    expect(css).toMatch(/\.cheat td\.t-swap \.cost \{ background: var\(--heat-swap\)/);
  });
});

describe("search css", () => {
  it("sizes the result section label at 11px", () => {
    expect(css).toMatch(/\.search li small \{[^}]*font-size: 11px/);
  });
});

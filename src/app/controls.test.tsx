import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "./App";
import TopNav from "./TopNav";
import { KIND_MEANING } from "../design/ui";
// @ts-expect-error node:fs has no types in the app tsconfig
import { readFileSync } from "node:fs";

const css: string = readFileSync("src/app.css", "utf8");
const at = (path: string) => renderToStaticMarkup(
  <MemoryRouter initialEntries={[path]}><AppRoutes progress={{}} onVisit={() => {}} courseOpen={false} onCloseCourse={() => {}} /></MemoryRouter>);
const btn = (html: string, cls: string) => {
  const m = html.match(new RegExp(`<button[^>]*class="(?:[^"]* )?${cls}(?: [^"]*)?"[^>]*>.*?</button>`));
  if (!m) throw new Error(`no .${cls} button`);
  return m[0];
};
const text = (h: string) => h.replace(/<[^>]+>/g, "");

beforeAll(() => {
  const mq = { matches: false, addEventListener() {}, removeEventListener() {} };
  vi.stubGlobal("window", { innerHeight: 900, innerWidth: 1440, matchMedia: () => mq });
  vi.stubGlobal("localStorage", { getItem: () => null, setItem() {} });
});
afterAll(() => { vi.unstubAllGlobals(); });

describe("controls say what they do", () => {
  it("labels the speed button", () => {
    expect(text(btn(at("/stack/1"), "speed"))).toBe("Speed 1×");
  });
  it("always renders Show all, disabled when nothing is cropped, with aria-pressed", () => {
    const b = btn(at("/stack/1"), "zoom");
    expect(b).toContain("disabled");
    expect(b).toContain("aria-pressed");
    expect(text(b)).toBe("Show all");
  });
  it("names the next step", () => {
    const html = at("/dijkstra/5");
    const next = text(btn(html, "primary"));
    expect(next).not.toBe("Next: dijkstra(A)");
    const stop = text(at("/dijkstra/6").match(/<span class="scrub-head"[^>]*><b>(.*?)<\/b>/)![1]).replace(/^\d+/, "");
    expect(next).toBe(`Next: ${stop}`);
  });
  it("keeps the phone step bar on plain Next", () => {
    const mq = { matches: true, addEventListener() {}, removeEventListener() {} };
    vi.stubGlobal("window", { innerHeight: 812, innerWidth: 375, matchMedia: () => mq });
    try {
      const bar = at("/dijkstra/5").match(/<nav class="stepbar".*?<\/nav>/)![0];
      expect(bar).toContain("<span>Next</span>");
    } finally {
      const dq = { matches: false, addEventListener() {}, removeEventListener() {} };
      vi.stubGlobal("window", { innerHeight: 900, innerWidth: 1440, matchMedia: () => dq });
    }
  });
  it("names the step in the phone step bar with the scrubber's rail name", () => {
    const html = at("/dijkstra/5");
    const rail = text(html.match(/<span class="scrub-head"[^>]*><b>(.*?)<\/b>/)![1]).replace(/^\d+/, "");
    const mq = { matches: true, addEventListener() {}, removeEventListener() {} };
    vi.stubGlobal("window", { innerHeight: 812, innerWidth: 375, matchMedia: () => mq });
    try {
      const bar = at("/dijkstra/5").match(/<nav class="stepbar".*?<\/nav>/)![0];
      expect(bar).toContain(`<b>${rail}</b>`);
      expect(bar).not.toContain("<b>dijkstra(A)</b>");
    } finally {
      const dq = { matches: false, addEventListener() {}, removeEventListener() {} };
      vi.stubGlobal("window", { innerHeight: 900, innerWidth: 1440, matchMedia: () => dq });
    }
  });
  it("gives every kind chip a title that says what the kind means", () => {
    const html = at("/stack/3");
    expect(html).toMatch(/<span class="chip"[^>]*title="[^"]{12,}"/);
  });
  it("pulses the Next button on step 1 only", () => {
    expect(at("/stack/1")).toMatch(/class="btn primary cue"/);
    expect(at("/stack/2")).not.toMatch(/class="btn primary cue"/);
  });
});

describe("stylesheet", () => {
  it("uses the 1120 and 680 breakpoints for the walk figure", () => {
    expect(css).not.toContain("max-width: 1119px");
    expect(css).not.toContain("max-height: 679px");
  });
  it("keeps the soon tags at 1120px and below", () => {
    const block = css.slice(css.indexOf("@media (max-width: 1120px), (max-height: 680px) {"));
    const end = block.indexOf("\n}\n");
    expect(block.slice(0, end)).not.toMatch(/\.tab small\s*\{\s*display:\s*none/);
  });
  it("keeps stage toolbar labels on one line in the 561-1120px band", () => {
    const from = css.indexOf("@media (min-width: 561px) and (max-width: 1120px) {");
    expect(from).toBeGreaterThan(-1);
    const block = css.slice(from, css.indexOf("\n}\n", from));
    expect(block).toMatch(/\.stage-top\s*\{[^}]*flex-wrap:\s*wrap/);
    expect(block).toMatch(/\.stage-ctl\s*\{[^}]*flex:\s*none/);
    expect(block).toMatch(/\.stage-ctl \.btn\s*\{[^}]*white-space:\s*nowrap/);
    expect(block).not.toContain("!important");
    expect(css).toMatch(/\.stage-ctl \.btn\.speed\s*\{[^}]*min-inline-size:\s*96px/);
  });
  it("hides the soon tabs at 560px and below", () => {
    const from = css.indexOf("@media (max-width: 560px) {");
    expect(from).toBeGreaterThan(-1);
    const end = css.indexOf("\n}\n", from);
    expect(css.slice(from, end)).toMatch(/\.tabs \.soon\s*\{\s*display:\s*none/);
  });
  it("reserves the widest speed label at every breakpoint so the toolbar does not reflow", () => {
    /* "Speed 0.5×" is 10 characters of 0.6em mono at --fs-chrome (12px), plus inline padding and a 1px border each side. */
    const text = 10 * 0.6 * 12;
    const reserve = (src: string) => Number(src.match(/\.stage-ctl \.btn\.speed\s*\{[^}]*min-inline-size:\s*(\d+)px/)![1]);
    const desktop = reserve(css);
    expect(desktop).toBeGreaterThanOrEqual(text + 2 * 10 + 2);
    const from = css.indexOf("@media (max-width: 560px) {");
    const phone = reserve(css.slice(from, css.indexOf("\n}\n", from)));
    expect(phone).toBeGreaterThanOrEqual(text + 2 * 8 + 2);
  });
  it("offers a way back to the running input only when the box differs from it", () => {
    expect(at("/stack/1?in=zzz")).toContain("Back to the running input");
    expect(at("/stack/1")).not.toContain("Back to the running input");
  });
  it("puts Show tips again in the help popover", () => {
    const nav = renderToStaticMarkup(<MemoryRouter><TopNav dark={false} onTheme={() => {}} onSearch={() => {}} courseOpen={false} onCourse={() => {}} /></MemoryRouter>);
    const help = nav.match(/id="help"[^>]*>.*?<\/div>/)![0];
    expect(help).toMatch(/<button[^>]*type="button"[^>]*>Show tips again<\/button>/);
  });
  it("labels Play the same on every step but the last", () => {
    for (const p of ["/stack/1", "/stack/2"]) {
      const h = at(p);
      expect(h).toMatch(/<button[^>]*>(?:<[^>]+>)*Play(?:<[^>]+>)*<\/button>/);
      expect(h).not.toContain("Play all");
    }
  });
  it("marks Run aria-disabled for an unparseable input, never with disabled", () => {
    const bad = at("/stack/1?in=zzz").match(/<button[^>]*type="submit"[^>]*>Run<\/button>/)![0];
    expect(bad).toContain('aria-disabled="true"');
    expect(bad).not.toMatch(/\sdisabled/);
    const good = at("/stack/1?in=push%205").match(/<button[^>]*type="submit"[^>]*>Run<\/button>/)![0];
    expect(good).not.toContain("aria-disabled");
  });
  it("lists the step kinds in the help popover", () => {
    const nav = renderToStaticMarkup(<MemoryRouter><TopNav dark={false} onTheme={() => {}} onSearch={() => {}} courseOpen={false} onCourse={() => {}} /></MemoryRouter>);
    const help = nav.match(/id="help"[^>]*>.*<\/div>/)![0];
    expect(help).toMatch(/<h3>Step kinds<\/h3>/);
    const kinds = help.slice(help.indexOf("Step kinds"));
    expect((kinds.match(/<dd>/g) ?? []).length).toBe(Object.keys(KIND_MEANING).length);
    expect(kinds.indexOf("Show tips again")).toBeGreaterThan(kinds.lastIndexOf("</dl>"));
  });
  it("shows the stepbar theory link only on phones", () => {
    expect(css).toMatch(/\.stepbar \.to-theory\s*\{[^}]*display:\s*none/);
    const phone = css.slice(css.indexOf("@media (max-width: 560px)"));
    expect(phone).toMatch(/\.stepbar \.to-theory\s*\{[^}]*display:\s*inline-flex/);
  });
});

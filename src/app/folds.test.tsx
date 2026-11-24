// @ts-expect-error node:fs has no types in the app tsconfig
import { readFileSync } from "node:fs";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "./App";
import RunForm from "./RunForm";
import { MemoryStrip } from "./LessonParts";
import { peekLesson } from "../lessons/load";

const lesson = () => peekLesson("dijkstra")!;
const store = (data: Record<string, string>) => vi.stubGlobal("localStorage", { getItem: (k: string) => data[k] ?? null, setItem() {} });
const form = (p: { linkError?: string; custom?: boolean } = {}) => {
  const l = lesson();
  return renderToStaticMarkup(<RunForm lesson={l} text={l.defaultText} linkError={p.linkError ?? ""} custom={p.custom} onRun={() => {}} />);
};
const at = (path: string) => renderToStaticMarkup(
  <MemoryRouter initialEntries={[path]}><AppRoutes progress={{}} onVisit={() => {}} courseOpen={false} onCloseCourse={() => {}} /></MemoryRouter>);

beforeAll(() => {
  const mq = { matches: false, addEventListener() {}, removeEventListener() {} };
  vi.stubGlobal("window", { innerHeight: 900, innerWidth: 1440, matchMedia: () => mq });
});
afterAll(() => { vi.unstubAllGlobals(); });
afterEach(() => { vi.stubGlobal("localStorage", undefined); });

describe("run form fold", () => {
  it("is folded with no stored choice", () => {
    store({});
    const html = form();
    expect(html).toContain('<details class="run-fold">');
    expect(html).toContain('<form class="run"');
  });
  it("opens for a link error, which is announced", () => {
    store({ "tracepoint-run-open": "0" });
    const html = form({ linkError: "Bad input" });
    expect(html).toContain('<details class="run-fold" open="">');
    expect(html).toContain('role="alert"');
  });
  it("opens for a custom run", () => {
    store({ "tracepoint-run-open": "0" });
    expect(form({ custom: true })).toContain('<details class="run-fold" open="">');
  });
  it("opens when the learner left it open", () => {
    store({ "tracepoint-run-open": "1" });
    expect(form()).toContain('<details class="run-fold" open="">');
  });
  it("names itself and the input in the summary", () => {
    store({});
    const sum = form().match(/<summary[^>]*>(.*?)<\/summary>/)![1].replace(/<[^>]+>/g, "");
    expect(sum).toBe("Try your own input · Weighted edges");
  });
});

describe("memory strip fold", () => {
  const strip = () => {
    const l = lesson();
    return renderToStaticMarkup(<MemoryStrip lesson={l} step={l.generate((l.parse(l.defaultText) as { ok: true; input: never }).input)[2]} />);
  };
  it("is folded with no stored choice, content kept in the DOM", () => {
    store({});
    const html = strip();
    expect(html).toContain('<details class="mem">');
    expect(html).toContain('class="cell');
  });
  it("opens with a stored 1", () => {
    store({ "tracepoint-memory": "1" });
    expect(strip()).toContain('<details class="mem" open="">');
  });
  it("treats an old stored 0 as folded", () => {
    store({ "tracepoint-memory": "0" });
    expect(strip()).not.toContain("open=");
  });
});

describe("key legend", () => {
  it("shows until the learner has stepped with a key", () => {
    store({});
    expect(at("/stack/3")).toContain('class="keys"');
  });
  it("is gone once seen, and a one-line hint to the How to use popover takes its place", () => {
    store({ "tracepoint-keys-seen": "1" });
    const html = at("/stack/3");
    expect(html).not.toContain('class="keys"');
    expect(html).toContain('class="keys-hint"');
    expect(html).toMatch(/Keys: [^<]*\?/);
  });
  it("shows no hint while the legend shows", () => {
    store({});
    expect(at("/stack/3")).not.toContain('class="keys-hint"');
  });
  it("keeps each key and its label together as one pair", () => {
    store({});
    expect(at("/stack/3")).toMatch(/<span class="kp"><kbd class="kbd">←<\/kbd><kbd class="kbd">→<\/kbd> step<\/span>/);
  });
});

describe("quiet metrics line", () => {
  it("separates metric items with a hidden dot, none before the first", () => {
    store({});
    const html = at("/stack/2");
    const row = html.match(/<div class="metrics"[^>]*>(.*?)<\/div>/)![1];
    expect(row).toContain('<span class="sep" aria-hidden="true">·</span>');
    expect(row.startsWith('<span class="sep"')).toBe(false);
    expect(row.split('class="sep"').length - 1).toBe(row.split('class="metric"').length - 2);
  });
  it("titles the memory summary with memtitle, not lbl", () => {
    store({});
    const html = at("/stack/2");
    const sum = html.match(/<summary class="memhead">(.*?)<\/summary>/)![1];
    expect(sum).toContain('<span class="memtitle">');
    expect(sum).not.toContain('class="lbl"');
  });
  it("keeps text-transform out of the metric rules", () => {
    const css = readFileSync("src/app.css", "utf8");
    const rules = [...css.matchAll(/([^{}]*\.metrics?\b[^{}]*)\{([^}]*)\}/g)];
    expect(rules.length).toBeGreaterThan(0);
    for (const [, , body] of rules) expect(body).not.toMatch(/text-transform|letter-spacing/);
  });
});

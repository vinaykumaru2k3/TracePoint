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
  it("is gone once seen", () => {
    store({ "tracepoint-keys-seen": "1" });
    expect(at("/stack/3")).not.toContain('class="keys"');
  });
});

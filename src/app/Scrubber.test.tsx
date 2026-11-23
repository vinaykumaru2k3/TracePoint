import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "./App";
import { makeKeyHandler, type Keys } from "../hooks/useKeyboard";
import SceneFit from "../iso/SceneFit";
import { scrubKey } from "./Scrubber";

const at = (path: string) => renderToStaticMarkup(
  <MemoryRouter initialEntries={[path]}><AppRoutes progress={{}} onVisit={() => {}} courseOpen={false} onCloseCourse={() => {}} /></MemoryRouter>);

describe("scrubKey", () => {
  it("maps keys to a clamped step", () => {
    expect(scrubKey("PageDown", 0, 32)).toBe(3);
    expect(scrubKey("PageUp", 2, 32)).toBe(0);
    expect(scrubKey("PageDown", 10, 11)).toBe(11);
    expect(scrubKey("End", 0, 32)).toBe(32);
    expect(scrubKey("Home", 9, 32)).toBe(0);
    expect(scrubKey("ArrowLeft", 0, 5)).toBe(0);
    expect(scrubKey("ArrowUp", 3, 5)).toBe(2);
    expect(scrubKey("ArrowDown", 3, 5)).toBe(4);
    expect(scrubKey("ArrowRight", 5, 5)).toBe(5);
    expect(scrubKey("a", 3, 5)).toBeNull();
  });
});

describe("render cost", () => {
  it("SceneFit is memoised", () => {
    expect((SceneFit as unknown as { $$typeof: symbol }).$$typeof).toBe(Symbol.for("react.memo"));
  });
});

describe("the global key handler and the slider", () => {
  it("leaves a key the slider already handled", () => {
    const calls: string[] = [];
    const k: Keys = { prev: () => calls.push("prev"), next: () => calls.push("next"), first() {}, last() {}, toggle() {}, reset() {} };
    makeKeyHandler(k, true)({ key: "ArrowRight", defaultPrevented: true } as KeyboardEvent);
    expect(calls).toEqual([]);
  });
});

describe("the scrubber markup", () => {
  beforeAll(() => {
    const mq = { matches: false, addEventListener() {}, removeEventListener() {} };
    vi.stubGlobal("window", { innerHeight: 900, innerWidth: 1440, matchMedia: () => mq });
  });
  afterAll(() => { vi.unstubAllGlobals(); });

  it("still renders the slider for the current step", () => {
    const html = at("/stack/3");
    expect(html).toContain('role="slider"');
    expect(html).toContain('aria-valuenow="3"');
    const m = html.match(/aria-valuetext="(Step 3 of \d+: [^"]+)"/);
    expect(m).not.toBeNull();
    expect(html).toContain('class="scrub"');
    expect(html).toContain("Timeline");
  });
});

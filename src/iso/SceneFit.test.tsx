import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import IsoScene, { CropCues, ZoomContext, cropEdges, cueSpots, hideOffstage, sceneScale } from "./IsoScene";
import { roomFor } from "./camera";
import SceneFit, { fitScenes, pickFocus } from "./SceneFit";

describe("SceneFit", () => {
  it("fitScenes keeps the steps until measured, then none", () => {
    const steps = [1, 2, 3];
    expect(fitScenes(steps, false)).toBe(steps);
    expect(fitScenes(steps, true)).toEqual([]);
  });
  it("first render draws one svg.iso per step", () => {
    const Scene = ({ step }: { step: number }) => <svg className="iso"><text>{step}</text></svg>;
    const html = renderToStaticMarkup(<SceneFit steps={[1, 2, 3]} Scene={Scene} onFit={() => {}} />);
    expect(html.match(/<svg class="iso"/g)).toHaveLength(3);
  });
  it("IsoScene exposes --px on the lesson stage (a lens), 1 on the server", () => {
    const html = renderToStaticMarkup(
      <ZoomContext.Provider value={{ lens: { floor: 0.85, read: 1 } }}><IsoScene viewBox="0 0 100 100" label="x">{null}</IsoScene></ZoomContext.Provider>);
    expect(html).toMatch(/<svg[^>]*style="[^"]*--px:1/);
  });
  it("IsoScene sets no --px without a lens, so walkthroughs and thumbnails stay small overviews", () => {
    const html = renderToStaticMarkup(<IsoScene viewBox="0 0 100 100" label="x">{null}</IsoScene>);
    expect(html).toMatch(/<svg class="iso"/);
    expect(html).not.toContain("--px");
  });
  it("pickFocus: a core with every lit element in the strip is empty, never the found cells", () => {
    const inStrip = (el: { strip: boolean }) => el.strip;
    const tile = { strip: true }, cell = { strip: false }, path = { strip: false };
    expect(pickFocus([tile], [path], inStrip, true)).toEqual([]);
    expect(pickFocus([tile], [path], inStrip, false)).toEqual([tile]);
    expect(pickFocus([tile, cell], [path], inStrip, true)).toEqual([cell]);
    /* Nothing lit: both paths fall back to the found cells. */
    expect(pickFocus([], [path, tile], inStrip, false)).toEqual([path, tile]);
    expect(pickFocus([], [path, tile], inStrip, true)).toEqual([path]);
  });
  it("sceneScale follows the tighter axis and guards zero sizes", () => {
    expect(sceneScale({ x: 0, y: 0, w: 643, h: 526 }, 959, 345)).toBeCloseTo(1.525, 2);
    expect(sceneScale({ x: 0, y: 0, w: 643, h: 100 }, 959, 345)).toBeCloseTo(0.67, 2);
    expect(sceneScale({ x: 0, y: 0, w: 643, h: 526 }, 0, 345)).toBe(1);
  });
});

describe("hideOffstage", () => {
  /** A stand-in for the svg: pointers with a data-at point, and the attributes hideOffstage sets. */
  const ptr = (at: string, reach?: string) => {
    const attrs = new Map<string, string>([["data-at", at], ...(reach ? [["data-reach", reach] as [string, string]] : [])]);
    return {
      attrs,
      getAttribute: (k: string) => attrs.get(k) ?? null,
      setAttribute: (k: string, v: string) => void attrs.set(k, v),
      removeAttribute: (k: string) => void attrs.delete(k),
    };
  };
  it("marks pointers whose point is outside the view, and clears the mark once back in view", () => {
    const inView = ptr("50 50"), edge = ptr("100 0"), left = ptr("-1 50"), below = ptr("50 101");
    const svg = { querySelectorAll: (sel: string) => (sel === ".ptr[data-at]" ? [inView, edge, left, below] : []) };
    hideOffstage(svg as unknown as Element, { x: 0, y: 0, w: 100, h: 100 });
    expect([inView, edge, left, below].map((p) => p.attrs.has("data-off"))).toEqual([false, false, true, true]);
    hideOffstage(svg as unknown as Element, { x: -10, y: 0, w: 200, h: 200 });
    expect([inView, edge, left, below].some((p) => p.attrs.has("data-off"))).toBe(false);
    /* No view yet (unmeasured stage): nothing is hidden. */
    left.attrs.set("data-off", "");
    hideOffstage(svg as unknown as Element, null);
    expect(left.attrs.has("data-off")).toBe(false);
  });
  it("also hides a pointer whose flag would be clipped, counting its growth on the stage", () => {
    const up = ptr("50 60", "up 44"), right = ptr("40 50", "right 52");
    const svg = { querySelectorAll: () => [up, right] };
    const view = { x: 0, y: 0, w: 100, h: 100 };
    hideOffstage(svg as unknown as Element, view);
    expect([up, right].map((p) => p.attrs.has("data-off"))).toEqual([false, false]);
    /* At px 1.5 the up flag reaches 66 above its point (past the top), the right one 78 (past the edge). */
    hideOffstage(svg as unknown as Element, view, 1.5);
    expect([up, right].map((p) => p.attrs.has("data-off"))).toEqual([true, true]);
  });
  it("checks the flag's other axis too: an up flag's half-width, a right flag's height", () => {
    const view = { x: 0, y: 0, w: 100, h: 100 };
    /* An up flag 40 wide (half 20) at x 15 passes the left edge; at x 50 it fits. */
    const nearLeft = ptr("15 60", "up 44 20"), mid = ptr("50 60", "up 44 20"), nearRight = ptr("90 60", "up 44 20");
    /* A right flag is 22 tall (11 each side): at y 5 its top passes the view's top. */
    const high = ptr("10 5", "right 40"), low = ptr("10 95", "right 40"), ok = ptr("10 50", "right 40");
    const all = [nearLeft, mid, nearRight, high, low, ok];
    const svg = { querySelectorAll: () => all };
    hideOffstage(svg as unknown as Element, view);
    expect(all.map((p) => p.attrs.has("data-off"))).toEqual([true, false, true, true, true, false]);
    /* Grown by px 2, the right flag at y 50 still fits (22 each side), the one at y 20 does not. */
    const grown = ptr("10 20", "right 40");
    hideOffstage({ querySelectorAll: () => [ok, grown] } as unknown as Element, { x: 0, y: 0, w: 200, h: 100 }, 2);
    expect([ok, grown].map((p) => p.attrs.has("data-off"))).toEqual([false, true]);
  });
});

describe("crop cues", () => {
  const view = { x: 0, y: 0, w: 1000, h: 400 };
  it("judge the drawing itself, not the room left for grown flags", () => {
    /* LCS recap at 1024: a flagless table that fits under the view top, with the strip cut below. */
    const shot = { x: 300, y: 40, w: 400, h: 420, flags: false };
    const padded = roomFor({ ...shot, flags: true }, 2);
    expect(cropEdges(view, padded).t).toBe(true); // the old false cue
    expect(cropEdges(view, shot)).toEqual({ l: false, r: false, t: false, b: true });
  });
  it("sit at the middle of each cut edge, at the very edge of the view", () => {
    const spots = cueSpots(view, { l: true, r: true, t: true, b: true }, 2);
    const at = Object.fromEntries(spots.map((c) => [c.key, c]));
    expect(at.t.x).toBe(500);
    expect(at.b.x).toBe(500);
    expect(at.l.y).toBe(200);
    expect(at.r.y).toBe(200);
    /* The pill touches nothing past a small gap from its edge: 4 screen pixels, so 8 units at px 2. */
    expect(at.t.y).toBe(view.y + 8);
    expect(at.b.y).toBe(view.y + view.h - 8);
    expect(at.l.x).toBe(view.x + 8);
    expect(at.r.x).toBe(view.x + view.w - 8);
    expect(cueSpots(view, { l: false, r: false, t: false, b: true }, 1).map((c) => c.key)).toEqual(["b"]);
  });
  it("draw each chevron on a surface pill, so it reads over plates as well as floor", () => {
    const html = renderToStaticMarkup(<svg><CropCues view={view} cut={{ l: false, r: false, t: true, b: true }} px={1} /></svg>);
    expect(html.match(/<g class="crop-cue"/g)).toHaveLength(2);
    expect(html.match(/<rect class="crop-pill"/g)).toHaveLength(2);
    expect(html).toContain('aria-hidden="true"');
  });
});

describe("room for grown labels", () => {
  it("leaves flag room above only when the step has flags, and never above the strip", () => {
    const strip = { x: 0, y: 300, w: 100, h: 40 };
    const shot = { x: 0, y: 0, w: 1000, h: 400, strip };
    const flagless = roomFor({ ...shot, flags: false }, 2);
    expect(flagless.y).toBe(-16); // TAG_REACH at px 2, not FLAG_REACH
    expect(roomFor(shot, 2).y).toBe(-48);
    expect(roomFor(shot, 2).strip!.y).toBe(300);
    expect(roomFor(shot, 2).strip!.h).toBe(56);
  });
});

import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import IsoScene, { ZoomContext, cropEdges, cueSpots, hideOffstage, sceneScale } from "./IsoScene";
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
  it("sit beside the drawing where the view has room, else at the middle of the edge", () => {
    const shot = { x: 300, y: 40, w: 400, h: 420 };
    const [b] = cueSpots(view, shot, { l: false, r: false, t: false, b: true }, 1);
    expect(b.x > shot.x + shot.w || b.x < shot.x).toBe(true);
    expect(b.y).toBeGreaterThan(380);
    const full = { x: -50, y: 40, w: 1100, h: 420 };
    const [l, m] = cueSpots(view, full, { l: true, r: false, t: false, b: true }, 1);
    expect(m.x).toBe(500);
    /* The left cue sits below or above the drawing when there is room there; here there is above. */
    expect(l.y).toBeLessThan(40);
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

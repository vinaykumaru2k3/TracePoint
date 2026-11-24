import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import IsoScene, { ZoomContext, sceneScale } from "./IsoScene";
import SceneFit, { fitScenes } from "./SceneFit";

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
  it("sceneScale follows the tighter axis and guards zero sizes", () => {
    expect(sceneScale({ x: 0, y: 0, w: 643, h: 526 }, 959, 345)).toBeCloseTo(1.525, 2);
    expect(sceneScale({ x: 0, y: 0, w: 643, h: 100 }, 959, 345)).toBeCloseTo(0.67, 2);
    expect(sceneScale({ x: 0, y: 0, w: 643, h: 526 }, 0, 345)).toBe(1);
  });
});

import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
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
});

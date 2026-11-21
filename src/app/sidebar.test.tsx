import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
// @ts-expect-error the project has no node typings; vitest runs in node
import { readFileSync } from "node:fs";
import { MemoryRouter } from "react-router-dom";
import { CURRICULUM } from "../curriculum";
import CourseSidebar from "./CourseSidebar";

describe("folder colours", () => {
  it("gives every section its own --sec-NN token", () => {
    const colors = CURRICULUM.map((s) => s.color);
    colors.forEach((c) => expect(c).toMatch(/^var\(--sec-\d\d\)$/));
    expect(new Set(colors).size).toBe(colors.length);
    CURRICULUM.forEach((s) => expect(s.color).toBe(`var(--sec-${s.n})`));
  });
  it("defines all ten tokens in light, dark media and data-theme dark", () => {
    const css: string = readFileSync("src/design/tokens.css", "utf8");
    for (let i = 1; i <= 10; i++) {
      const n = String(i).padStart(2, "0");
      const count = css.split(`--sec-${n}:`).length - 1;
      expect(count, `--sec-${n}`).toBeGreaterThanOrEqual(3);
    }
  });
  it("sets --sec on each folder and fills the icon from it", () => {
    const html = renderToStaticMarkup(<MemoryRouter><CourseSidebar currentId="arrays" currentIdx={1} progress={{}} /></MemoryRouter>);
    expect(html).toContain("--sec:var(--sec-01)");
    expect(html).toContain("--sec:var(--sec-10)");
    const css: string = readFileSync("src/app.css", "utf8");
    expect(css).toMatch(/\.sec > summary \.icon path\s*\{[^}]*fill:\s*var\(--sec\)/);
    expect(css).toMatch(/\.sec\[open\] > ul\s*\{[^}]*border-left:\s*1px solid var\(--sec\)/);
  });
});

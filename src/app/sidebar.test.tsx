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
  it("defines all ten tokens in each of the light, dark media and data-theme dark blocks", () => {
    const css: string = readFileSync("src/design/tokens.css", "utf8");
    const media = css.indexOf("@media (prefers-color-scheme: dark)");
    const theme = css.indexOf(':root[data-theme="dark"] {');
    expect(media).toBeGreaterThan(0);
    expect(theme).toBeGreaterThan(media);
    const blocks = { light: css.slice(0, media), media: css.slice(media, theme), theme: css.slice(theme) };
    for (const [name, b] of Object.entries(blocks)) {
      for (let i = 1; i <= 10; i++) {
        const n = String(i).padStart(2, "0");
        expect(b, `${name} --sec-${n}`).toContain(`--sec-${n}: #`);
      }
    }
  });
  it("hue-fills only the folder icon, keeps its outline ink, and swatch is square-ish", () => {
    const css: string = readFileSync("src/app.css", "utf8");
    expect(css).toMatch(/\.sec > summary > \.icon path\s*\{[^}]*fill:\s*var\(--sec\)/);
    expect(css).toMatch(/\.sec > summary > \.icon\s*\{[^}]*color:\s*var\(--ink\)/);
    expect(css).not.toMatch(/\.sec > summary \.icon path\s*\{/);
    expect(css).toMatch(/\.sec-swatch\s*\{[^}]*border-radius:\s*2px/);
  });
  it("sets --sec on each folder and fills the icon from it", () => {
    const html = renderToStaticMarkup(<MemoryRouter><CourseSidebar currentId="arrays" currentIdx={1} progress={{}} /></MemoryRouter>);
    expect(html).toContain("--sec:var(--sec-01)");
    expect(html).toContain("--sec:var(--sec-10)");
    const css: string = readFileSync("src/app.css", "utf8");
    expect(css).toMatch(/\.sec\[open\] > ul\s*\{[^}]*border-left:\s*1px solid var\(--sec\)/);
  });
});

describe("cheat tables", () => {
  it("keeps cost cells on one line but lets the first and last columns wrap", () => {
    const css: string = readFileSync("src/app.css", "utf8");
    expect(css).toMatch(/\.cheat td:not\(:first-child\):not\(:last-child\),\s*\.cheat th:not\(:first-child\):not\(:last-child\)\s*\{[^}]*white-space:\s*nowrap/);
  });
});

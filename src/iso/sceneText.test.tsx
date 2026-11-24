import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import IsoPointer from "./IsoPointer";
// @ts-expect-error node:fs has no types in the app tsconfig
import { readFileSync } from "node:fs";

const css: string = readFileSync("src/app.css", "utf8").replace(/\/\*[^]*?\*\//g, "");
/** The declarations of every rule whose selector list names `sel`. */
const rule = (sel: string) => css.split("}").filter((r) => r.split("{")[0].split(",").some((s) => s.trim() === sel)).map((r) => r.split("{")[1]).join(";");

describe("scene text keeps its screen size when the camera zooms out", () => {
  it("scales every kind of scene text by --px", () => {
    for (const sel of [".tag-body", ".grid-head", ".plate-index:not(.grid-head *", ".row-name", ".null-tag", ".box-label", ".ptr-flag"]) {
      expect(rule(sel), sel).toMatch(/scale: max\(1, .*var\(--px, 1\)/);
    }
  });
  it("grows a pointer's whole flag about the point it names", () => {
    for (const dir of ["up", "right"] as const) {
      const html = renderToStaticMarkup(<svg><IsoPointer x={1} y={1} label="i" dir={dir} /></svg>);
      expect(html).toMatch(/<g class="ptr"[^>]*><g class="ptr-flag"><line[^]*<rect[^]*<text[^]*<\/g><\/g>/);
    }
    expect(rule(".ptr-flag")).toContain("transform-origin: 0 0");
  });
});

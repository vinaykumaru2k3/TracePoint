import { describe, expect, it } from "vitest";
// @ts-expect-error the project has no node typings; vitest runs in node
import { readFileSync } from "node:fs";

const html: string = readFileSync("index.html", "utf8");
const tokens: string = readFileSync("src/design/tokens.css", "utf8");
const FILE = "public/fonts/jetbrains-mono-latin-wght.woff2";

describe("self-hosted font", () => {
  it("index.html drops Google Fonts and preloads the woff2 with crossorigin", () => {
    expect(html).not.toMatch(/fonts\.(googleapis|gstatic)/);
    expect(html).toMatch(/<link rel="preload" href="\/fonts\/jetbrains-mono-latin-wght\.woff2" as="font" type="font\/woff2" crossorigin>/);
  });

  it("tokens.css declares the @font-face with swap and the same URL as the preload", () => {
    const face = tokens.match(/@font-face\s*\{[^}]*\}/)?.[0] ?? "";
    expect(face).toContain('font-family: "JetBrains Mono"');
    expect(face).toContain('url("/fonts/jetbrains-mono-latin-wght.woff2") format("woff2")');
    expect(face).toContain("font-display: swap");
    expect(face).toContain("font-weight: 100 800");
    expect(face).toContain("unicode-range:");
  });

  it("the woff2 file exists, is over 20 kB and starts with wOF2", () => {
    const b: Uint8Array = readFileSync(FILE);
    expect(b.length).toBeGreaterThan(20 * 1024);
    expect(String.fromCharCode(...b.slice(0, 4))).toBe("wOF2");
  });

  it("body sets font-size-adjust from-font", () => {
    expect(readFileSync("src/app.css", "utf8")).toMatch(/body\s*\{[^}]*font-size-adjust:\s*from-font/);
  });
});

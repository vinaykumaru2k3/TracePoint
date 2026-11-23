import { describe, expect, it } from "vitest";
// @ts-expect-error the project has no node typings; vitest runs in node
import { readFileSync, existsSync } from "node:fs";
import { themeMetaColors } from "../hooks/useTheme";

const html: string = readFileSync("index.html", "utf8");
const tokens: string = readFileSync("src/design/tokens.css", "utf8");
const vercel = JSON.parse(readFileSync("vercel.json", "utf8")) as {
  headers: { source: string; headers: { key: string; value: string }[] }[];
};
const rule = vercel.headers.find((h) => h.source === "/(.*)")!;
const header = (k: string) => rule.headers.find((h) => h.key === k)?.value ?? "";

describe("head metadata", () => {
  it("index.html has the icon, manifest, both theme-color metas and noscript", () => {
    expect(html).toContain('<link rel="icon" href="/favicon.svg" type="image/svg+xml">');
    expect(html).toContain('<link rel="manifest" href="/manifest.webmanifest">');
    expect(html).toMatch(/<meta name="theme-color" content="#f3efe9" media="\(prefers-color-scheme: light\)">/);
    expect(html).toMatch(/<meta name="theme-color" content="#15120f" media="\(prefers-color-scheme: dark\)">/);
    expect(html).toContain("<noscript><p>Tracepoint needs JavaScript to run its lessons.</p></noscript>");
  });

  it("theme-color values match the --bg tokens", () => {
    expect(tokens).toMatch(/--bg:\s*#f3efe9/i);
    expect(tokens).toMatch(/--bg:\s*#15120f/i);
  });

  it("the manifest parses and its icon exists", () => {
    const m = JSON.parse(readFileSync("public/manifest.webmanifest", "utf8"));
    expect(m).toMatchObject({ name: "Tracepoint", short_name: "Tracepoint", start_url: "/", display: "standalone", background_color: "#15120f", theme_color: "#15120f" });
    expect(m.icons.length).toBeGreaterThan(0);
    for (const i of m.icons) {
      expect(i.sizes).toBe("any");
      expect(existsSync("public" + i.src)).toBe(true);
    }
  });
});

describe("security headers", () => {
  const csp = header("Content-Security-Policy");
  it("CSP is strict and has no third-party origins", () => {
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).not.toMatch(/googleapis|gstatic/);
  });
  it("every listed header is present", () => {
    expect(header("X-Content-Type-Options")).toBe("nosniff");
    expect(header("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(header("X-Frame-Options")).toBe("DENY");
    expect(header("Cross-Origin-Opener-Policy")).toBe("same-origin");
    expect(header("Permissions-Policy")).toBe("camera=(), microphone=(), geolocation=()");
  });
});

describe("themeMetaColors", () => {
  const orig = { light: "#f3efe9", dark: "#15120f" };
  it("an explicit theme sets both metas to that theme's bg", () => {
    expect(themeMetaColors("dark", "#111", orig)).toEqual(["#111", "#111"]);
    expect(themeMetaColors("light", "#eee", orig)).toEqual(["#eee", "#eee"]);
  });
  it("system restores the light and dark values", () => {
    expect(themeMetaColors(null, "#111", orig)).toEqual(["#f3efe9", "#15120f"]);
  });
});

import { describe, expect, it } from "vitest";

/* A wrong form in a pitfall is the very thing the reader must read, so it is flagged by a red chip,
   never by a line drawn across or near its letters (the strikes read as stray red lines). */
/* No Node types in this project, so fs is loaded by a non-literal specifier (typed any). */
const fsId: string = "node:fs";
const { readFileSync } = await import(/* @vite-ignore */ fsId);
const css: string = readFileSync(new URL("../app.css", import.meta.url), "utf8");
const rules = [...css.matchAll(/([^{}]*s\.wrong[^{}]*)\{([^}]*)\}/g)].map((m) => ({ sel: m[1].trim(), body: m[2] }));

describe("wrong forms", () => {
  it("are styled", () => {
    expect(rules.length).toBeGreaterThan(0);
  });

  it("draw no line: no pseudo-element, gradient stroke or text decoration", () => {
    for (const r of rules) {
      expect(r.sel).not.toMatch(/::?(after|before)/);
      expect(r.body).not.toMatch(/gradient|--strike|rotate/);
      expect(r.body).not.toMatch(/text-decoration\s*:(?!\s*none)/);
    }
  });

  it("sit on the red wrong-chip", () => {
    expect(rules.some((r) => /background[^;]*var\(--wrong-chip\)/.test(r.body))).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
// @ts-expect-error the project has no node typings; vitest runs in node
import { readFileSync } from "node:fs";

const tokens: string = readFileSync("src/design/tokens.css", "utf8");
const css: string = readFileSync("src/app.css", "utf8");

/** The body of the top-level rule whose selector is exactly `sel` (indented rules in media blocks are skipped). */
function rule(sel: string, from = css): string {
  const esc = sel.replace(/\W/g, (c) => "\\" + c);
  const m = new RegExp("^" + esc + "\\s*\\{([^}]*)\\}", "m").exec(from);
  expect(m, `rule ${sel}`).not.toBeNull();
  return m ? m[1] : "";
}

describe("type scale", () => {
  it("tokens.css defines the four tiers and the content line height", () => {
    expect(tokens).toMatch(/--fs-title:\s*20px/);
    expect(tokens).toMatch(/--fs-content:\s*15px/);
    expect(tokens).toMatch(/--fs-chrome:\s*12px/);
    expect(tokens).toMatch(/--fs-micro:\s*11px/);
    expect(tokens).toMatch(/--lh-content:\s*1\.6/);
  });

  it("the explanation leads: title and body use the title and content tiers", () => {
    expect(rule(".explain h2")).toContain("font-size: var(--fs-title)");
    expect(rule(".explain .say")).toContain("font-size: var(--fs-content)");
    expect(rule(".idea")).toContain("font-size: var(--fs-content)");
  });

  it("no bare .explain p rule can override the key legend or the hint", () => {
    expect(css).not.toMatch(/^\.explain p\s*[,{]/m);
    const keys = rule(".keys");
    expect(keys).toContain("font-size: var(--fs-chrome)");
    expect(keys).toContain("color: var(--muted)");
    expect(rule(".keys .kp")).toContain("white-space: nowrap");
    expect(rule(".keys-hint")).toContain("font-size: var(--fs-chrome)");
    expect(css).toMatch(/@media \(hover: none\) \{[^}]*\.keys-hint/);
  });

  it("the skip link is sized with logical properties", () => {
    const both = rule(".skip") + rule(".skip:focus-visible");
    expect(both).toContain("inline-size");
    expect(both).toContain("block-size");
    expect(both).toContain("padding-inline");
    expect(both).not.toMatch(/(^|[\s;])(width|height|padding):/);
  });

  it("the intro goes two-column on its own width, not the viewport", () => {
    expect(rule(".intro")).toContain("container-type: inline-size");
    expect(css).toMatch(/@container[^{]*min-width:\s*720px/);
    expect(css).not.toMatch(/@media \(min-width: 1120px\)/);
  });

  it("chevron transitions stop under reduced motion", () => {
    const rm = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(rm).toMatch(/\.run-fold > summary::before[^{]*\{\s*transition: none/);
  });

  it("metric labels use the chrome tier", () => {
    expect(rule(".metric small")).toContain("font-size: var(--fs-chrome)");
  });

  it("the kind chip and the memory head sit in the chrome tier", () => {
    expect(rule(".explain .chip")).toContain("font-size: var(--fs-chrome)");
    expect(rule(".memhead .lbl")).toContain("font-size: var(--fs-chrome)");
    expect(rule(".memhead .costs")).toContain("font-size: var(--fs-chrome)");
  });

  it("the result readout is unboxed", () => {
    const r = rule(".result");
    expect(r).not.toMatch(/border/);
    expect(r).not.toMatch(/background/);
  });

  it("guide definitions keep a readable measure", () => {
    const dd = rule(".gbody dl.terms dd");
    expect(dd).toContain("text-wrap: pretty");
    expect(dd).toContain("max-inline-size: 62ch");
  });

  it("the phone block pins the explanation at 17px title and 14px body", () => {
    const phone = css.slice(css.indexOf("@media (max-width: 560px)"));
    expect(phone).toMatch(/\.explain h2\s*\{[^}]*font-size:\s*17px/);
    expect(phone).toMatch(/\.explain \.say\s*\{[^}]*font-size:\s*14px/);
  });
});

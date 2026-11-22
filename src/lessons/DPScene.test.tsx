import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import DPScene from "./DPScene";
import { blankGrid, paint, type DPState } from "./dpkit";
import type { Step } from "../engine/types";

const mk = (state: DPState) => ({ state } as unknown as Step<DPState>);
const count = (html: string, cls: string) => html.split(cls).length - 1;

describe("DPScene", () => {
  it("draws a 2x3 grid as 6 plates with its headers", () => {
    const grid = paint(blankGrid(2, 3).map((r) => r.map(() => ({ v: 1 }))), [[0, 0]], "active");
    const html = renderToStaticMarkup(<DPScene step={mk({ kind: "grid", grid, rowHead: ["r0", "r1"], colHead: ["a", "b", "c"] })} />);
    expect(count(html, "box s-")).toBe(6);
    expect(count(html, "plate-index")).toBe(5);
    for (const t of ["r0", "r1", ">a<", ">b<", ">c<"]) expect(html).toContain(t);
    expect(html).toContain("s-active");
  });
  it("draws a 1D row with a strip", () => {
    const html = renderToStaticMarkup(<DPScene step={mk({ kind: "row", cells: [{ v: 0 }, { v: 1 }, { v: null }], strip: { name: "stack", cells: [{ v: "f(2)" }] } })} />);
    expect(html).toContain("stack");
    expect(html).toContain("f(2)");
  });
});

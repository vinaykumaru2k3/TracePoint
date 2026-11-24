import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import GridTable from "./GridTable";
import { blankGrid } from "../lessons/dpkit";

describe("GridTable", () => {
  it("wraps each row and column header in a grid-head group, and no other index", () => {
    const html = renderToStaticMarkup(<svg><GridTable grid={blankGrid(2, 3)} rowHead={["A", "B"]} colHead={["X", "Y", "Z"]} /></svg>);
    expect((html.match(/<g class="grid-head"><text class="plate-index"/g) ?? []).length).toBe(5);
  });
  it("lights the row and column headers of the cell being written, else of the live pointers", () => {
    const grid = blankGrid(2, 3);
    grid[1][2] = { ...grid[1][2], state: "active" };
    const on = (html: string) => [...html.matchAll(/<g class="grid-head on"><text[^>]*>([^<]*)</g)].map((m) => m[1]).sort();
    expect(on(renderToStaticMarkup(<svg><GridTable grid={grid} rowHead={["A", "B"]} colHead={["X", "Y", "Z"]} /></svg>))).toEqual(["B", "Z"]);
    const ptrs = [{ r: 0, c: 1, label: "here" }, { r: 1, c: 0, label: "old", dim: true }];
    expect(on(renderToStaticMarkup(<svg><GridTable grid={blankGrid(2, 3)} rowHead={["A", "B"]} colHead={["X", "Y", "Z"]} pointers={ptrs} /></svg>))).toEqual(["A", "Y"]);
  });
});

import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import GridTable from "./GridTable";
import { blankGrid } from "../lessons/dpkit";

describe("GridTable", () => {
  it("wraps each row and column header in a grid-head group, and no other index", () => {
    const html = renderToStaticMarkup(<svg><GridTable grid={blankGrid(2, 3)} rowHead={["A", "B"]} colHead={["X", "Y", "Z"]} /></svg>);
    expect((html.match(/<g class="grid-head"><text class="plate-index"/g) ?? []).length).toBe(5);
  });
});

import { describe, expect, it } from "vitest";
import { flagSide } from "./GraphNodes";

describe("flagSide", () => {
  it("keeps the flag up when no weight badge sits under it", () => {
    expect(flagSide({ x: 0, y: 0 }, "to", [{ x: 200, y: 0, w: 20 }])).toBe("up");
  });
  it("turns the flag right when a weight badge sits where the up flag would go", () => {
    expect(flagSide({ x: 0, y: 0 }, "to", [{ x: 4, y: -30, w: 20 }])).toBe("right");
  });
  it("stays up when the right side is blocked too", () => {
    expect(flagSide({ x: 0, y: 0 }, "to", [{ x: 4, y: -30, w: 20 }, { x: 30, y: 0, w: 20 }])).toBe("up");
  });
});

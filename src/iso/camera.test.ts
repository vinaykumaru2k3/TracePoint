import { describe, expect, it } from "vitest";
import { follow, frame, lerpBox } from "./camera";

describe("camera frame", () => {
  it("zooms out to fit a box that is too big for the stage", () => {
    const v = frame({ x: 0, y: 0, w: 2000, h: 200 }, 1000, 500, 1.5);
    expect(v.w).toBeCloseTo(2000);
    expect(v.h).toBeCloseTo(1000); // stage aspect kept
    expect(v.x + v.w / 2).toBeCloseTo(1000); // centred on the box
    expect(v.y + v.h / 2).toBeCloseTo(100);
  });

  it("never zooms in past the cap, so a small drawing keeps its size", () => {
    const v = frame({ x: 100, y: 50, w: 100, h: 50 }, 1000, 500, 1.5);
    expect(1000 / v.w).toBeCloseTo(1.5);
    expect(500 / v.h).toBeCloseTo(1.5);
    expect(v.x + v.w / 2).toBeCloseTo(150);
    expect(v.y + v.h / 2).toBeCloseTo(75);
  });

  it("falls back to the box itself before the stage has a size", () => {
    expect(frame({ x: 1, y: 2, w: 3, h: 4 }, 0, 0, 1.5)).toEqual({ x: 1, y: 2, w: 3, h: 4 });
  });

  it("follow keeps the shot while the drawing still fits it", () => {
    const prev = { x: 0, y: 0, w: 1000, h: 500 };
    expect(follow(prev, { x: 50, y: 100, w: 900, h: 300 }, 1000, 500, 1.5)).toEqual(prev);
  });

  it("follow pans just enough when the drawing leaves the shot, without zooming", () => {
    const prev = { x: 0, y: 0, w: 1000, h: 500 };
    const v = follow(prev, { x: 300, y: 100, w: 900, h: 300 }, 1000, 500, 1.5);
    expect(v).toEqual({ x: 200, y: 0, w: 1000, h: 500 });
  });

  it("follow zooms out when the drawing outgrows the shot", () => {
    const prev = { x: 0, y: 0, w: 1000, h: 500 };
    const v = follow(prev, { x: 0, y: 0, w: 1600, h: 200 }, 1000, 500, 1.5);
    expect(v.w).toBeCloseTo(1600);
  });

  it("follow zooms back in only for a real gain", () => {
    const prev = { x: 0, y: 0, w: 1000, h: 500 };
    expect(follow(prev, { x: 100, y: 100, w: 900, h: 300 }, 1000, 500, 1.5).w).toBe(1000);
    expect(follow(prev, { x: 100, y: 100, w: 400, h: 100 }, 1000, 500, 1.5).w).toBeCloseTo(1000 / 1.5);
  });

  it("follow starts over when the stage changes shape", () => {
    const prev = { x: 0, y: 0, w: 1000, h: 500 };
    expect(follow(prev, { x: 0, y: 0, w: 1000, h: 1000 }, 500, 500, 1.5)).toEqual(frame({ x: 0, y: 0, w: 1000, h: 1000 }, 500, 500, 1.5));
  });

  it("interpolates between two frames", () => {
    expect(lerpBox({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 20, w: 30, h: 10 }, 0.5)).toEqual({ x: 5, y: 10, w: 20, h: 10 });
  });
});

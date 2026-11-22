import { describe, expect, it } from "vitest";
import { aim, crops, follow, frame, lerpBox } from "./camera";

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

describe("readable camera", () => {
  const lens = { floor: 0.85, read: 1 };
  const wide = { x: 0, y: 0, w: 3000, h: 400, focus: { x: 2500, y: 100, w: 100, h: 100 } };

  it("fits the whole drawing while it stays readable", () => {
    const shot = { x: 0, y: 0, w: 1100, h: 400, focus: { x: 0, y: 0, w: 10, h: 10 } };
    expect(aim(shot, 1000, 500, 1.5, lens)).toEqual(frame(shot, 1000, 500, 1.5));
  });

  it("reads at the lens scale on the focus once the whole would be too small", () => {
    const v = aim(wide, 1000, 500, 1.5, lens);
    expect(1000 / v.w).toBeCloseTo(1);
    expect(v.x + v.w / 2).toBeCloseTo(2500); // centred on the focus would pass the right edge, so it stops there
    expect(crops(v, wide)).toBe(true);
    const mid = aim({ ...wide, focus: { x: 1500, y: 100, w: 100, h: 100 } }, 1000, 500, 1.5, lens);
    expect(mid.x + mid.w / 2).toBeCloseTo(1550);
  });

  it("keeps the frame inside the drawing at the edges", () => {
    const v = aim({ ...wide, focus: { x: 2950, y: 0, w: 50, h: 50 } }, 1000, 500, 1.5, lens);
    expect(v.x + v.w).toBeCloseTo(3000);
    const l = aim({ ...wide, focus: { x: 0, y: 0, w: 50, h: 50 } }, 1000, 500, 1.5, lens);
    expect(l.x).toBeCloseTo(0);
  });

  it("centres the short axis when the drawing is smaller than the view there", () => {
    const v = aim(wide, 1000, 500, 1.5, lens);
    expect(v.y + v.h / 2).toBeCloseTo(200);
  });

  it("zooms back just enough to keep a spread-out focus whole, never past fitting everything", () => {
    const big = { ...wide, h: 1200, focus: { x: 1000, y: 0, w: 100, h: 550 } };
    expect(500 / aim(big, 1000, 500, 1.5, lens).h).toBeCloseTo(500 / 550);
    const huge = { ...big, focus: { x: 0, y: 0, w: 3000, h: 1200 } };
    expect(aim(huge, 1000, 500, 1.5, lens)).toEqual(frame(huge, 1000, 500, 1.5));
  });

  it("keeps the whole picture when the close-up would gain little", () => {
    const spread = { ...wide, focus: { x: 0, y: 0, w: 2700, h: 300 } };
    expect(aim(spread, 1000, 500, 1.5, lens)).toEqual(frame(spread, 1000, 500, 1.5));
  });

  it("never reads past the cap", () => {
    expect(1000 / aim(wide, 1000, 500, 0.9, { floor: 0.85, read: 1.2 }).w).toBeCloseTo(0.9);
  });

  it("without a lens it fits everything, as before", () => {
    expect(aim(wide, 1000, 500, 1.5)).toEqual(frame(wide, 1000, 500, 1.5));
  });

  it("follow holds while the focus stays well inside, and pans with a margin when it nears the edge", () => {
    const prev = aim(wide, 1000, 500, 1.5, lens);
    expect(follow(prev, { ...wide, focus: { x: 2400, y: 100, w: 100, h: 100 } }, 1000, 500, 1.5, lens)).toEqual(prev);
    const v = follow(prev, { ...wide, focus: { x: 1900, y: 100, w: 100, h: 100 } }, 1000, 500, 1.5, lens);
    expect(v.w).toBe(prev.w);
    expect(v.x).toBeCloseTo(1900 - 40);
  });

  it("follow zooms out to fit when a later step becomes readable whole", () => {
    const prev = aim(wide, 1000, 500, 1.5, lens);
    const small = { x: 0, y: 0, w: 1150, h: 300 };
    expect(follow(prev, small, 1000, 500, 1.5, lens)).toEqual(frame(small, 1000, 500, 1.5));
  });
});

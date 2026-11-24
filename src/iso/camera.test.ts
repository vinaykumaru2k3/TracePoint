import { describe, expect, it } from "vitest";
import { FLAG_REACH, clearStrip, TAG_REACH, aim, crops, follow, frame, lerpBox, roomFor } from "./camera";

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

  it("drops the strip from the focus when the whole focus cannot be read at once", () => {
    /* Knapsack at 1024x768: a 941x217 stage, the lit cells near the top of the table and the lit
       item tile in the strip far below them. Fitting that whole focus reads no better than the whole
       drawing, so the camera used to show everything at 0.35x. */
    const shot = { x: -464, y: -32, w: 1015, h: 625, focus: { x: -139, y: 17, w: 493, h: 573 }, core: { x: -139, y: 17, w: 400, h: 200 } };
    const v = aim(shot, 941, 217, 1.35, lens);
    expect(941 / v.w).toBeGreaterThanOrEqual(lens.floor);
    expect(v.y).toBeLessThanOrEqual(17);
    expect(v.y + v.h).toBeGreaterThanOrEqual(217);
    expect(crops(v, shot)).toBe(true);
    /* A focus that fits keeps its strip. */
    const near = { ...shot, focus: { x: -139, y: 17, w: 400, h: 210 } };
    expect(aim(near, 941, 217, 1.35, lens).y + aim(near, 941, 217, 1.35, lens).h).toBeGreaterThanOrEqual(227);
    /* follow keeps the core in view, not the strip. */
    const prev = aim(shot, 941, 217, 1.35, lens);
    expect(follow(prev, shot, 941, 217, 1.35, lens)).toEqual(prev);
  });

  it("keeps a headed focus's top at the floor scale, cropping far rows rather than the headers", () => {
    /* A table whose core (headers down to the lit cell) is too tall to read at the floor on a short stage. */
    const shot = { x: 0, y: 0, w: 3000, h: 900, focus: { x: 1000, y: 50, w: 400, h: 300 }, core: { x: 1000, y: 50, w: 400, h: 300 } };
    const centred = aim(shot, 941, 217, 1.35, lens);
    expect(941 / centred.w).toBeLessThan(lens.floor);
    const v = aim({ ...shot, headed: true }, 941, 217, 1.35, lens);
    expect(941 / v.w).toBeCloseTo(lens.floor);
    expect(v.y).toBe(50);
    expect(v.y + v.h).toBeLessThan(350);
    /* follow keeps the top in view rather than centring the tall focus. */
    const prev = { ...v, y: 120 };
    expect(follow(prev, { ...shot, headed: true }, 941, 217, 1.35, lens).y).toBeCloseTo(50 - Math.min(40, prev.w * 0.1, prev.h * 0.1));
    /* A headed focus that fits is framed as before. */
    const fits = { ...shot, headed: true, focus: { x: 1000, y: 50, w: 400, h: 150 }, core: { x: 1000, y: 50, w: 400, h: 150 } };
    expect(aim(fits, 941, 217, 1.35, lens)).toEqual(aim({ ...fits, headed: false }, 941, 217, 1.35, lens));
  });

  it("never crops the lit cell of a headed focus: the headers give way when it sits far below them", () => {
    /* Headers at y 50, the lit cell 500 units further down, a 217px stage: the top cannot keep both. */
    const lit = { x: 1100, y: 500, w: 120, h: 80 };
    const shot = { x: 0, y: 0, w: 3000, h: 900, headed: true, lit, focus: { x: 1000, y: 50, w: 400, h: 530 }, core: { x: 1000, y: 50, w: 400, h: 530 } };
    const inside = (v: { x: number; y: number; w: number; h: number }) =>
      lit.x >= v.x && lit.y >= v.y && lit.x + lit.w <= v.x + v.w && lit.y + lit.h <= v.y + v.h;
    const v = aim(shot, 941, 217, 1.35, lens);
    expect(941 / v.w).toBeCloseTo(lens.floor);
    expect(inside(v)).toBe(true);
    expect(v.y).toBeGreaterThan(50);
    /* follow from a frame that shows the headers pans down to the lit cell, with a margin. */
    const prev = { ...v, y: 50 };
    const f = follow(prev, shot, 941, 217, 1.35, lens);
    expect(inside(f)).toBe(true);
    expect(f.y + f.h).toBeGreaterThanOrEqual(lit.y + lit.h + Math.min(40, prev.w * 0.1, prev.h * 0.1) - 0.01);
  });

  it("shows a strip whole or not at all, never a clipped sliver", () => {
    const lensL = { floor: 0.85, read: 1 };
    const core = { x: 100, y: 0, w: 300, h: 200 };
    /* The view's bottom edge (y 255) cuts the strip at 240..300. */
    const v = { x: 0, y: 0, w: 1000, h: 255 };
    /* Taking it in needs 230/300 = 0.77, under the floor, so the view lifts it out instead. */
    const lifted = clearStrip(v, { x: 0, y: 0, w: 1000, h: 300, core, strip: { x: 300, y: 240, w: 200, h: 60 } }, 851, 230, lensL);
    expect(lifted.y + lifted.h).toBeCloseTo(240);
    expect(lifted.h).toBe(255);
    /* A thin overrun is taken in whole while the scale stays at or above the floor. */
    const taken = clearStrip(v, { x: 0, y: 0, w: 1000, h: 300, core, strip: { x: 300, y: 240, w: 200, h: 20 } }, 851, 230, lensL);
    expect(taken.y + taken.h).toBeCloseTo(260);
    expect(230 / taken.h).toBeGreaterThanOrEqual(lensL.floor);
    /* A strip wholly in or wholly out is left alone, and so is one whose lift would drop the core. */
    expect(clearStrip(v, { x: 0, y: 0, w: 1000, h: 300, core, strip: { x: 0, y: 260, w: 10, h: 10 } }, 851, 230, lensL)).toBe(v);
    expect(clearStrip(v, { x: 0, y: 0, w: 1000, h: 300, core, strip: { x: 0, y: 100, w: 10, h: 10 } }, 851, 230, lensL)).toBe(v);
    expect(clearStrip(v, { x: 0, y: 0, w: 1000, h: 300, core: { ...core, y: -40 }, strip: { x: 300, y: 240, w: 200, h: 60 } }, 851, 230, lensL)).toBe(v);
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

describe("room for grown labels", () => {
  it("widens the drawing by the flags' extra reach once text scales up, and not at 1x or closer", () => {
    const shot = { x: 0, y: 0, w: 1000, h: 400, focus: { x: 10, y: 10, w: 5, h: 5 } };
    expect(roomFor(shot, 1)).toBe(shot);
    expect(roomFor({ ...shot, headed: true }, 2).headed).toBe(true);
    expect(roomFor(shot, 0.8)).toBe(shot);
    const t = FLAG_REACH * 0.5, m = TAG_REACH * 0.5;
    expect(roomFor(shot, 1.5)).toEqual({ x: -m, y: -t, w: 1000 + 2 * m, h: 400 + t + m, focus: { x: 10 - m, y: 10 - t, w: 5 + 2 * m, h: 5 + t + m } });
    /* The lens crops to the focus or core, so they get the same room as the drawing. */
    expect(roomFor({ ...shot, core: { x: 0, y: 0, w: 10, h: 10 } }, 1.5).core).toEqual({ x: -m, y: -t, w: 10 + 2 * m, h: 10 + t + m });
  });
});

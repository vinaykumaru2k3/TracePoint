export interface Box { x: number; y: number; w: number; h: number }

/**
 * The viewBox that shows `box` on a stage of W×H pixels: centred on the box, with the stage's own
 * aspect, zoomed out as far as the box needs but never zoomed in past `maxScale` pixels per unit,
 * so a small drawing keeps the size of a big one.
 */
export function frame(box: Box, W: number, H: number, maxScale: number): Box {
  if (!(W > 0 && H > 0)) return box;
  const scale = Math.min(W / box.w, H / box.h, maxScale);
  const w = W / scale, h = H / scale;
  return { x: box.x + box.w / 2 - w / 2, y: box.y + box.h / 2 - h / 2, w, h };
}

/** Zoom back in only when the drawing would grow by more than this; small gains would make the scene breathe. */
const ZOOM_IN_GAIN = 1.25;

/**
 * A step's drawing, and optionally the part of it the step is about (active cells, pointers, lit
 * edges). `core` is that focus without the side strip under the drawing (a queue, the chosen items):
 * the camera falls back to it when the whole focus cannot be read at once.
 */
export interface Shot extends Box { focus?: Box; core?: Box }

export interface Lens {
  /** Below this scale the whole drawing is too small to read, so the camera frames the focus instead. */
  floor: number;
  /** The scale to read at once the camera has stopped fitting everything. */
  read: number;
}

/** A close-up must be at least this much bigger than the whole picture to be worth cropping. */
const CROP_GAIN = 1.2;

/**
 * What the lens frames: the whole focus when it fits the stage at a readable scale, else its core
 * (the main drawing's part, without the strip), so a lit tile far below the table does not stretch
 * the close-up back out to the whole picture.
 */
export function focusFor(shot: Shot, W: number, H: number, lens: Lens): Box {
  const f = shot.focus ?? shot;
  return shot.core && Math.min(W / f.w, H / f.h) < lens.floor ? shot.core : f;
}

const clamp = (v: number, lo: number, hi: number) => (hi < lo ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, v)));

/**
 * The frame for one step. Fit the whole drawing when that keeps it readable; otherwise read at
 * `lens.read` (or as close to it as keeps the whole focus in view), centred on the focus
 * and kept inside the drawing so no empty floor shows.
 */
export function aim(shot: Shot, W: number, H: number, maxScale: number, lens?: Lens): Box {
  const whole = frame(shot, W, H, maxScale);
  if (!lens || !(W > 0 && H > 0) || W / whole.w >= lens.floor) return whole;
  const f = focusFor(shot, W, H, lens);
  /* Read at `lens.read`, but the focus always fits whole: a spread-out focus pulls the zoom back,
     though never further than fitting the whole drawing would. */
  const s = Math.min(maxScale, Math.max(W / whole.w, Math.min(lens.read, W / f.w, H / f.h))), w = W / s, h = H / s;
  /* A close-up that barely beats the whole picture is not worth hiding the rest for. */
  if (s < (W / whole.w) * CROP_GAIN) return whole;
  return {
    x: clamp(f.x + f.w / 2 - w / 2, shot.x, shot.x + shot.w - w),
    y: clamp(f.y + f.h / 2 - h / 2, shot.y, shot.y + shot.h - h),
    w, h
  };
}

/** True when a frame leaves part of the drawing out. */
export const crops = (view: Box, shot: Box, slack = 4) =>
  shot.x < view.x - slack || shot.y < view.y - slack
  || shot.x + shot.w > view.x + view.w + slack || shot.y + shot.h > view.y + view.h + slack;

/**
 * The next frame, given the one on screen. Holds the shot while what matters still fits it, pans
 * just enough when it does not, zooms out when needed and back in only for a real gain. What
 * matters is the whole drawing, or only its focus once the drawing is too big to read whole.
 */
export function follow(prev: Box | null, shot: Shot, W: number, H: number, maxScale: number, lens?: Lens): Box {
  const ideal = aim(shot, W, H, maxScale, lens);
  if (!prev || !(W > 0 && H > 0) || Math.abs(prev.w / prev.h - W / H) > 0.01 * (W / H)) return ideal;
  const now = W / prev.w, want = W / ideal.w;
  if (want < now * 0.999 || want > now * ZOOM_IN_GAIN) return ideal;
  const cropped = crops(ideal, shot);
  /* Once cropped, keep a margin round the focus so it never sits flush on the edge. */
  const f = cropped ? (lens ? focusFor(shot, W, H, lens) : shot.focus ?? shot) : shot;
  const m = cropped ? Math.min(40, prev.w * 0.1, prev.h * 0.1) : 0;
  const need = { x: f.x - m, y: f.y - m, w: f.w + 2 * m, h: f.h + 2 * m };
  /* Move the least that brings `need` into view; centre it when it is bigger than the view. */
  const shift = (lo: number, len: number, a: number, alen: number) =>
    alen > len ? a + alen / 2 - (lo + len / 2) : a < lo ? a - lo : a + alen > lo + len ? a + alen - (lo + len) : 0;
  let x = prev.x + shift(prev.x, prev.w, need.x, need.w), y = prev.y + shift(prev.y, prev.h, need.y, need.h);
  if (cropped) { x = clamp(x, shot.x, shot.x + shot.w - prev.w); y = clamp(y, shot.y, shot.y + shot.h - prev.h); }
  return x !== prev.x || y !== prev.y ? { ...prev, x, y } : prev;
}

export const lerpBox = (a: Box, b: Box, t: number): Box =>
  ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, w: a.w + (b.w - a.w) * t, h: a.h + (b.h - a.h) * t });

export const parseBox = (s: string): Box => {
  const [x, y, w, h] = s.split(/[\s,]+/).map(Number);
  return { x, y, w, h };
};

export const boxString = (b: Box) => `${b.x.toFixed(1)} ${b.y.toFixed(1)} ${b.w.toFixed(1)} ${b.h.toFixed(1)}`;

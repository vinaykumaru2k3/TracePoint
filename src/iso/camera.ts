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
 * The next shot for a camera that is showing `prev`, like a camera operator following the action:
 * hold the shot while the drawing fits in it, pan only as far as needed when it does not, zoom out
 * as soon as the drawing outgrows it, and zoom back in only for a real gain.
 */
export function follow(prev: Box | null, box: Box, W: number, H: number, maxScale: number): Box {
  const ideal = frame(box, W, H, maxScale);
  if (!prev || !(W > 0 && H > 0) || Math.abs(prev.w / prev.h - W / H) > 0.01 * (W / H)) return ideal;
  const now = W / prev.w, want = W / ideal.w;
  if (want < now * 0.999 || want > now * ZOOM_IN_GAIN) return ideal;
  const shift = (lo: number, len: number, a: number, alen: number) =>
    a < lo ? a - lo : a + alen > lo + len ? a + alen - (lo + len) : 0;
  const dx = shift(prev.x, prev.w, box.x, box.w), dy = shift(prev.y, prev.h, box.y, box.h);
  return dx || dy ? { ...prev, x: prev.x + dx, y: prev.y + dy } : prev;
}

export const lerpBox = (a: Box, b: Box, t: number): Box =>
  ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, w: a.w + (b.w - a.w) * t, h: a.h + (b.h - a.h) * t });

export const parseBox = (s: string): Box => {
  const [x, y, w, h] = s.split(/[\s,]+/).map(Number);
  return { x, y, w, h };
};

export const boxString = (b: Box) => `${b.x.toFixed(1)} ${b.y.toFixed(1)} ${b.w.toFixed(1)} ${b.h.toFixed(1)}`;

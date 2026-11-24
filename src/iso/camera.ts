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
export interface Shot extends Box {
  focus?: Box;
  core?: Box;
  /**
   * The focus starts with header labels (a table's lit row and column heads). When it cannot be read
   * whole at the lens floor, the camera stays at the floor and keeps its top, cropping far rows rather
   * than the headers.
   */
  headed?: boolean;
  /** The lit cells themselves: the core without the headers. A headed crop never leaves them out. */
  lit?: Box;
  /** The strip under the drawing, if any: a crop shows it whole or not at all (`clearStrip`). */
  strip?: Box;
  /** False when the step draws no pointer flags, so `roomFor` leaves no flag room above it. */
  flags?: boolean;
}

/**
 * A crop that cuts through the strip shows a sliver of clipped tiles, which reads as a bug. Take the
 * strip in whole when that stays at or above the lens floor. Else move the view's bottom up to the
 * strip's top (the chevron says it is there): lift it at the same scale, or, where lifting would show
 * empty floor above the drawing, shrink it upward (reading closer, up to `lens.read`), so the top and
 * its headers stay and far rows crop. Moving up never loses anything above, so this is judged only
 * by the lit cells (`Shot.lit`, else the core): they stay in view, or the view is left as it was.
 */
export function clearStrip(v: Box, shot: Shot, W: number, H: number, lens: Lens): Box {
  const st = shot.strip;
  if (!st || !(W > 0 && H > 0)) return v;
  const bottom = v.y + v.h, end = st.y + st.h;
  if (st.y >= bottom || end <= bottom || st.y < v.y) return v;
  const h = end - v.y, s = H / h;
  if (s >= lens.floor) {
    const w = W / s;
    return { x: v.x + v.w / 2 - w / 2, y: v.y, w, h };
  }
  const lit = shot.lit ?? shot.core ?? shot.focus;
  let out: Box = { ...v, y: st.y - v.h };
  const room = st.y - shot.y;
  if (out.y < shot.y && room > 0 && H / room <= lens.read) {
    const w = (W * room) / H, cx = v.x + v.w / 2 - w / 2;
    out = { x: lit ? clamp(cx, lit.x + lit.w - w, lit.x) : cx, y: shot.y, w, h: room };
  }
  /* The whole lit box, top and bottom (and both sides, if the view shrank), must stay in. */
  const keeps = !lit || (lit.y >= out.y && lit.y + lit.h <= out.y + out.h
    && (out.w === v.w || (lit.x >= out.x && lit.x + lit.w <= out.x + out.w)));
  return keeps ? out : v;
}

/**
 * Where a headed view `h` tall starts: at the focus top, so the headers show, unless the lit cells
 * would then fall below it (plus `m`); then the view drops to keep them and the headers give way.
 */
export function headedTop(f: Box, lit: Box | undefined, h: number, m = 0): number {
  if (!lit || lit.y + lit.h + m <= f.y + h) return f.y;
  return lit.h + 2 * m > h ? lit.y + lit.h / 2 - h / 2 : lit.y + lit.h + m - h;
}

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
 * `lens.read` (or as close to it as keeps the whole focus in view, or as far as fits a whole axis
 * of the drawing at a readable scale), centred on the focus
 * and kept inside the drawing so no empty floor shows.
 */
export function aim(shot: Shot, W: number, H: number, maxScale: number, lens?: Lens): Box {
  const whole = frame(shot, W, H, maxScale);
  if (!lens || !(W > 0 && H > 0) || W / whole.w >= lens.floor) return whole;
  const f = focusFor(shot, W, H, lens);
  /* Read at `lens.read`, but the focus always fits whole: a spread-out focus pulls the zoom back,
     though never further than fitting the whole drawing would. */
  const fit = Math.min(lens.read, W / f.w, H / f.h);
  /* A headed focus too tall for the floor keeps the floor scale and its top (see `Shot.headed`). */
  const top = !!shot.headed && fit < lens.floor;
  let s = Math.min(maxScale, Math.max(W / whole.w, top ? Math.min(lens.read, lens.floor) : fit));
  /* When one whole axis of the drawing reads at or above the floor, read at that scale rather than
     closer: a 1x crop of a drawing a little wider than the stage cuts one side while the clamp shows
     stale rows or floor on the other. */
  const axis = Math.max(W / shot.w, H / shot.h);
  if (axis >= lens.floor && axis < s) s = axis;
  const w = W / s, h = H / s;
  /* A close-up that barely beats the whole picture is not worth hiding the rest for. */
  if (s < (W / whole.w) * CROP_GAIN) return whole;
  return clearStrip({
    x: clamp(f.x + f.w / 2 - w / 2, shot.x, shot.x + shot.w - w),
    y: clamp(top && f.h > h ? headedTop(f, shot.lit, h) : f.y + f.h / 2 - h / 2, shot.y, shot.y + shot.h - h),
    w, h
  }, shot, W, H, lens);
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
  /* A headed focus taller than the view keeps its top in view, unless that drops the lit cells. */
  if (shot.headed && need.h > prev.h) { need.y = headedTop(need, shot.lit, prev.h, m); need.h = prev.h; }
  /* Move the least that brings `need` into view; centre it when it is bigger than the view. */
  const shift = (lo: number, len: number, a: number, alen: number) =>
    alen > len ? a + alen / 2 - (lo + len / 2) : a < lo ? a - lo : a + alen > lo + len ? a + alen - (lo + len) : 0;
  let x = prev.x + shift(prev.x, prev.w, need.x, need.w), y = prev.y + shift(prev.y, prev.h, need.y, need.h);
  if (cropped) { x = clamp(x, shot.x, shot.x + shot.w - prev.w); y = clamp(y, shot.y, shot.y + shot.h - prev.h); }
  const next = x !== prev.x || y !== prev.y ? { ...prev, x, y } : prev;
  return lens && cropped ? clearStrip(next, shot, W, H, lens) : next;
}

export const lerpBox = (a: Box, b: Box, t: number): Box =>
  ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, w: a.w + (b.w - a.w) * t, h: a.h + (b.h - a.h) * t });

export const parseBox = (s: string): Box => {
  const [x, y, w, h] = s.split(/[\s,]+/).map(Number);
  return { x, y, w, h };
};

export const boxString = (b: Box) => `${b.x.toFixed(1)} ${b.y.toFixed(1)} ${b.w.toFixed(1)} ${b.h.toFixed(1)}`;

/** How far a pointer flag reaches above the point it names, in scene units at 1x. */
export const FLAG_REACH = 48;
/** How far a tag or label reaches past the measured drawing on the other sides, at 1x. */
export const TAG_REACH = 16;

/**
 * The drawing with room for its labels once they grow: on the lens stage, text and flags scale by
 * `px` (scene units per screen pixel) when the camera zooms out, so they reach past the bounds
 * SceneFit measured at 1x. Flags hang above their points, so the top gets the most room, but only
 * on a step that has flags (`Shot.flags`): a flagless step is not shrunk for room it never uses.
 * The strip gets no room above: its flags hang into the gap over it, and a crop hides them anyway.
 * This room is for fitting only; crop cues judge the drawing itself.
 */
export function roomFor(shot: Shot, px: number): Shot {
  if (!(px > 1)) return shot;
  const side = TAG_REACH * (px - 1), top = shot.flags === false ? side : FLAG_REACH * (px - 1);
  const grow = (b: Box, t = top): Box => ({ x: b.x - side, y: b.y - t, w: b.w + 2 * side, h: b.h + t + side });
  return {
    ...shot,
    ...grow(shot),
    ...(shot.focus && { focus: grow(shot.focus) }),
    ...(shot.core && { core: grow(shot.core) }),
    ...(shot.lit && { lit: grow(shot.lit) }),
    ...(shot.strip && { strip: grow(shot.strip, 0) }),
  };
}

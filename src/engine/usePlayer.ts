import { useCallback, useEffect, useRef, useState } from "react";

const STEP_MS = 2800;
export const SPEEDS = [0.5, 1, 2] as const;
export type Speed = (typeof SPEEDS)[number];

/** Step player. The current index is owned by the caller (the URL), this adds autoplay on top.
 *  Play moves one step at once, then keeps going until the last step. */
export function usePlayer(last: number, idx: number, setIdx: (i: number) => void) {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);
  const idxRef = useRef(idx);
  idxRef.current = idx;
  const ms = STEP_MS / speed;

  const go = useCallback((i: number) => setIdx(Math.max(0, Math.min(last, i))), [last, setIdx]);

  /* One timer per step, so a speed change or a manual move restarts the countdown cleanly. */
  useEffect(() => {
    if (!playing) return undefined;
    if (idx >= last) { setPlaying(false); return undefined; }
    const t = setTimeout(() => setIdx(idxRef.current + 1), ms);
    return () => clearTimeout(t);
  }, [playing, idx, last, ms, setIdx]);

  const stop = useCallback(() => setPlaying(false), []);
  const toggle = useCallback(() => {
    if (playing) { setPlaying(false); return; }
    go(idxRef.current >= last ? 0 : idxRef.current + 1);
    setPlaying(true);
  }, [playing, last, go]);
  const cycleSpeed = useCallback(() => setSpeed((s) => SPEEDS[(SPEEDS.indexOf(s) + 1) % SPEEDS.length]), []);
  const back = useCallback(() => { setPlaying(false); go(idxRef.current - 1); }, [go]);
  const next = useCallback(() => { setPlaying(false); go(idxRef.current >= last ? 0 : idxRef.current + 1); }, [go, last]);
  const reset = useCallback(() => { setPlaying(false); go(0); }, [go]);
  const jump = useCallback((i: number) => { setPlaying(false); go(i); }, [go]);

  return { playing, speed, ms, toggle, cycleSpeed, back, next, reset, jump, stop };
}

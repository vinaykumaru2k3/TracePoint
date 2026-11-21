import { useCallback, useEffect, useRef, useState } from "react";

const STEP_MS = 2800;

/** Step player. The current index is owned by the caller (the URL), this adds autoplay on top. */
export function usePlayer(last: number, idx: number, setIdx: (i: number) => void) {
  const [playing, setPlaying] = useState(false);
  const idxRef = useRef(idx);
  idxRef.current = idx;

  const go = useCallback((i: number) => setIdx(Math.max(0, Math.min(last, i))), [last, setIdx]);

  useEffect(() => {
    if (!playing) return undefined;
    const t = setInterval(() => {
      if (idxRef.current >= last) { setPlaying(false); return; }
      setIdx(idxRef.current + 1);
    }, STEP_MS);
    return () => clearInterval(t);
  }, [playing, last, setIdx]);

  const stop = useCallback(() => setPlaying(false), []);
  const toggle = useCallback(() => {
    if (playing) { setPlaying(false); return; }
    if (idxRef.current >= last) setIdx(0);
    setPlaying(true);
  }, [playing, last, setIdx]);
  const back = useCallback(() => { setPlaying(false); go(idxRef.current - 1); }, [go]);
  const next = useCallback(() => { setPlaying(false); go(idxRef.current >= last ? 0 : idxRef.current + 1); }, [go, last]);
  const reset = useCallback(() => { setPlaying(false); go(0); }, [go]);
  const jump = useCallback((i: number) => { setPlaying(false); go(i); }, [go]);

  return { playing, toggle, back, next, reset, jump, stop };
}

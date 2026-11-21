import { useLayoutEffect, useRef, useState } from "react";

/**
 * Items that disappeared since the last render, kept for `ms` so a leave animation can play.
 * Items need a stable numeric `id`.
 */
export function useGhosts<T extends { id: number }>(live: T[], ms = 520): (T & { seq: number })[] {
  const [ghosts, setGhosts] = useState<(T & { seq: number })[]>([]);
  const prev = useRef(new Map<number, T>());
  const seq = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useLayoutEffect(() => {
    const now = new Map(live.map((b) => [b.id, b]));
    const gone = [...prev.current.values()].filter((b) => !now.has(b.id)).map((b) => ({ ...b, seq: ++seq.current }));
    prev.current = now;
    if (!gone.length) return;
    setGhosts((gs) => gs.filter((g) => !gone.some((n) => n.id === g.id)).concat(gone));
    const seqs = gone.map((n) => n.seq);
    timers.current.push(setTimeout(() => setGhosts((gs) => gs.filter((g) => !seqs.includes(g.seq))), ms));
  }, [live, ms]);

  useLayoutEffect(() => () => timers.current.forEach(clearTimeout), []);

  const liveIds = new Set(live.map((b) => b.id));
  return ghosts.filter((g) => !liveIds.has(g.id));
}

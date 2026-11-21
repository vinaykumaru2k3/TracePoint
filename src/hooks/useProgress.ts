import { useCallback, useState } from "react";

const KEY = "tracepoint-progress";

export type Progress = Record<string, number>;

function load(): Progress {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(KEY) || "{}");
    if (!raw || typeof raw !== "object") return {};
    return Object.fromEntries(Object.entries(raw).filter(([, v]) => typeof v === "number" && v >= 0)) as Progress;
  } catch { return {}; }
}

/** Furthest step reached per lesson (0-based), saved per viewer. Same storage key as the prototype. */
export function useProgress(): [Progress, (id: string, idx: number) => void] {
  const [progress, setProgress] = useState<Progress>(load);

  const visit = useCallback((id: string, idx: number) => {
    setProgress((p) => {
      if (idx <= (p[id] ?? 0) && id in p) return p;
      const next = { ...p, [id]: Math.max(idx, p[id] ?? 0) };
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  return [progress, visit];
}

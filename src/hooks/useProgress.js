import { useCallback, useState } from "react";
import { LESSON_IDS } from "../data/lessons.js";
import { STEPS } from "../engine/steps.js";

const KEY = "tracepoint-progress";

function load() {
  const progress = Object.fromEntries(LESSON_IDS.map((id) => [id, 0]));
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "{}");
    LESSON_IDS.forEach((id) => {
      if (typeof raw[id] === "number") progress[id] = Math.max(0, Math.min(raw[id], STEPS[id].length - 1));
    });
  } catch (e) { /* ignore */ }
  return progress;
}

/** Furthest step reached per lesson, saved per viewer. */
export function useProgress() {
  const [progress, setProgress] = useState(load);

  const visit = useCallback((id, idx) => {
    setProgress((p) => {
      if (idx <= p[id]) return p;
      const next = { ...p, [id]: idx };
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch (e) { /* ignore */ }
      return next;
    });
  }, []);

  return [progress, visit];
}

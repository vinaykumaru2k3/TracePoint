import { useCallback, useState } from "react";

/**
 * Whether the desktop EXPLORER column is open, kept per kind of page: the trace view starts with it
 * folded so the stage gets the width, reading pages (guides, theory tabs) start with it open.
 * A manual toggle is remembered per kind in localStorage.
 */
export type ExplorerKind = "trace" | "read";
export type ExplorerPrefs = Record<ExplorerKind, boolean>;

export const EXPLORER_KEY = "tracepoint-explorer";
export const DEFAULT_EXPLORER: ExplorerPrefs = { trace: false, read: true };

/** Parses the stored value, keeping the default for anything missing or malformed. */
export function parseExplorer(raw: string | null | undefined): ExplorerPrefs {
  const out = { ...DEFAULT_EXPLORER };
  if (!raw) return out;
  try {
    const v: unknown = JSON.parse(raw);
    if (v && typeof v === "object") {
      for (const k of ["trace", "read"] as const) {
        const b = (v as Record<string, unknown>)[k];
        if (typeof b === "boolean") out[k] = b;
      }
    }
  } catch { /* malformed: keep the defaults */ }
  return out;
}

function load(): ExplorerPrefs {
  try { return parseExplorer(localStorage.getItem(EXPLORER_KEY)); } catch { return { ...DEFAULT_EXPLORER }; }
}

/** Returns [prefs, set(kind, open)]. */
export function useExplorer(): [ExplorerPrefs, (kind: ExplorerKind, open: boolean) => void] {
  const [prefs, setPrefs] = useState(load);
  const set = useCallback((kind: ExplorerKind, open: boolean) => {
    setPrefs((p) => {
      const next = { ...p, [kind]: open };
      try { localStorage.setItem(EXPLORER_KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
      return next;
    });
  }, []);
  return [prefs, set];
}

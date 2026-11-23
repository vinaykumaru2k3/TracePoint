import { useCallback, useState } from "react";

/** A remembered yes/no in localStorage: "1" is true, "0" is false, anything else (or a throw) is the fallback. */
export function readFlag(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    return v === "1" ? true : v === "0" ? false : fallback;
  } catch { return fallback; }
}

export function useStoredFlag(key: string, fallback: boolean): [boolean, (v: boolean) => void] {
  const [value, setValue] = useState(() => readFlag(key, fallback));
  const set = useCallback((v: boolean) => {
    setValue(v);
    try { localStorage.setItem(key, v ? "1" : "0"); } catch { /* private mode: keep it for this visit */ }
  }, [key]);
  return [value, set];
}

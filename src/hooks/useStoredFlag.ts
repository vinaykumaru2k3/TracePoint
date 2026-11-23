import { useCallback, useEffect, useState } from "react";

export const TIP_KEY = "tracepoint-tip-seen";
export const KEYS_SEEN_KEY = "tracepoint-keys-seen";
const FLAG_EVENT = "tracepoint-flag";

/** A remembered yes/no in localStorage: "1" is true, "0" is false, anything else (or a throw) is the fallback. */
export function readFlag(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    return v === "1" ? true : v === "0" ? false : fallback;
  } catch { return fallback; }
}

function writeFlag(key: string, v: boolean) {
  try { localStorage.setItem(key, v ? "1" : "0"); } catch { /* private mode: keep it for this visit */ }
}

/** The storage event only reaches other tabs, so a write also announces itself here for instances with the same key. */
function announce(key: string, value: boolean) {
  if (typeof window === "undefined" || typeof window.dispatchEvent !== "function") return;
  window.dispatchEvent(new CustomEvent(FLAG_EVENT, { detail: { key, value } }));
}

/** Shows the first-visit tips again: the key legend and the trace tip. */
export function resetTips(): void {
  for (const key of [KEYS_SEEN_KEY, TIP_KEY]) { writeFlag(key, false); announce(key, false); }
}

export function useStoredFlag(key: string, fallback: boolean): [boolean, (v: boolean) => void] {
  const [value, setValue] = useState(() => readFlag(key, fallback));
  const set = useCallback((v: boolean) => {
    setValue(v);
    writeFlag(key, v);
    announce(key, v);
  }, [key]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onFlag = (e: Event) => {
      const d = (e as CustomEvent<{ key: string; value: boolean }>).detail;
      if (d && d.key === key) setValue(d.value);
    };
    const onStorage = (e: StorageEvent) => { if (e.key === key) setValue(readFlag(key, fallback)); };
    window.addEventListener(FLAG_EVENT, onFlag);
    window.addEventListener("storage", onStorage);
    return () => { window.removeEventListener(FLAG_EVENT, onFlag); window.removeEventListener("storage", onStorage); };
  }, [key, fallback]);
  return [value, set];
}

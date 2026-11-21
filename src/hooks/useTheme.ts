import { useCallback, useEffect, useState } from "react";

const KEY = "tracepoint-theme";
const root = () => document.documentElement;

/** Apply the saved theme before first paint. Call once from main.tsx. */
export function applySavedTheme() {
  try {
    const t = localStorage.getItem(KEY);
    if (t === "dark" || t === "light") root().setAttribute("data-theme", t);
  } catch { /* storage unavailable */ }
}

/** Returns [isDark, toggle]. Follows prefers-color-scheme until the viewer picks a theme. */
export function useTheme(): [boolean, () => void] {
  const [pref, setPref] = useState(() => root().getAttribute("data-theme"));
  const [systemDark, setSystemDark] = useState(() => !!window.matchMedia?.("(prefers-color-scheme: dark)").matches);

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return undefined;
    const on = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const dark = pref === "dark" || pref === "light" ? pref === "dark" : systemDark;

  const toggle = useCallback(() => {
    const next = dark ? "light" : "dark";
    root().setAttribute("data-theme", next);
    try { localStorage.setItem(KEY, next); } catch { /* ignore */ }
    setPref(next);
  }, [dark]);

  return [dark, toggle];
}

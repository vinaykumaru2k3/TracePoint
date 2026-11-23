import { useCallback, useEffect, useState } from "react";

const KEY = "tracepoint-theme";
const root = () => document.documentElement;

const metas = () => Array.from(document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]'));

/** The [light, dark] theme-color contents: an explicit theme paints both with its own --bg, "system" restores the originals. */
export function themeMetaColors(pref: string | null, bg: string, original: { light: string; dark: string }): [string, string] {
  return pref === "dark" || pref === "light" ? [bg, bg] : [original.light, original.dark];
}

const originals: { light?: string; dark?: string } = {};

/** Keep the theme-color metas in step with the resolved theme, so the browser chrome matches data-theme. */
function syncThemeColor() {
  const [light, dark] = ["light", "dark"].map((m) => metas().find((e) => e.media.includes(m)));
  if (!light || !dark) return;
  originals.light ??= light.content;
  originals.dark ??= dark.content;
  const bg = getComputedStyle(root()).getPropertyValue("--bg").trim();
  const [l, d] = themeMetaColors(root().getAttribute("data-theme"), bg, { light: originals.light, dark: originals.dark });
  light.content = l;
  dark.content = d;
}

/** Apply the saved theme before first paint. Call once from main.tsx. */
export function applySavedTheme() {
  try {
    const t = localStorage.getItem(KEY);
    if (t === "dark" || t === "light") root().setAttribute("data-theme", t);
  } catch { /* storage unavailable */ }
  syncThemeColor();
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

  useEffect(syncThemeColor, [pref]);

  const dark = pref === "dark" || pref === "light" ? pref === "dark" : systemDark;

  const toggle = useCallback(() => {
    const next = dark ? "light" : "dark";
    root().setAttribute("data-theme", next);
    try { localStorage.setItem(KEY, next); } catch { /* ignore */ }
    setPref(next);
  }, [dark]);

  return [dark, toggle];
}

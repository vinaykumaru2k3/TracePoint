import { useCallback, useState } from "react";
import type { Lang } from "../engine/types";

const KEY = "tracepoint-lang";
const isLang = (v: unknown): v is Lang => v === "java" || v === "python" || v === "cpp";

/** The selected code tab, remembered across lessons and visits. */
export function useLang(): [Lang, (l: Lang) => void] {
  const [lang, setLang] = useState<Lang>(() => {
    try { const v = localStorage.getItem(KEY); return isLang(v) ? v : "java"; } catch { return "java"; }
  });
  const set = useCallback((l: Lang) => {
    setLang(l);
    try { localStorage.setItem(KEY, l); } catch { /* ignore */ }
  }, []);
  return [lang, set];
}

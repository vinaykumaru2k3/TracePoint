import { useEffect, useRef } from "react";

interface Keys { prev(): void; next(): void; toggle(): void; reset(): void }

/** Arrow keys step, Space plays, R resets. Ignored while typing in a field or with a modifier held. */
export function useKeyboard(keys: Keys) {
  const ref = useRef(keys);
  ref.current = keys;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      const typing = !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
      if (typing) return;
      if (e.key === "ArrowRight") { ref.current.next(); e.preventDefault(); }
      else if (e.key === "ArrowLeft") { ref.current.prev(); e.preventDefault(); }
      else if (e.key === "r" || e.key === "R") ref.current.reset();
      else if (e.key === " " && !(t && (t.tagName === "BUTTON" || t.tagName === "A"))) { ref.current.toggle(); e.preventDefault(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
}

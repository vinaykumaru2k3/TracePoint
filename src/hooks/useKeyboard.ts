import { useEffect, useRef } from "react";

export interface Keys { prev(): void; next(): void; first(): void; last(): void; toggle(): void; reset(): void }

/**
 * Arrow keys step, Home and End jump, Space plays, R resets.
 * Ignored while typing, with a modifier held, inside a dialog, or where a widget owns the arrows (tabs).
 * Space on a button the viewer reached with the keyboard still presses that button; after a mouse
 * click (no focus ring) Space means play, so it never re-presses the last clicked control.
 */
export function makeKeyHandler(k: Keys, enabled: boolean): (e: KeyboardEvent) => void {
  return (e) => {
    if (!enabled) return;
    if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
    const t = typeof HTMLElement !== "undefined" && e.target instanceof HTMLElement ? e.target : null;
    if (t && (t.matches("input, textarea, select, [contenteditable]") || t.isContentEditable)) return;
    if (t?.closest("dialog, [popover], [role='tablist']")) return;
    /* Home and End keep scrolling the code box, and the page on narrow screens, unless focus is on the lesson controls. */
    if ((e.key === "Home" || e.key === "End") && (t?.closest(".code")
      || (window.matchMedia?.("(max-width: 1120px), (max-height: 680px)").matches && !t?.closest(".stagecard, .rail-wrap, .explain, .lesson-head")))) return;
    if (e.key === "ArrowRight") { k.next(); e.preventDefault(); }
    else if (e.key === "ArrowLeft") { k.prev(); e.preventDefault(); }
    else if (e.key === "Home") { k.first(); e.preventDefault(); }
    else if (e.key === "End") { k.last(); e.preventDefault(); }
    else if (e.key === "r" || e.key === "R") k.reset();
    else if (e.key === " ") {
      const keyboardFocus = !!t && t.matches("button, a, summary") && t.matches(":focus-visible");
      if (keyboardFocus) return;
      k.toggle();
      e.preventDefault();
    }
  };
}

/** The handler is live only while `enabled` (the trace view); the theory view leaves the keys alone. */
export function useKeyboard(keys: Keys, enabled = true) {
  const ref = useRef({ keys, enabled });
  ref.current = { keys, enabled };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => makeKeyHandler(ref.current.keys, ref.current.enabled)(e);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
}

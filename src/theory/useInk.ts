import { useEffect, type RefObject } from "react";

/** Where a mark is drawn: once its top passes 85% of the viewport height. */
const LINE = 0.85;

/**
 * Draws the reading marks (key phrases and struck wrong forms) under `root` as the reader reaches them.
 * Marks already on screen, and every mark under reduced motion or without IntersectionObserver, stay drawn:
 * only marks below the reading line are held back (`data-ink="wait"`) and released once each.
 * Reaching the end of the scroll releases the rest, so marks near the bottom never stay undrawn.
 */
export function useInk(root: RefObject<HTMLElement | null>, key: unknown) {
  useEffect(() => {
    const el = root.current;
    if (!el || typeof IntersectionObserver === "undefined" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const marks = [...el.querySelectorAll<HTMLElement>("strong, s.wrong")];
    const waiting = new Set(marks.filter((m) => m.getBoundingClientRect().top > innerHeight * LINE));
    const draw = (m: Element) => {
      if (!waiting.delete(m as HTMLElement)) return;
      (m as HTMLElement).dataset.ink = "on";
      io.unobserve(m);
    };
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && draw(e.target)),
      { rootMargin: `0px 0px -${Math.round((1 - LINE) * 100)}% 0px` }
    );
    waiting.forEach((m) => { m.dataset.ink = "wait"; io.observe(m); });
    const onScroll = (e: Event) => {
      const s = e.target instanceof Element ? e.target : document.scrollingElement;
      if (s && s.contains(el) && s.scrollTop + s.clientHeight >= s.scrollHeight - 4) [...waiting].forEach(draw);
    };
    addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => {
      io.disconnect();
      removeEventListener("scroll", onScroll, { capture: true });
      marks.forEach((m) => { delete m.dataset.ink; });
    };
  }, [root, key]);
}

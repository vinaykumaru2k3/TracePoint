import { useEffect, type RefObject } from "react";

/** Names the tab, bookmarks and history entries after what is on screen. */
export function usePageTitle(title: string) {
  useEffect(() => { document.title = title; }, [title]);
}

/* The page last focused, shared by every page so the very first load keeps focus where the browser put it. */
let lastPage: string | null = null;

/** When the page changes (a new lesson, tab or guide, not a new step), focus its heading so a screen reader starts there. */
export function usePageFocus(ref: RefObject<HTMLElement | null>, page: string) {
  useEffect(() => {
    if (lastPage === page) return;
    const first = lastPage === null;
    lastPage = page;
    if (!first) ref.current?.focus({ preventScroll: true });
  }, [ref, page]);
}

/** Test hook: forget the last page so each test starts as a first load. */
export function resetPageFocus() { lastPage = null; }

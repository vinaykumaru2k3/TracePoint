import { useEffect, useRef, useState, type ReactNode } from "react";
import type { AnyLesson } from "../engine/types";

/* One lazy import per lesson folder, so each lesson is its own chunk. The folder name is the lesson id. */
const MODULES = import.meta.glob<{ default: AnyLesson }>("./*/index.ts");

const cache = new Map<string, AnyLesson>();
const pending = new Map<string, Promise<AnyLesson>>();

const folderOf = (path: string) => path.split("/")[1];
type Loaders = Record<string, () => Promise<{ default: AnyLesson }>>;
const REAL_LOADERS: Loaders = Object.fromEntries(Object.entries(MODULES).map(([p, load]) => [folderOf(p), load]));
let LOADERS: Loaders = REAL_LOADERS;

/** Tests only: swap the loader map (pass nothing to restore the real one). */
export function setLoadersForTest(map?: Loaders): void { LOADERS = map ?? REAL_LOADERS; pending.clear(); }

/** Fetches a lesson's chunk (once) and caches it. An unknown id rejects. */
export function loadLesson(id: string): Promise<AnyLesson> {
  const hit = cache.get(id);
  if (hit) return Promise.resolve(hit);
  const load = LOADERS[id];
  if (!load) return Promise.reject(new Error(`No lesson called ${id}`));
  let p = pending.get(id);
  if (!p) {
    p = load().then((m) => { cache.set(id, m.default); return m.default; }).finally(() => { pending.delete(id); });
    pending.set(id, p);
  }
  return p;
}

/** The lesson if it is already loaded. */
export const peekLesson = (id: string): AnyLesson | undefined => cache.get(id);

/** Tests fill the cache so a render needs no network. */
export function primeLessons(ls: AnyLesson[]): void { for (const l of ls) cache.set(l.id, l); }
export function clearLessons(): void { cache.clear(); pending.clear(); }

/** The lesson, or null while it loads. A failed load throws during render, so the route's ErrorBoundary shows it. */
export function useLesson(id: string): AnyLesson | null {
  const [, tick] = useState(0);
  const [failed, setFailed] = useState<{ id: string; error: Error } | null>(null);
  /* Whether the render that scheduled the effect already had the lesson, so a cached mount does not render twice. */
  const hadLesson = useRef(false);
  hadLesson.current = cache.has(id);
  useEffect(() => {
    /* Another consumer may have filled the cache after this render returned null: re-render to pick it up. */
    if (cache.has(id)) { if (!hadLesson.current) tick((n) => n + 1); return; }
    let live = true;
    loadLesson(id).then(
      () => { if (live) tick((n) => n + 1); },
      (e: unknown) => { if (live) setFailed({ id, error: e instanceof Error ? e : new Error(String(e)) }); }
    );
    return () => { live = false; };
  }, [id]);
  if (failed && failed.id === id) throw failed.error;
  return cache.get(id) ?? null;
}

/** Renders `children(lesson)` once the lesson is loaded and `fallback` until then. */
export function LazyLesson({ id, fallback, children }: { id: string; fallback: ReactNode; children(l: AnyLesson): ReactNode }) {
  const l = useLesson(id);
  return <>{l ? children(l) : fallback}</>;
}

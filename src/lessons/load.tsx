import { useEffect, useState, type ReactNode } from "react";
import type { AnyLesson } from "../engine/types";

/* One lazy import per lesson folder, so each lesson is its own chunk. The folder name is the lesson id. */
const MODULES = import.meta.glob<{ default: AnyLesson }>("./*/index.ts");

const cache = new Map<string, AnyLesson>();
const pending = new Map<string, Promise<AnyLesson>>();

const folderOf = (path: string) => path.split("/")[1];
const LOADERS: Record<string, () => Promise<{ default: AnyLesson }>> =
  Object.fromEntries(Object.entries(MODULES).map(([p, load]) => [folderOf(p), load]));

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
  useEffect(() => {
    if (cache.has(id)) return;
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

/* A tiny hook runner for tests, since the repo has no DOM renderer. Mock "react" with `hooks` and render with `mount`. */
type Slot = unknown;
let slots: Slot[] = [];
let at = 0;
let effects: (() => void)[] = [];
let rerender: () => void = () => {};

export const hooks = {
  useState<T>(init: T | (() => T)) {
    const i = at++;
    if (!(i in slots)) slots[i] = typeof init === "function" ? (init as () => T)() : init;
    const set = (v: T | ((p: T) => T)) => { slots[i] = typeof v === "function" ? (v as (p: T) => T)(slots[i] as T) : v; rerender(); };
    return [slots[i] as T, set] as const;
  },
  useMemo<T>(f: () => T) { const i = at++; if (!(i in slots)) slots[i] = f(); return slots[i] as T; },
  useCallback<T>(f: T) { return f; },
  useRef<T>(v: T) { const i = at++; if (!(i in slots)) slots[i] = { current: v }; return slots[i] as { current: T }; },
  useEffect(f: () => void) { at++; effects.push(f); }
};

/** Renders `fn` with hooks, runs its effects, and re-renders after each state change. `out()` is the latest result. */
export function mount<R>(fn: () => R) {
  slots = []; let result!: R;
  const run = () => { at = 0; effects = []; result = fn(); const fx = effects; fx.forEach((f) => f()); };
  rerender = run; run();
  return { out: () => result, update: (next: () => R) => { fn = next; run(); } };
}

/** Every element in a React element tree (not expanding components), depth first. */
export function walk(node: unknown, out: { type: unknown; props: Record<string, unknown> }[] = []) {
  if (Array.isArray(node)) node.forEach((n) => walk(n, out));
  else if (node && typeof node === "object" && "props" in node) {
    const el = node as { type: unknown; props: Record<string, unknown> };
    out.push(el); walk(el.props.children, out);
  }
  return out;
}
export const text = (node: unknown): string => Array.isArray(node) ? node.map(text).join("") : typeof node === "string" || typeof node === "number" ? String(node)
  : node && typeof node === "object" && "props" in node ? text((node as { props: { children?: unknown } }).props.children) : "";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetTips } from "./useStoredFlag";

describe("resetTips", () => {
  const store: Record<string, string> = {};
  const win = new EventTarget();
  beforeEach(() => {
    for (const k of Object.keys(store)) delete store[k];
    vi.stubGlobal("window", win);
    vi.stubGlobal("CustomEvent", class extends Event { detail: unknown; constructor(t: string, i?: { detail?: unknown }) { super(t); this.detail = i?.detail; } });
    vi.stubGlobal("localStorage", { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => { store[k] = v; } });
  });
  afterEach(() => { vi.unstubAllGlobals(); });

  it("writes 0 to the tip, key and intro flags and announces each in this tab", () => {
    const seen: { key: string; value: boolean }[] = [];
    win.addEventListener("tracepoint-flag", (e) => seen.push((e as CustomEvent).detail));
    resetTips();
    expect(store["tracepoint-keys-seen"]).toBe("0");
    expect(store["tracepoint-tip-seen"]).toBe("0");
    expect(store["tracepoint-intro-hidden"]).toBe("0");
    expect(seen.map((s) => s.key).sort()).toEqual(["tracepoint-intro-hidden", "tracepoint-keys-seen", "tracepoint-tip-seen"]);
    expect(seen.every((s) => s.value === false)).toBe(true);
  });
});

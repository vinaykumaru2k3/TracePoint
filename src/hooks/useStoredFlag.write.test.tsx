import { afterEach, describe, expect, it, vi } from "vitest";
import { mount } from "../test/hookHarness";

vi.mock("react", async () => ({ ...(await vi.importActual<object>("react")), ...(await import("../test/hookHarness")).hooks }));
const { useStoredFlag } = await import("./useStoredFlag");

describe("useStoredFlag when storage refuses writes", () => {
  afterEach(() => { vi.unstubAllGlobals(); });
  it("keeps the new value for the visit", () => {
    vi.stubGlobal("localStorage", { getItem: () => null, setItem() { throw new Error("quota"); } });
    const m = mount(() => useStoredFlag("k", false));
    expect(m.out()[0]).toBe(false);
    m.out()[1](true);
    expect(m.out()[0]).toBe(true);
  });
});

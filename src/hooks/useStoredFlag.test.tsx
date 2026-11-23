import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { useStoredFlag } from "./useStoredFlag";

function Probe({ k, fb }: { k: string; fb: boolean }) {
  const [v] = useStoredFlag(k, fb);
  return <i>{String(v)}</i>;
}
const out = (fb: boolean) => renderToStaticMarkup(<Probe k="k" fb={fb} />);
const store = (get: (k: string) => string | null) => vi.stubGlobal("localStorage", { getItem: get, setItem() {} });

describe("useStoredFlag", () => {
  afterEach(() => { vi.unstubAllGlobals(); });
  it("returns the fallback when the key is missing", () => {
    store(() => null);
    expect(out(true)).toBe("<i>true</i>");
    expect(out(false)).toBe("<i>false</i>");
  });
  it("returns the fallback when getItem throws", () => {
    store(() => { throw new Error("blocked"); });
    expect(out(true)).toBe("<i>true</i>");
    expect(out(false)).toBe("<i>false</i>");
  });
  it("reads 1 as true and 0 as false", () => {
    store(() => "1");
    expect(out(false)).toBe("<i>true</i>");
    store(() => "0");
    expect(out(true)).toBe("<i>false</i>");
  });
});

import { describe, expect, it, vi } from "vitest";
import { makeKeyHandler, type Keys } from "./useKeyboard";

const keys = () => ({ prev: vi.fn(), next: vi.fn(), first: vi.fn(), last: vi.fn(), toggle: vi.fn(), reset: vi.fn(), onStep: vi.fn() }) satisfies Keys;
const press = (k: Keys, key: string) =>
  makeKeyHandler(k, true)({ key, metaKey: false, ctrlKey: false, altKey: false, defaultPrevented: false, target: null, preventDefault() {} } as unknown as KeyboardEvent);

describe("onStep", () => {
  it("is called when the learner steps with a key", () => {
    for (const key of ["ArrowRight", "ArrowLeft"]) {
      const k = keys();
      press(k, key);
      expect(k.onStep).toHaveBeenCalledTimes(1);
    }
  });
  it("is not called for keys that do not step", () => {
    const k = keys();
    for (const key of ["r", "f", " ", "a"]) press(k, key);
    expect(k.onStep).not.toHaveBeenCalled();
  });
});

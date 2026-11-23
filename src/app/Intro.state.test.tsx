import { beforeEach, describe, expect, it, vi } from "vitest";
import { peekLesson } from "../lessons/load";
import { mount, text, walk } from "../test/hookHarness";

vi.mock("react", async () => ({ ...(await vi.importActual<object>("react")), ...(await import("../test/hookHarness")).hooks }));

const { default: Intro, MiniTrace, dedent } = await import("./Intro");
const { useTip } = await import("../hooks/useTip");

let data: Record<string, string>;
beforeEach(() => {
  data = {};
  vi.stubGlobal("localStorage", { getItem: (k: string) => data[k] ?? null, setItem: (k: string, v: string) => { data[k] = v; } });
});
const button = (tree: unknown, label: string) => walk(tree).find((e) => e.type === "button" && (e.props["aria-label"] === label || text(e) === label))!;
const click = (b: { props: Record<string, unknown> }) => (b.props.onClick as () => void)();

describe("Intro persistence", () => {
  it("Hide stores the flag and removes the intro", () => {
    const m = mount(() => Intro({ progress: {} }));
    expect(m.out()).not.toBeNull();
    click(button(m.out(), "Hide"));
    expect(data["tracepoint-intro-hidden"]).toBe("1");
    expect(m.out()).toBeNull();
  });
});

describe("trace tip persistence", () => {
  it("Dismiss tip stores the flag", () => {
    const m = mount(() => useTip(0));
    expect(m.out().showTip).toBe(true);
    m.out().dismissTip();
    expect(data["tracepoint-tip-seen"]).toBe("1");
    expect(m.out().showTip).toBe(false);
  });
  it("stays unwritten on steps 1 and 2", () => {
    mount(() => useTip(1));
    expect(data["tracepoint-tip-seen"]).toBeUndefined();
  });
  it("reaching step 3 stores the flag", () => {
    const m = mount(() => useTip(1));
    m.update(() => useTip(2));
    expect(data["tracepoint-tip-seen"]).toBe("1");
    expect(m.out().showTip).toBe(false);
  });
});

describe("mini-trace", () => {
  it("is quiet on mount and announces after Next", () => {
    const m = mount(() => MiniTrace({ lesson: peekLesson("stack")! }));
    const live = () => text(walk(m.out()).find((e) => e.props["aria-live"] === "polite"));
    expect(text(m.out())).toContain("Step 1 of 3");
    expect(live()).toBe("");
    click(button(m.out(), "Next"));
    expect(text(m.out())).toContain("Step 2 of 3");
    expect(live()).toMatch(/^Step 2 of 3\. /);
  });
});

describe("dedent", () => {
  it("keeps relative indentation", () => {
    expect(dedent(["    void f() {", "      x;", "    }"])).toBe("void f() {\n  x;\n}");
  });
});

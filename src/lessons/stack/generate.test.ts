import { describe, expect, it } from "vitest";
import { parseOps } from "../parseOps";
import { generateStack } from "./generate";

const run = (text: string) => {
  const r = parseOps(text, "push", ["pop", "peek"]);
  if (!r.ok) throw new Error(r.error);
  return generateStack(r.input);
};

describe("stack generator", () => {
  it("starts with a problem step and ends with a recap", () => {
    const s = run("push 1 pop");
    expect(s[0].kind).toBe("problem");
    expect(s[s.length - 1].kind).toBe("recap");
    expect(s).toHaveLength(4);
  });

  it("pops in last-in-first-out order", () => {
    const s = run("push 4 push 9 push 2 pop pop pop");
    const popped = s.filter((x) => x.op === "pop()").map((x) => x.ret);
    expect(popped).toEqual(["2", "9", "4"]);
  });

  it("keeps top and items consistent", () => {
    for (const st of run("push 4 push 9 peek pop push 7 pop pop pop")) {
      expect(st.state.top).toBe(st.state.items.length - 1);
    }
  });

  it("flags an overwritten stale slot", () => {
    const s = run("push 4 pop push 7");
    expect(s.some((x) => x.state.overwrote)).toBe(true);
  });

  it("throws on pop and peek of an empty stack, and on a full push", () => {
    expect(run("pop")[1]).toMatchObject({ kind: "empty", ret: "throws" });
    expect(run("peek")[1]).toMatchObject({ kind: "empty", ret: "throws" });
    const full = run("push 1 push 2 push 3 push 4 push 5 push 6 push 7");
    expect(full[7]).toMatchObject({ kind: "empty", ret: "throws" });
    expect(full[7].state.items).toHaveLength(6);
  });

  it("peek does not change the stack", () => {
    const s = run("push 5 peek");
    expect(s[2].state.items).toEqual(s[1].state.items);
    expect(s[2].ret).toBe("5");
  });
});

describe("parseOps", () => {
  it("rejects unknown names, missing values and too many ops", () => {
    expect(parseOps("jump", "push", ["pop"]).ok).toBe(false);
    expect(parseOps("push", "push", ["pop"]).ok).toBe(false);
    expect(parseOps("push 500", "push", ["pop"]).ok).toBe(false);
    expect(parseOps("", "push", ["pop"]).ok).toBe(false);
    expect(parseOps("pop ".repeat(17), "push", ["pop"]).ok).toBe(false);
  });
  it("accepts call syntax and aliases", () => {
    const r = parseOps("enq(4), deq()", "offer", ["poll"], { enq: "offer", deq: "poll" });
    expect(r).toEqual({ ok: true, input: [{ name: "offer", v: 4 }, { name: "poll" }] });
  });
});

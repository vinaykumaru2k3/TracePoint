import { describe, expect, it } from "vitest";
import lesson from ".";
import { at, run } from "../testkit";
import type { DPState } from "../dpkit";

const rowsOf = (s: { state: DPState }) => (s.state.kind === "grid" ? s.state.grid.map((r) => r.map((c) => c.v)) : []);
const statesOf = (s: { state: DPState }) => (s.state.kind === "grid" ? s.state.grid.map((r) => r.map((c) => c.state)) : []);
const num = (bits: unknown[]) => parseInt(bits.join(""), 2);
const one = (text: string) => run(lesson, text);
/** The result step of a single-op run (step 1, after the problem step). */
const result = (text: string) => {
  const steps = one(text);
  const last = at(steps, -2);
  return { steps, last, ret: last.ret };
};

describe("bit-manipulation generator", () => {
  it("computes the six brief values on 8 bit rows, bit 7 on the left", () => {
    const cases: [string, number][] = [["13 & 6", 4], ["13 | 6", 15], ["13 ^ 6", 11], ["13 << 1", 26], ["13 >> 2", 3]];
    for (const [text, want] of cases) {
      const { steps, last } = result(text);
      expect(steps.length, text).toBe(3);
      expect(last.ret, text).toBe(String(want));
      const rows = rowsOf(last);
      expect(rows[0]).toHaveLength(8);
      expect(num(at(rows, -1)), text).toBe(want);
    }
    expect(num(rowsOf(result("13 & 6").last)[0])).toBe(13);
    expect(num(rowsOf(result("13 & 6").last)[1])).toBe(6);
    const s = result("13 & 6").last;
    if (s.state.kind === "grid") expect(s.state.colHead).toEqual(["7", "6", "5", "4", "3", "2", "1", "0"]);
  });

  it("marks the bits that decide a binary op", () => {
    const { last } = result("13 & 6");
    const st = statesOf(last);
    expect(st[2][5]).toBe("active"); // result bit 2
    expect(st[0][5]).toBe("compare");
    expect(st[1][5]).toBe("compare");
    expect(st.flat().filter((x) => x === "active").length).toBe(1);
  });

  it("count 13 = 3 in 3 clearing steps with n & (n - 1)", () => {
    const steps = one("count 13");
    const clears = steps.filter((s) => s.op?.startsWith("clear bit"));
    expect(clears.length).toBe(3);
    expect(clears.map((s) => s.op)).toEqual(["clear bit 0", "clear bit 2", "clear bit 3"]);
    expect(clears.map((s) => num(at(rowsOf(s), -1)))).toEqual([12, 8, 0]);
    expect(clears.every((s) => s.anchors.includes("bit.clear"))).toBe(true);
    expect(at(steps, -2).ret).toBe("3");
    expect(at(steps, -2).kind).toBe("found");
  });

  it("count 0 has no clearing steps and count 255 has 8", () => {
    expect(one("count 0").filter((s) => s.op?.startsWith("clear bit")).length).toBe(0);
    expect(at(one("count 0"), -2).ret).toBe("0");
    expect(one("count 255").filter((s) => s.op?.startsWith("clear bit")).length).toBe(8);
    expect(at(one("count 255"), -2).ret).toBe("8");
  });

  it("pow2 16 is true and pow2 12 and pow2 0 are false", () => {
    const yes = result("pow2 16"), no = result("pow2 12"), zero = result("pow2 0"), all = result("pow2 255");
    expect(yes.ret).toBe("true");
    expect(num(at(rowsOf(yes.last), -1))).toBe(0);
    expect(no.ret).toBe("false");
    expect(num(at(rowsOf(no.last), -1))).toBe(8);
    expect(zero.ret).toBe("false");
    expect(all.ret).toBe("false");
    expect(yes.steps.length).toBe(3);
  });

  it("200 << 1 = 144 and the step says which bit dropped off the left", () => {
    const { last } = result("200 << 1");
    expect(last.ret).toBe("144");
    expect(num(at(rowsOf(last), -1))).toBe(144);
    expect(last.text).toMatch(/bit 7/);
    expect(last.text).toMatch(/dropp/);
    expect(statesOf(last)[0][0]).toBe("swap");
    expect(last.anchors).toContain("bit.shl");
    expect(result("13 >> 2").last.text).toMatch(/bit 0/);
    expect(result("1 << 3").last.text).not.toMatch(/dropp/);
  });

  it("matches JavaScript for every op over a sweep of values", () => {
    const vals = [0, 1, 2, 5, 12, 13, 64, 127, 128, 200, 254, 255];
    for (const a of vals) for (const b of vals) {
      expect(result(`${a} & ${b}`).ret).toBe(String(a & b));
      expect(result(`${a} | ${b}`).ret).toBe(String(a | b));
      expect(result(`${a} ^ ${b}`).ret).toBe(String(a ^ b));
    }
    for (const a of vals) for (let k = 0; k <= 7; k++) {
      expect(result(`${a} << ${k}`).ret).toBe(String((a << k) & 0xff));
      expect(result(`${a} >> ${k}`).ret).toBe(String(a >> k));
    }
    for (const a of vals) {
      expect(result(`count ${a}`).ret).toBe(String(a.toString(2).replace(/0/g, "").length));
      expect(result(`pow2 ${a}`).ret).toBe(String(a > 0 && (a & (a - 1)) === 0));
    }
  });

  it("default run: 7 ops, about 40 steps or fewer, problem first and recap last", () => {
    const steps = run(lesson, lesson.defaultText);
    expect(lesson.defaultText).toBe("13 & 6, 13 | 6, 13 ^ 6, 13 << 1, 13 >> 2, count 13, pow2 16");
    expect(steps.length).toBeLessThanOrEqual(40);
    expect(steps[0].kind).toBe("problem");
    expect(at(steps, -1).kind).toBe("recap");
  });

  it("worst accepted input stays within 80 steps", () => {
    const worst = Array(7).fill("count 255").join(", ");
    const steps = run(lesson, worst);
    expect(steps.length).toBeLessThanOrEqual(80);
    expect(steps.length).toBe(2 + 7 * 9);
  });

  it("every op fits the rail or has a short, and neighbours differ", () => {
    const texts = ["255 & 255", "255 | 255", "255 ^ 255", "255 << 7", "255 >> 7", "count 255", "pow2 255", "255 & 255, 255 & 255, 255 & 255",
      "count 255, count 255", "pow2 255, pow2 255", "count 0, count 0"];
    for (const t of texts) {
      const steps = run(lesson, t);
      steps.forEach((s, i) => {
        expect(s.op === null || s.op.length <= 14 || s.short !== undefined, `${t} / ${s.op}`).toBe(true);
        if (s.short !== undefined) expect(s.short.length).toBeLessThanOrEqual(14);
        const name = (x: typeof s) => x.short ?? x.op;
        if (i > 0 && s.op) expect(name(s), `${t} step ${i}`).not.toBe(name(steps[i - 1]));
      });
    }
  });

  it("rejects bad input with a sentence", () => {
    const bad = ["", "13 & ", "256 & 1", "13 << 8", "13 << -1", "13 % 6", "count", "count 300", "pow2 -3", "foo",
      Array(8).fill("count 1").join(", ")];
    for (const t of bad) {
      const r = lesson.parse(t);
      expect(r.ok, t).toBe(false);
      if (!r.ok) expect(r.error.length).toBeGreaterThan(20);
    }
    const r = lesson.parse("13 << 8");
    if (!r.ok) expect(r.error).toMatch(/0 to 7/);
    expect(lesson.parse("13&6,13<<1\n count 5").ok).toBe(true);
  });
});

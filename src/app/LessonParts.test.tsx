import { describe, expect, it } from "vitest";
import { resultLabel, shownMetrics } from "./LessonParts";
import { LESSONS } from "../lessons";

describe("the result box and the metrics line", () => {
  it("labels a return op once: `answer`, never `return 2 returns`", () => {
    expect(resultLabel("return 2", true)).toBe("answer");
    expect(resultLabel("return -1", true)).toBe("answer");
    expect(resultLabel("push(4)", true)).toBe("push(4) returns");
    expect(resultLabel("returnAll()", true)).toBe("returnAll() returns");
  });
  it("keeps a mid-run return's own label; only the recap reads `answer`", () => {
    expect(resultLabel("return 1", false)).toBe("return 1 returns");
    const label = (id: string) => {
      const l = LESSONS.find((x) => x.id === id)!;
      const r = l.parse(l.defaultText);
      if (!r.ok) throw new Error(r.error);
      return l.generate(r.input).map((s) => (s.op && s.ret !== undefined ? resultLabel(s.op, s.kind === "recap") : null));
    };
    const cs = label("call-stack").filter(Boolean);
    expect(cs.slice(0, -1).some((x: string | null) => x === "answer")).toBe(false);
    expect(cs.some((x: string | null) => /^return \d+ returns$/.test(x!))).toBe(true);
    const lcs = label("lcs");
    expect(lcs[lcs.length - 1]).toBe("answer");
  });
  it("hides metrics with no value", () => {
    const m = [{ label: "Row", value: "-" }, { label: "Column", value: "" }, { label: "Cells done", value: 24 }, { label: "Top", value: 0 }];
    expect(shownMetrics(m).map((x) => x.label)).toEqual(["Cells done", "Top"]);
  });
});

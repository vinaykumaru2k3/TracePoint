import { describe, expect, it } from "vitest";
import { resultLabel, shownMetrics } from "./LessonParts";

describe("the result box and the metrics line", () => {
  it("labels a return op once: `answer`, never `return 2 returns`", () => {
    expect(resultLabel("return 2")).toBe("answer");
    expect(resultLabel("return -1")).toBe("answer");
    expect(resultLabel("push(4)")).toBe("push(4) returns");
    expect(resultLabel("returnAll()")).toBe("returnAll() returns");
  });
  it("hides metrics with no value", () => {
    const m = [{ label: "Row", value: "-" }, { label: "Column", value: "" }, { label: "Cells done", value: 24 }, { label: "Top", value: 0 }];
    expect(shownMetrics(m).map((x) => x.label)).toEqual(["Cells done", "Top"]);
  });
});

import { describe, expect, it } from "vitest";
import lesson from ".";
import { rets, run } from "../testkit";
import { runOpOf, stepName } from "../../engine/stepName";
import { generateMst } from "./generate";

describe("kruskal and prim generator", () => {
  it("both find the tree of cost 11", () => {
    const steps = run(lesson, lesson.defaultText);
    expect(rets(steps, "kruskal")).toEqual(["11 [AC, BC, DE, BD]"]);
    expect(rets(steps, "prim")).toEqual(["11 [AC, BC, BD, DE]"]);
  });

  it("skips edges that would close a loop", () => {
    const steps = run(lesson, lesson.defaultText);
    expect(steps.filter((s) => s.anchors.includes("kr.skip")).map((s) => s.notes["kr.skip"])).toEqual(["skip AB"]);
    expect(steps.filter((s) => s.anchors.includes("pr.skip")).map((s) => s.notes["pr.pop"])).toEqual(["AB:4"]);
  });

  it("ends with a forest when the graph is in pieces", () => {
    const steps = run(lesson, "A-B 1, B-C 2, A-C 3, D-E 4");
    expect(rets(steps, "kruskal")).toEqual(["7 [AB, BC, DE], forest of 2"]);
    expect(rets(steps, "prim")).toEqual(["3 [AB, BC], spans 3 of 5"]);
  });

  it("keeps runs short", () => {
    expect(run(lesson, lesson.defaultText).length).toBeLessThanOrEqual(40);
    expect(run(lesson, "A-B 9, A-C 8, A-D 7, A-E 6, A-F 5, A-G 4, A-H 3, B-C 1, C-D 1, D-E 1, E-F 1, F-G 1").length).toBeLessThanOrEqual(80);
  });
  it("names every stop on its own, never by the run's op", () => {
    for (const text of [lesson.defaultText, ...lesson.presets.map((p) => p.text)]) {
      const steps = run(lesson, text);
      const names = steps.map((_, i) => stepName(steps, i, runOpOf(steps)));
      for (const [i, s] of steps.entries()) {
        expect(names[i]).not.toBe(s.op);
        expect(names[i].length).toBeLessThanOrEqual(24);
        if (i > 0) expect(names[i]).not.toBe(names[i - 1]);
      }
    }
    const steps = run(lesson, lesson.defaultText);
    expect(steps.map((s) => s.short).filter((x) => x?.startsWith("add "))).toContain("add D (B-D 5)");
  });
  it("keeps names short and neighbours distinct with long names and parallel edges", () => {
    const check = (steps: ReturnType<typeof generateMst>) => {
      const names = steps.map((_, i) => stepName(steps, i, runOpOf(steps)));
      for (const [i, nm] of names.entries()) {
        expect(nm.length, nm).toBeLessThanOrEqual(24);
        if (i > 0) expect(nm, `step ${i + 1}`).not.toBe(names[i - 1]);
      }
      return names;
    };
    /* Parallel A-B edges: two skips in a row for each algorithm. */
    const par = check(generateMst({
      nodes: ["A", "B", "C", "D"], start: "A", directed: false,
      edges: [{ u: "A", v: "B", w: 1 }, { u: "A", v: "B", w: 2 }, { u: "A", v: "B", w: 3 }, { u: "B", v: "C", w: 8 }, { u: "C", v: "D", w: 9 }],
    }));
    expect(par.filter((x) => x.startsWith("skip A-B: loop"))).toHaveLength(2);
    expect(par.filter((x) => x.startsWith("skip A-B: in tree"))).toHaveLength(2);
    /* Long names: the weight goes first, then the name is cut. */
    const long = check(generateMst({
      nodes: ["Amsterdam", "Brussels", "Constantinople", "Dubrovnik"], start: "Amsterdam", directed: false,
      edges: [{ u: "Amsterdam", v: "Brussels", w: 12 }, { u: "Brussels", v: "Constantinople", w: 3 }, { u: "Constantinople", v: "Dubrovnik", w: 4 }],
    }));
    expect(long).toContain("take Amsterdam-Brussels");
    expect(long.some((x) => x.startsWith("take Brussels-Constanti") && x.length === 24)).toBe(true);
  });
});

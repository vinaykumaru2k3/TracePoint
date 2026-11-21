import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LESSONS } from ".";

/* The memory strip and the drawing must tell the same story: a highlighted memory cell uses a
   colour that the scene also uses on the same step. */
const TONES = ["active", "compare", "found", "visited"] as const;

describe("memory strip colours match the scene", () => {
  for (const lesson of LESSONS) {
    it(lesson.id, () => {
      const texts = [lesson.defaultText, ...lesson.presets.map((p) => p.text)];
      const bad: string[] = [];
      for (const text of texts) {
        const r = lesson.parse(text);
        if (!r.ok) continue;
        lesson.generate(r.input).forEach((step, i) => {
          const cells = lesson.memory(step).cells.filter((c) => c.act);
          if (!cells.length) return;
          const html = renderToStaticMarkup(<lesson.Scene step={step} />);
          const inScene = TONES.filter((t) => html.includes(`s-${t}`));
          const inMemory = [...new Set(cells.map((c) => c.tone ?? "active"))];
          /* A removal draws the leaving item only as an animation, so a scene with no state colour is not a conflict. */
          if (inScene.length && !inMemory.some((t) => inScene.includes(t))) bad.push(`"${text}" step ${i + 1} (${step.op}): memory ${inMemory} vs scene ${inScene.join(",") || "none"}`);
        });
      }
      expect(bad).toEqual([]);
    });
  }
});

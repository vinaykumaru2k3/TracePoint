import { describe, expect, it } from "vitest";
import { LESSONS } from "./index";

/** Every flag a graph lesson pins on a node or a strip tile, over its default run and presets. */
function flags(id: string): Set<string> {
  const l = LESSONS.find((x) => x.id === id)!;
  const out = new Set<string>();
  for (const text of [l.defaultText, ...(l.presets ?? []).map((p: { text: string }) => p.text)]) {
    const parsed = l.parse(text);
    if (!parsed.ok) continue;
    for (const step of l.generate(parsed.input)) {
      const s = step.state as { ptrs?: { label: string }[]; strip?: { ptrs?: { label: string }[] } };
      for (const p of [...(s.ptrs ?? []), ...(s.strip?.ptrs ?? [])]) out.add(p.label);
    }
  }
  return out;
}

describe("graph flags are words a beginner reads at once", () => {
  const graphs = LESSONS.filter((l) => l.section === "graphs").map((l) => l.id);
  it("covers the graph lessons", () => expect(graphs).toContain("dijkstra"));
  it.each(graphs)("%s", (id) => {
    expect(flags(id).size, id).toBeGreaterThan(0);
    for (const f of flags(id)) {
      expect(f, id).toMatch(/^[a-z]{2,8}$/);
      expect(["s", "u", "v", "x", "y", "ra", "rb", "min"], id).not.toContain(f);
    }
  });
});

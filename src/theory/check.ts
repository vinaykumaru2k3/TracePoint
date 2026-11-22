import { parseInline } from "./inline";
import type { Guide, Inline, LessonTheory } from "./types";

const BANNED = ["simply", "obviously", "clearly", "just", "trivial", "trivially", "easy"];

/** Plain prose with code spans replaced by one placeholder word, links reduced to their label and struck text unwrapped. */
function prose(text: Inline): string {
  return parseInline(text)
    .map((k) => (k.t === "code" ? "code" : k.t === "link" ? k.label || k.target : k.t === "strike" ? prose(k.v) : k.v))
    .join("");
}

const wordCount = (s: string) => s.split(/\s+/).filter(Boolean).length;

function sentences(text: Inline): string[] {
  return prose(text).split(/[.?:](?=\s|$)/).filter((s) => wordCount(s) > 0);
}

export function checkText(text: Inline, where: string, links: Set<string>): string[] {
  const errs: string[] = [];
  const tokens = parseInline(text);
  const p = prose(text);
  if (wordCount(p) > 80) errs.push(`${where}: paragraph over 80 words`);
  for (const s of sentences(text)) {
    if (wordCount(s) > 25) errs.push(`${where}: sentence over 25 words`);
  }
  const outside = tokens.map((k) => (k.t === "code" ? " " : k.t === "link" ? k.label : k.v)).join("");
  for (const w of BANNED) {
    if (new RegExp(`\\b${w}\\b`, "i").test(outside)) errs.push(`${where}: banned word "${w}"`);
  }
  if (outside.includes("!")) errs.push(`${where}: exclamation mark`);
  for (const k of tokens) {
    if (k.t === "link" && !links.has(k.target)) errs.push(`${where}: unknown link "${k.target}"`);
  }
  return errs;
}

const atLeast = (n: number, have: number, name: string, where: string) =>
  have < n ? [`${where} ${name}: need at least ${n}, have ${have}`] : [];

export function checkGuide(g: Guide, liveIds: string[], links: Set<string>): string[] {
  const w = `guide ${g.section}`;
  const e: string[] = [];
  const text = (t: Inline, at: string) => e.push(...checkText(t, `${w} ${at}`, links));
  text(g.tagline, "tagline");
  if (sentences(g.tagline).length !== 1) e.push(`${w} tagline: must be one sentence`);
  if (g.core.length < 1 || g.core.length > 3) e.push(`${w} core: need 1 to 3 paragraphs, have ${g.core.length}`);
  g.core.forEach((p, i) => text(p, `core[${i}]`));
  text(g.analogy, "analogy");
  e.push(...atLeast(1, g.prereqs.length, "prereqs", w));
  g.prereqs.forEach((p, i) => text(p, `prereqs[${i}]`));
  e.push(...atLeast(4, g.terms.length, "terms", w));
  g.terms.forEach(([t, m], i) => { text(t, `terms[${i}] term`); text(m, `terms[${i}]`); });
  g.cheat.head.forEach((h, i) => text(h, `cheat head[${i}]`));
  e.push(...atLeast(3, g.cheat.rows.length, "cheat rows", w));
  g.cheat.rows.forEach((r, i) => {
    if (r.length !== g.cheat.head.length) e.push(`${w}: cheat row ${i} has ${r.length} cells, head has ${g.cheat.head.length}`);
    r.forEach((c, j) => text(c, `cheat[${i}][${j}]`));
  });
  e.push(...atLeast(3, g.patterns.length, "patterns", w));
  g.patterns.forEach(([s, m], i) => { text(s, `patterns[${i}] signal`); text(m, `patterns[${i}] move`); });
  e.push(...atLeast(3, g.tips.length, "tips", w));
  g.tips.forEach((t, i) => text(t, `tips[${i}]`));
  e.push(...atLeast(2, g.cases.length, "cases", w));
  g.cases.forEach((c, i) => {
    text(c.title, `cases[${i}] title`);
    text(c.setting, `cases[${i}] setting`);
    text(c.idea, `cases[${i}] idea`);
    text(c.why, `cases[${i}] why`);
  });
  const keys = Object.keys(g.hooks);
  const missing = liveIds.filter((id) => !keys.includes(id));
  const extra = keys.filter((id) => !liveIds.includes(id));
  if (missing.length) e.push(`${w} hooks: missing ${missing.join(", ")}`);
  if (extra.length) e.push(`${w} hooks: extra ${extra.join(", ")}`);
  keys.forEach((k) => text(g.hooks[k], `hooks.${k}`));
  return e;
}

export function checkTheory(t: LessonTheory, where: string, links: Set<string>): string[] {
  const e: string[] = [];
  const text = (s: Inline, at: string) => e.push(...checkText(s, `${where} ${at}`, links));
  text(t.definition, "definition");
  if (sentences(t.definition).length > 2) e.push(`${where} definition: over 2 sentences`);
  text(t.analogy, "analogy");
  e.push(...atLeast(3, t.steps.length, "steps", where));
  t.steps.forEach((s, i) => text(s, `steps[${i}]`));
  (t.ops ?? []).forEach((r, i) => {
    if (r.length !== 3) e.push(`${where} ops: row ${i} has ${r.length} cells, need 3`);
    r.forEach((c, j) => text(c, `ops[${i}][${j}]`));
  });
  e.push(...atLeast(2, t.useWhen.length, "useWhen", where));
  t.useWhen.forEach((s, i) => text(s, `useWhen[${i}]`));
  e.push(...atLeast(2, t.avoidWhen.length, "avoidWhen", where));
  t.avoidWhen.forEach((s, i) => text(s, `avoidWhen[${i}]`));
  if (t.example.length < 2 || t.example.length > 6) e.push(`${where} example: need 2 to 6 lines, have ${t.example.length}`);
  t.example.forEach((s, i) => text(s, `example[${i}]`));
  e.push(...atLeast(2, t.pitfalls.length, "pitfalls", where));
  t.pitfalls.forEach((s, i) => text(s, `pitfalls[${i}]`));
  return e;
}

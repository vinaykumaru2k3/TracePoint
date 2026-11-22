/** Inline text. May contain `code`, **bold**, ~~struck wrong form~~, [[target]] or [[target|label]]. */
export type Inline = string;

export interface Guide {
  /** Curriculum section id. */
  section: string;
  tagline: Inline;
  /** 1-3 paragraphs. */
  core: Inline[];
  analogy: Inline;
  prereqs: Inline[];
  terms: [term: string, meaning: Inline][];
  cheat: { head: string[]; rows: Inline[][] };
  patterns: [signal: Inline, move: Inline][];
  tips: Inline[];
  cases: { title: string; setting: Inline; idea: Inline; why: Inline }[];
  /** Lesson id -> one-line hook. */
  hooks: Record<string, Inline>;
}

export interface LessonTheory {
  definition: Inline;
  analogy: Inline;
  steps: Inline[];
  /** For each step, the 1-based trace step of the default run that shows it. Same length as `steps`. */
  shots: number[];
  ops?: [op: Inline, cost: Inline, note: Inline][];
  useWhen: Inline[];
  avoidWhen: Inline[];
  example: Inline[];
  pitfalls: Inline[];
}

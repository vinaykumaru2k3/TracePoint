import type { ComponentType } from "react";
import type { LessonTheory } from "../theory/types";

export type Lang = "java" | "python" | "cpp";
export const LANGS: { id: Lang; label: string }[] = [
  { id: "java", label: "Java" },
  { id: "python", label: "Python" },
  { id: "cpp", label: "C++" }
];

/** What a step is about. The kind chip uses it, and cycle 2 can build "predict the next step" from it. */
export type StepKind = "problem" | "add" | "remove" | "peek" | "empty" | "check" | "move" | "found" | "recap";

export interface Step<S> {
  kind: StepKind;
  title: string;
  /** Plain explanation of this step. */
  text: string;
  /** The single idea to take away. */
  idea: string;
  /** The call being made, e.g. "push(4)". Null for problem and recap steps. */
  op: string | null;
  /** A shorter name for the step rail, when several ops would truncate to the same text. */
  short?: string;
  /** Anchor names (from the code files) that run in this step. Never line numbers. */
  anchors: string[];
  /** Per-anchor trace text with real values. */
  notes: Record<string, string>;
  /** Everything the scene needs to draw this step. */
  state: S;
  /** What the call returns: a value, "void", "null" or "throws". */
  ret?: string;
  retNote?: string;
}

export interface Metric { label: string; value: string | number }

/** One memory cell. `tag` replaces the default "[i]" label, e.g. a node address "@3".
 *  `tone` colours an active cell like the matching scene state (default amber "active"). */
export type Tone = "active" | "compare" | "found" | "visited";
/** `tone` colours the cell only when `act` is set; without one an active cell is amber. */
export interface MemoryCell { v: number | string | null; live: boolean; act: boolean; marks: string[]; tag?: string; tone?: Tone }
/** The memory tone for a scene state, so a highlighted cell uses the same colour as the drawing. */
export const toneOf = (state?: string | null): Tone | undefined =>
  state === "found" || state === "compare" || state === "visited" ? state : undefined;
export interface MemoryView { title: string; cells: MemoryCell[]; note: string }

export type ParseResult<I> = { ok: true; input: I } | { ok: false; error: string };

export interface Preset { label: string; text: string }

export interface Lesson<I, S> {
  id: string;
  title: string;
  subtitle: string;
  minutes: number;
  level: "beginner" | "intermediate" | "advanced";
  /** Curriculum section id. */
  section: string;

  /** Text the learner can edit to re-run the simulation. */
  inputLabel: string;
  inputHint: string;
  defaultText: string;
  presets: Preset[];
  parse(text: string): ParseResult<I>;

  /** Pure simulation: one snapshot per step, starting with a problem step and ending with a recap. */
  generate(input: I): Step<S>[];

  Scene: ComponentType<{ step: Step<S> }>;
  legend: { cls: string; label: string }[];
  metrics(step: Step<S>): Metric[];
  memory(step: Step<S>): MemoryView;
  /** Live variables shown in the code card header. */
  vars(step: Step<S>): string;
  costs: [string, string][];
  learn: [string, (s: Step<S>) => boolean][];

  /** Readable guide shown on the lesson's theory tab. */
  theory?: LessonTheory;

  /** Raw source per language, with `@a name` anchor comments. */
  code: Record<Lang, string>;
}

// The registry holds lessons with different input and state types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyLesson = Lesson<any, any>;
export type AnyStep = Step<unknown>;

export function defineLesson<I, S>(l: Lesson<I, S>): AnyLesson {
  return l as AnyLesson;
}

export interface Item { id: number; v: number }

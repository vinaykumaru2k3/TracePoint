import { useMemo } from "react";
import type { AnyLesson } from "../engine/types";

/** The longest `?in=` that is parsed. A longer one is a link nobody typed, so it is not run. */
export const MAX_INPUT = 1000;

/** The run a URL asks for. A missing, too long or unparseable input falls back to the default run, with the reason.
 *  `input` is the parsed input of the run that will play, so it is parsed once. */
export function readAsked(lesson: Pick<AnyLesson, "parse" | "defaultText">, asked: string | null): { text: string; linkError: string; input: unknown } {
  const fallback = (linkError: string) => ({ text: lesson.defaultText, linkError, input: (lesson.parse(lesson.defaultText) as { input: unknown }).input });
  if (asked === null) return fallback("");
  if (asked.length > MAX_INPUT) return fallback("This link's input is too long to run, so the default run is shown.");
  const r = lesson.parse(asked);
  if (!r.ok) return fallback(`This link's input could not run, so the default run is shown. ${r.error}`);
  return { text: asked, linkError: "", input: r.input };
}

/** Furthest step reached in a custom run. A different input starts again from the step on screen. */
export function runMax(prev: { text: string; max: number }, text: string, idx: number): { text: string; max: number } {
  return prev.text === text ? { text, max: Math.max(prev.max, idx) } : { text, max: idx };
}

/** Everything the lesson page derives from the URL's input: the text that runs, the notice for a bad link, and the steps. */
export function useLessonRun(lesson: AnyLesson, asked: string | null) {
  const { text, linkError, input } = useMemo(() => readAsked(lesson, asked), [lesson, asked]);
  const steps = useMemo(() => lesson.generate(input), [lesson, input]);
  const isDefault = text === lesson.defaultText;
  /* A bad link keeps its raw input in the URL, so stepping and switching tabs do not lose the notice or the box's text.
     Only a link too long to keep falls back to the plain URL. */
  const keepAsked = linkError !== "" && asked !== null && asked.length <= MAX_INPUT;
  const query = keepAsked ? `?in=${encodeURIComponent(asked)}` : isDefault ? "" : `?in=${encodeURIComponent(text)}`;
  return { text, linkError, steps, query, isDefault };
}

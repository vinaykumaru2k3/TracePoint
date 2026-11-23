import { useMemo } from "react";
import type { AnyLesson } from "../engine/types";

/** The longest `?in=` that is parsed. A longer one is a link nobody typed, so it is not run. */
export const MAX_INPUT = 1000;

/** The run a URL asks for. A missing, too long or unparseable input falls back to the default run, with the reason. */
export function readAsked(lesson: Pick<AnyLesson, "parse" | "defaultText">, asked: string | null): { text: string; linkError: string } {
  if (asked === null) return { text: lesson.defaultText, linkError: "" };
  if (asked.length > MAX_INPUT) return { text: lesson.defaultText, linkError: "This link's input is too long to run, so the default run is shown." };
  const r = lesson.parse(asked);
  if (!r.ok) return { text: lesson.defaultText, linkError: `This link's input could not run, so the default run is shown. ${r.error}` };
  return { text: asked, linkError: "" };
}

/** Furthest step reached in a custom run. A different input starts again from the step on screen. */
export function runMax(prev: { text: string; max: number }, text: string, idx: number): { text: string; max: number } {
  return prev.text === text ? { text, max: Math.max(prev.max, idx) } : { text, max: idx };
}

/** Everything the lesson page derives from the URL's input: the text that runs, the notice for a bad link, and the steps. */
export function useLessonRun(lesson: AnyLesson, asked: string | null) {
  const { text, linkError } = useMemo(() => readAsked(lesson, asked), [lesson, asked]);
  const steps = useMemo(() => {
    const r = lesson.parse(text);
    return r.ok ? lesson.generate(r.input) : lesson.generate((lesson.parse(lesson.defaultText) as { input: unknown }).input);
  }, [lesson, text]);
  const isDefault = text === lesson.defaultText;
  const query = isDefault ? "" : `?in=${encodeURIComponent(text)}`;
  return { text, linkError, steps, query, isDefault };
}

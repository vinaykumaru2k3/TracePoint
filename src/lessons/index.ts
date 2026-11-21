import type { AnyLesson } from "../engine/types";
import stack from "./stack";
import queue from "./queue";

/** Playable lessons, in course order. Add a lesson here and it lights up in the course tree. */
export const LESSONS: AnyLesson[] = [stack, queue];

export const LESSON_BY_ID: Record<string, AnyLesson> = Object.fromEntries(LESSONS.map((l) => [l.id, l]));
export const DEFAULT_LESSON = LESSONS[0].id;

/** Steps in each lesson's default run. Progress counts a lesson as done once its last step was reached. */
export const DEFAULT_STEP_COUNT: Record<string, number> = Object.fromEntries(
  LESSONS.map((l) => {
    const r = l.parse(l.defaultText);
    return [l.id, r.ok ? l.generate(r.input).length : 1];
  })
);

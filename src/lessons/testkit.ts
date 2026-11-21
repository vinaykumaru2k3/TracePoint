import type { Lesson, Step } from "../engine/types";

/** Parse `text` with the lesson's own parser and generate its steps. Throws on a parse error. */
export function run<I, S>(lesson: Lesson<I, S>, text: string): Step<S>[] {
  const r = lesson.parse(text);
  if (!r.ok) throw new Error(r.error);
  return lesson.generate(r.input);
}

/** Array.at for the ES2020 lib: a negative index counts from the end. */
export const at = <T,>(a: T[], i: number): T => a[i < 0 ? a.length + i : i];

/** Return values of steps whose op starts with `prefix`, in order. */
export const rets = <S,>(steps: Step<S>[], prefix = "") =>
  steps.filter((s) => s.op?.startsWith(prefix) && s.ret !== undefined).map((s) => s.ret);

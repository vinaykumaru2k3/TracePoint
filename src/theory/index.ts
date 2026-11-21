import { LESSON_BY_ID } from "../lessons";
import type { Guide } from "./types";

/** One guide per section, keyed by section id. Filled in by the content tasks. */
export const GUIDES: Record<string, Guide> = {};

/** Every link target that resolves: live lesson ids and `guide:<id>` for each guide. */
export const linkIds = (): Set<string> =>
  new Set([...Object.keys(LESSON_BY_ID), ...Object.keys(GUIDES).map((k) => `guide:${k}`)]);

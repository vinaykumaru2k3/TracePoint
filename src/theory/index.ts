import { LESSON_BY_ID } from "../lessons";
import advanced from "./guides/advanced";
import dp from "./guides/dp";
import foundations from "./guides/foundations";
import graphs from "./guides/graphs";
import hashing from "./guides/hashing";
import linear from "./guides/linear";
import recursion from "./guides/recursion";
import sorting from "./guides/sorting";
import trees from "./guides/trees";
import tries from "./guides/tries";
import type { Guide } from "./types";

/** One guide per section, keyed by section id. Filled in by the content tasks. */
export const GUIDES: Record<string, Guide> = { foundations, linear, hashing, recursion, sorting, trees, tries, graphs, dp, advanced };

/** Every link target that resolves: live lesson ids and `guide:<id>` for each guide. */
export const linkIds = (): Set<string> =>
  new Set([...Object.keys(LESSON_BY_ID), ...Object.keys(GUIDES).map((k) => `guide:${k}`)]);

import { LESSONS, LESSON_IDS } from "../data/lessons.js";
import { buildSteps } from "./buildSteps.js";

export const STEPS = Object.fromEntries(LESSON_IDS.map((id) => [id, buildSteps(LESSONS[id])]));

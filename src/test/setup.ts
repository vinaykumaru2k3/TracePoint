import { LESSONS } from "../lessons";
import { primeLessons } from "../lessons/load";

/* App code loads lessons on demand; tests render synchronously, so start with every lesson cached. */
primeLessons(LESSONS);

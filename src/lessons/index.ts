import type { AnyLesson } from "../engine/types";
import bigO from "./big-o-by-counting";
import arrays from "./arrays";
import strings from "./strings";
import twoPointers from "./two-pointers";
import slidingWindow from "./sliding-window";
import prefixSums from "./prefix-sums";
import stack from "./stack";
import queue from "./queue";
import deque from "./deque";
import sll from "./singly-linked-list";
import dll from "./doubly-linked-list";
import fastSlow from "./fast-and-slow-pointers";
import chaining from "./hash-table-chaining";
import openAddressing from "./open-addressing";
import freqMap from "./frequency-map-and-two-sum";
import callStack from "./call-stack";
import backtracking from "./backtracking";
import nQueens from "./n-queens";
import linearSearch from "./linear-search";
import binarySearch from "./binary-search";
import bubbleSort from "./bubble-sort";
import selectionSort from "./selection-sort";
import insertionSort from "./insertion-sort";
import mergeSort from "./merge-sort";
import quickSort from "./quick-sort";
import countingSort from "./counting-sort";

/** Playable lessons, in course order. Add a lesson here and it lights up in the course tree. */
export const LESSONS: AnyLesson[] = [
  bigO, arrays, strings, twoPointers, slidingWindow, prefixSums,
  stack, queue, deque, sll, dll, fastSlow,
  chaining, openAddressing, freqMap,
  callStack, backtracking, nQueens,
  linearSearch, binarySearch, bubbleSort, selectionSort, insertionSort, mergeSort, quickSort, countingSort
];

export const LESSON_BY_ID: Record<string, AnyLesson> = Object.fromEntries(LESSONS.map((l) => [l.id, l]));
export const DEFAULT_LESSON = LESSONS[0].id;

/** Steps in each lesson's default run. Progress counts a lesson as done once its last step was reached. */
export const DEFAULT_STEP_COUNT: Record<string, number> = Object.fromEntries(
  LESSONS.map((l) => {
    const r = l.parse(l.defaultText);
    return [l.id, r.ok ? l.generate(r.input).length : 1];
  })
);

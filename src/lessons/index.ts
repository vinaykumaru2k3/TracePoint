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
import treeTraversals from "./tree-traversals";
import bst from "./bst";
import avlRotations from "./avl-rotations";
import binaryHeap from "./binary-heap";
import heapSort from "./heap-sort";
import trie from "./trie";
import autocomplete from "./autocomplete";
import representations from "./representations";
import bfs from "./bfs";
import dfs from "./dfs";
import topologicalSort from "./topological-sort";
import dijkstra from "./dijkstra";
import unionFind from "./union-find";
import kruskalAndPrim from "./kruskal-and-prim";
import fibonacci from "./fibonacci";
import climbingStairs from "./climbing-stairs";
import coinChange from "./coin-change";
import knapsack from "./knapsack";
import lcs from "./lcs";
import editDistance from "./edit-distance";
import bitManipulation from "./bit-manipulation";
import greedyIntervals from "./greedy-intervals";
import segmentTree from "./segment-tree";

/** Every lesson module, eagerly. Tests use it; app code reads `meta.ts` and loads lessons through `load.tsx`. Same order as `LESSON_META`. */
export const LESSONS: AnyLesson[] = [
  bigO, arrays, strings, twoPointers, slidingWindow, prefixSums,
  stack, queue, deque, sll, dll, fastSlow,
  chaining, openAddressing, freqMap,
  callStack, backtracking, nQueens,
  linearSearch, binarySearch, bubbleSort, selectionSort, insertionSort, mergeSort, quickSort, countingSort,
  treeTraversals,
  bst,
  avlRotations,
  binaryHeap,
  heapSort,
  trie,
  autocomplete,
  representations,
  bfs,
  dfs,
  topologicalSort,
  dijkstra,
  unionFind,
  kruskalAndPrim,
  fibonacci,
  climbingStairs,
  coinChange,
  knapsack,
  lcs,
  editDistance,
  bitManipulation,
  greedyIntervals,
  segmentTree
];

export const LESSON_BY_ID: Record<string, AnyLesson> = Object.fromEntries(LESSONS.map((l) => [l.id, l]));

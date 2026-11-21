export interface Section { id: string; n: string; name: string; color: string; lessons: { id: string; name: string }[] }

const L = (name: string, id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")) => ({ id, name });

/** The whole planned course. A lesson is playable once it is in lessons/index.ts; the rest show as "soon". */
export const CURRICULUM: Section[] = [
  { id: "foundations", n: "01", name: "Foundations", color: "var(--c-blue)", lessons: [
    L("Big-O by counting"), L("Arrays"), L("Strings"), L("Two pointers"), L("Sliding window"), L("Prefix sums")] },
  { id: "linear", n: "02", name: "Linear structures", color: "var(--c-green)", lessons: [
    L("Stack"), L("Queue"), L("Deque"), L("Singly linked list"), L("Doubly linked list"), L("Fast and slow pointers")] },
  { id: "hashing", n: "03", name: "Hashing", color: "var(--c-amber)", lessons: [
    L("Hash table: chaining"), L("Open addressing"), L("Frequency map and two-sum")] },
  { id: "recursion", n: "04", name: "Recursion", color: "var(--c-pink)", lessons: [
    L("Call stack"), L("Backtracking"), L("N-Queens")] },
  { id: "sorting", n: "05", name: "Searching and sorting", color: "var(--c-lav)", lessons: [
    L("Linear search"), L("Binary search"), L("Bubble sort"), L("Selection sort"), L("Insertion sort"),
    L("Merge sort"), L("Quick sort"), L("Counting sort")] },
  { id: "trees", n: "06", name: "Trees", color: "var(--c-green)", lessons: [
    L("Tree traversals"), L("BST"), L("AVL rotations"), L("Binary heap"), L("Heap sort")] },
  { id: "tries", n: "07", name: "Tries", color: "var(--c-blue)", lessons: [L("Trie"), L("Autocomplete")] },
  { id: "graphs", n: "08", name: "Graphs", color: "var(--c-amber)", lessons: [
    L("Representations"), L("BFS"), L("DFS"), L("Topological sort"), L("Dijkstra"), L("Union-Find"), L("Kruskal and Prim")] },
  { id: "dp", n: "09", name: "Dynamic programming", color: "var(--c-pink)", lessons: [
    L("Fibonacci"), L("Climbing stairs"), L("Coin change"), L("Knapsack"), L("LCS"), L("Edit distance")] },
  { id: "advanced", n: "10", name: "Advanced", color: "var(--c-lav)", lessons: [
    L("Bit manipulation"), L("Greedy intervals"), L("Segment tree")] }
];

export const sectionOf = (id: string) => CURRICULUM.find((s) => s.id === id);

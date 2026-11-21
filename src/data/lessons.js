const STACK_CODE = [
  "class ArrayStack {",
  "  private int[] data = new int[6];",
  "  private int top = -1;",
  "",
  "  void push(int x) {",
  "    if (top == data.length - 1)",
  "      throw new IllegalStateException();",
  "    data[++top] = x;",
  "  }",
  "",
  "  int pop() {",
  "    if (top == -1) throw new EmptyStackException();",
  "    return data[top--];",
  "  }",
  "",
  "  int peek() {",
  "    if (top == -1) throw new EmptyStackException();",
  "    return data[top];",
  "  }",
  "}"
];

const QUEUE_CODE = [
  "class ArrayQueue {",
  "  private int[] data = new int[4];",
  "  private int head = 0, size = 0;",
  "",
  "  void offer(int x) {",
  "    if (size == data.length)",
  "      throw new IllegalStateException();",
  "    data[(head + size) % data.length] = x;",
  "    size++;",
  "  }",
  "",
  "  Integer poll() {",
  "    if (size == 0) return null;",
  "    int x = data[head];",
  "    head = (head + 1) % data.length;",
  "    size--;",
  "    return x;",
  "  }",
  "",
  "  Integer peek() {",
  "    return size == 0 ? null : data[head];",
  "  }",
  "}"
];

export const LESSONS = {
  stack: {
    id: "stack", title: "Stack", kind: "stack", cap: 6, code: STACK_CODE, minutes: 4,
    sub: "Push, peek and pop on an array, and watch the top index move.",
    ops: [["push", 4], ["push", 9], ["push", 2], ["peek"], ["pop"], ["pop"], ["push", 7], ["pop"], ["pop"], ["pop"]],
    costs: [["push", "O(1)"], ["pop", "O(1)"], ["peek", "O(1)"]],
    learn: [
      ["push adds to the top and nothing else moves", (s) => s.kind === "add"],
      ["peek reads the top without removing it", (s) => s.kind === "peek"],
      ["pop returns the newest item first", (s) => s.kind === "remove"],
      ["a later push overwrites a stale slot", (s) => !!s.overwrote],
      ["popping an empty stack throws an exception", (s) => s.kind === "empty"]
    ]
  },
  queue: {
    id: "queue", title: "Queue", kind: "queue", cap: 4, code: QUEUE_CODE, minutes: 5,
    sub: "Offer, peek and poll on a circular array, and watch head and size move.",
    ops: [["enq", 4], ["enq", 9], ["enq", 2], ["peek"], ["deq"], ["enq", 7], ["enq", 5], ["deq"], ["deq"], ["deq"], ["deq"], ["deq"]],
    costs: [["offer", "O(1)"], ["poll", "O(1)"], ["peek", "O(1)"]],
    learn: [
      ["offer adds at the rear", (s) => s.kind === "add"],
      ["peek reads the front without removing it", (s) => s.kind === "peek"],
      ["poll serves the oldest item first", (s) => s.kind === "remove"],
      ["the rear index wraps around the array", (s) => !!s.wrapped],
      ["polling an empty queue returns null", (s) => s.kind === "empty"]
    ]
  }
};

export const LESSON_IDS = Object.keys(LESSONS);

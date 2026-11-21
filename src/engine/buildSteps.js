/* Simulates the Java code and returns one immutable snapshot per operation. */
export function buildSteps(lesson) {
  const isStack = lesson.kind === "stack";
  const cap = lesson.cap;
  let nextId = 1, items = [];
  const arr = Array(cap).fill(null);
  let top = -1, head = 0, size = 0;

  function snap(step) {
    step.items = items.slice();
    step.arr = arr.slice();
    step.top = top; step.head = head; step.size = size;
    if (step.cell === undefined) step.cell = -1;
    return step;
  }

  const steps = [snap({
    kind: "start", op: null, hl: null, mode: null, lines: [], notes: [],
    title: "Start empty",
    idea: isStack ? "A stack is an array plus one index called top." : "A queue is an array plus a head index and a size.",
    text: isStack
      ? "An empty stack. Items go on and come off the same end, called the top. The Java class keeps them in an int array and tracks the top index."
      : "An empty queue. Items join at the rear and leave from the front. The Java class keeps them in a small circular int array with a head index and a size."
  })];

  lesson.ops.forEach(([name, v]) => {
    let s;
    if (name === "push") {
      const oldTop = top; top++;
      const prevVal = arr[top]; arr[top] = v;
      const it = { id: nextId++, v }; items = items.concat([it]);
      s = { kind: "add", ret: "void", overwrote: prevVal !== null, op: `stack.push(${v})`, hl: it.id, mode: "in", cell: top, lines: [5, 6, 8],
        title: `Place ${v} on top`,
        idea: "Only the top index moves. Older items are never touched.",
        notes: [[6, `top is ${oldTop}, array is not full`], [8, `top becomes ${top}, data[${top}] = ${v}`]],
        text: `push(${v}) places ${v} on top. Nothing underneath has to move.` +
          (prevVal !== null ? ` It overwrites the stale ${prevVal} that an earlier pop left behind.` : "") };
    } else if (name === "enq") {
      const oldSize = size, idx = (head + size) % cap, wrapped = head + size >= cap;
      arr[idx] = v; size++;
      const it = { id: nextId++, v }; items = items.concat([it]);
      s = { kind: "add", ret: "void", wrapped, op: `queue.offer(${v})`, hl: it.id, mode: "in", cell: idx, lines: [5, 6, 8, 9],
        title: wrapped ? `Wrap around to slot ${idx}` : "Join at the rear",
        idea: wrapped ? "At the end of the array the next write goes back to slot 0, so the array is used as a circle."
                      : "The next free slot is (head + size) % capacity. Nothing shifts.",
        notes: [[6, `size is ${oldSize}, array is not full`],
                [8, `slot = (head ${head} + size ${oldSize}) % ${cap} = ${idx}, data[${idx}] = ${v}`],
                [9, `size becomes ${size}`]],
        text: `offer(${v}) adds ${v} at the rear. Everything already waiting stays ahead of it.` +
          (wrapped ? " The slot index wrapped back to the start of the array. That is why it is called a circular buffer." : "") };
    } else if (name === "peek") {
      if (isStack) {
        const t = items[items.length - 1];
        s = { kind: "peek", ret: String(t.v), op: "stack.peek()", hl: t.id, mode: "peek", cell: top, lines: [16, 17, 18],
          title: "Read without removing",
          idea: "Peeking is free. It reads a value and changes nothing.",
          notes: [[17, `top is ${top}, not empty`], [18, `returns data[${top}] = ${t.v}, top stays ${top}`]],
          text: `peek() reads the top value, ${t.v}, and leaves it in place. The stack is unchanged.` };
      } else {
        const f = items[0];
        s = { kind: "peek", ret: String(f.v), op: "queue.peek()", hl: f.id, mode: "peek", cell: head, lines: [20, 21],
          title: "Read without removing",
          idea: "Peeking is free. It reads a value and changes nothing.",
          notes: [[21, `size is ${size}, so returns data[head] = data[${head}] = ${f.v}`]],
          text: `peek() reads the front value, ${f.v}, and leaves it in place. The queue is unchanged.` };
      }
    } else if (name === "pop") {
      if (top === -1) {
        s = { kind: "empty", ret: "throws", retNote: "EmptyStackException", op: "stack.pop()", hl: null, mode: null, cell: -1, lines: [11, 12],
          title: "Nothing to remove",
          idea: "Check for empty first, or be ready to catch the exception.",
          notes: [[12, "top is -1, the stack is empty, so it throws"]],
          text: "pop() on an empty stack has nothing to return. This code throws EmptyStackException, like java.util.Stack does." };
      } else {
        const gone = items[items.length - 1], was = top;
        items = items.slice(0, -1); top--;
        s = { kind: "remove", ret: String(gone.v), op: "stack.pop()", hl: null, mode: "out", cell: was, lines: [11, 12, 13],
          title: "Take the newest",
          idea: "Pop only moves top down. The old value stays in the array, ignored.",
          notes: [[12, `top is ${was}, not empty`], [13, `returns data[${was}] = ${gone.v}, then top becomes ${top}`]],
          text: `pop() removes and returns ${gone.v}, the most recent item. ` +
            (items.length ? `${items[items.length - 1].v} is now the top.` : "The stack is empty again.") +
            " The old value stays in the array until something overwrites it." };
      }
    } else if (name === "deq") {
      if (size === 0) {
        s = { kind: "empty", ret: "null", op: "queue.poll()", hl: null, mode: null, cell: -1, lines: [12, 13],
          title: "Nothing to serve",
          idea: "poll() signals empty with null, so always check the result.",
          notes: [[13, "size is 0, so returns null"]],
          text: "poll() on an empty queue returns null. The standard Queue.remove() throws NoSuchElementException instead. Pick the one that fits how you handle an empty queue." };
      } else {
        const first = items[0], oh = head;
        items = items.slice(1); head = (head + 1) % cap; size--;
        s = { kind: "remove", ret: String(first.v), op: "queue.poll()", hl: null, mode: "out", cell: oh, lines: [12, 13, 14, 15, 16, 17],
          title: "Serve the oldest",
          idea: "Poll only moves head forward. Nothing shifts, so it stays O(1).",
          notes: [[13, `size is ${size + 1}, not empty`], [14, `x = data[${oh}] = ${first.v}`],
                  [15, `head = (${oh} + 1) % ${cap} = ${head}`], [16, `size becomes ${size}`], [17, `returns ${first.v}`]],
          text: `poll() removes and returns ${first.v}, the item that has waited longest. ` +
            (items.length ? `${items[0].v} is now at the front.` : "The queue is empty again.") };
      }
    }
    steps.push(snap(s));
  });
  return steps;
}

export const stepLabel = (s) => (s.op ? s.op.replace(/^(stack|queue)\./, "") : "start");

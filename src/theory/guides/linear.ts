import type { Guide } from "../types";

const linear: Guide = {
  section: "linear",
  tagline: "Structures that keep items in a line and let you add or remove them only at chosen places, with each end operation in one step.",
  core: [
    "Stack plates 4, 9 and 2, then take one. You get 2, the last one you put down. Stand people in a line instead, and the first to arrive is served first. Those two rules are the stack and the queue.",
    "A linear structure keeps its items in a sequence and limits where you may add or remove them. A stack works at one end only. A queue adds at the back and removes at the front. A deque does both at both ends. Because each operation touches only an end, it costs O(1) at any size, or O(1) amortized when an array has to grow.",
    "There are two ways to build the line. An array keeps items side by side, as in [[guide:foundations]]. A linked list stores each item in its own node, which holds a pointer to the next node. Lists never shift items. But the nodes can sit anywhere in memory, so unlike `a[i]` there is no way to compute where the k-th one is. You must follow k pointers, one at a time."
  ],
  analogy:
    "Picture a train. Each carriage is coupled only to the one behind it. To add a carriage at the front, you couple it on and the rest stay put. To reach the tenth carriage, you walk through the nine before it. A linked list behaves like that train. A stack is a siding with one way in and out. A queue is a tunnel you enter at one end and leave at the other.",
  prereqs: [
    "The [[guide:foundations|Foundations guide]]: Big-O, O(1) and O(n), and what an index is.",
    "The [[arrays]] lesson: why reading `a[i]` is one step, and why inserting at the front shifts every item."
  ],
  terms: [
    ["stack", "A collection where you add and remove at the same end, called the top. A pile of plates is a stack."],
    ["LIFO", "Last in, first out. The item added most recently leaves first. A stack is LIFO."],
    ["queue", "A collection where items join at the back, or rear, and leave from the front. A line at a ticket desk is a queue."],
    ["FIFO", "First in, first out. The item that has waited longest leaves first. A queue is FIFO."],
    ["deque", "Short for double-ended queue, said \"deck\". You can add and remove at both the front and the back. It is not the same as dequeue, the queue operation."],
    ["push", "Add an item to the top of a stack. Deques use it for either end, as in `pushFront`."],
    ["pop", "Remove the top item of a stack and return it."],
    ["peek", "Read the next item to leave, the top of a stack or the front of a queue, without removing it."],
    ["enqueue", "Add an item at the back of a queue. Java calls this `offer`."],
    ["dequeue", "Remove the item at the front of a queue and return it. Java calls this `poll`."],
    ["node", "A small object that holds one value plus one or more pointers to other nodes."],
    ["pointer (reference)", "A value that says where another object lives in memory, so you can reach it. In this section it is not an array index."],
    ["linked list", "A chain of nodes. Each node points to the next one, and the list remembers the first node."],
    ["head", "The first node of a linked list, or the front slot of a queue."],
    ["tail", "The last node of a linked list. Keeping a pointer to it makes adding at the end O(1)."],
    ["null", "A special pointer value that means \"points at nothing\". The last node's next pointer is null, which marks the end."],
    ["cycle", "A loop in a linked list: following next pointers brings you back to a node you already passed, so you never reach null."],
    ["circular buffer", "An array used as a ring. After the last slot, the next write goes to slot 0, so a queue never has to shift items."],
    ["amortized", "Averaged over a long run of operations. A rare slow step, such as copying into a bigger array, is spread across many fast ones."],
    ["hash map", "A table that finds a value by its key, the label you look it up by, in about one step on average. Python's `dict` and Java's `HashMap` are hash maps."],
    ["LRU", "Least recently used. An LRU cache, a small fast store of recent results, throws out the item nobody has touched for longest."]
  ],
  cheat: {
    head: ["Operation", "Time", "Extra space", "Note"],
    rows: [
      ["Stack push, pop, peek", "O(1)", "O(1)", "Only the top moves. On a growing array, push is O(1) amortized."],
      ["Queue enqueue, dequeue", "O(1)", "O(1)", "With a linked list or a circular buffer. Removing `a[0]` from a plain array would shift every item."],
      ["Deque add or remove at either end", "O(1)", "O(1)", "A circular buffer or a doubly linked list."],
      ["Linked list insert at head", "O(1)", "O(1)", "Point the new node at the old head, then move head."],
      ["Linked list access the k-th item", "O(k), worst O(n)", "O(1)", "You follow `k` next pointers from head. There is no index."],
      ["Singly list delete, given the previous node", "O(1)", "O(1)", "Set `prev.next` to skip the node. Finding `prev` by value first costs O(n)."],
      ["Doubly list delete, given the node itself", "O(1)", "O(1)", "The node's `prev` pointer finds its neighbour without a walk."],
      ["Fast and slow cycle check", "O(n)", "O(1)", "Two pointers and no record of visited nodes."]
    ]
  },
  patterns: [
    ["Matching brackets such as `([])`, or an undo button.", "Use a stack. The last thing opened, or done, is the first to close, or undo. See [[stack]]."],
    ["Handle items in the order they arrive, or explore level by level.", "Use a queue. See [[queue]]."],
    ["Add and remove at both ends, such as the maximum of a sliding window.", "Use a deque. See [[deque]]."],
    ["You must find whether a linked list loops, or where its middle is.", "Use fast and slow pointers. See [[fast-and-slow-pointers]]."]
  ],
  tips: [
    "Check for empty before you pop, peek or dequeue. An empty stack has no top, and the code throws or returns null.",
    "Link before you move. When adding at the head, set `node.next = head` first, then `head = node`. The other order loses the whole list.",
    "Keep the tail pointer up to date. When you delete the last node, `tail` must move back too, or it points at a node that is gone.",
    "Do not use a plain array as a queue by removing `a[0]`. Each removal shifts every item, so `n` removals cost O(n²).",
    "Indexing a linked list is a walk. Reading item `i` inside a loop over `i` costs O(n²) in total."
  ],
  cases: [
    {
      title: "The browser back button",
      setting: "You open page A, then B, then C. Pressing back should show B, then A.",
      idea: "The browser pushes each page onto a stack as you leave it. Back pops the top page and shows it. Forward uses a second stack of the pages you backed out of.",
      why: "The page you want is always the one you saw most recently. That is LIFO, and push and pop each cost O(1)."
    },
    {
      title: "A printer queue",
      setting: "Five people send documents to one office printer within a minute. The printer can print one at a time.",
      idea: "Each new job is enqueued at the back. When the printer is free, it dequeues the job at the front.",
      why: "Jobs print in arrival order, so nobody's document is skipped. That is FIFO, and each job costs O(1) to add and remove."
    },
    {
      title: "An LRU cache",
      setting: "A server keeps the 1,000 most recent results in memory. When it is full and a new result arrives, it must drop the least recently used one.",
      idea: "A doubly linked list keeps results in order of use, newest at the head. A [[guide:hashing|hash map]], keyed by request, points to each result's node.",
      why: "The hash map finds the node in O(1) on average. The list is doubly linked because the node's `prev` pointer lets it unlink the node from the middle. Moving it to the head then costs O(1). Each node also stores its key, so dropping the tail removes that key from the map too."
    }
  ],
  hooks: {
    stack: "Push, pop and peek on an array, and watch the top index move.",
    queue: "Offer and poll on a circular array, and watch the rear wrap back to slot 0.",
    deque: "Add and remove at both ends of one ring of slots.",
    "singly-linked-list": "Build a chain of nodes, search it hop by hop, and unlink a node with one pointer write.",
    "doubly-linked-list": "Give every node a back pointer, so both ends add and remove in O(1).",
    "fast-and-slow-pointers": "Detect a loop in a list with two pointers at different speeds and no extra memory."
  }
};

export default linear;

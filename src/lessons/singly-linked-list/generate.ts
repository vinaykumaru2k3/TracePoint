import type { Item, Step } from "../../engine/types";
import type { BlockState } from "../../iso/IsoBlock";
import type { Op } from "../parseOps";

export const SLL_MAX = 6;

export interface SNode { id: number; v: number; next: number | null; slot: number; lift?: boolean; state?: BlockState }

export interface SllState {
  /** Render-ready nodes, list order. A lifted node is new (not linked yet) or just unlinked. */
  nodes: SNode[];
  head: number | null;
  tail: number | null;
  cur: number | null;
  prev: number | null;
  /** Node whose next arrow just changed. */
  active: number | null;
  /** Node that was just unlinked; its arrow is drawn faint. */
  gone: number | null;
  mode: "first" | "last" | null;
}

/** Simulates a singly linked list with head and tail pointers. Every hop is its own step. */
export function generateSll(ops: Op[]): Step<SllState>[] {
  let nextId = 1;
  let list: Item[] = [];
  const view = (l: Item[], off = 0, st: Record<number, BlockState> = {}): SNode[] =>
    l.map((n, i) => ({ id: n.id, v: n.v, next: l[i + 1]?.id ?? null, slot: i + off, state: st[n.id] }));
  const snap = (s: Omit<Step<SllState>, "state">, x: Partial<SllState> = {}): Step<SllState> => ({
    ...s,
    state: {
      nodes: view(list), head: list[0]?.id ?? null, tail: list[list.length - 1]?.id ?? null,
      cur: null, prev: null, active: null, gone: null, mode: null, ...x
    }
  });
  const show = (l: Item[]) => (l.length ? l.map((n) => n.v).join(" → ") + " → null" : "empty");

  const steps: Step<SllState>[] = [snap({
    kind: "problem", op: null, anchors: [], notes: {},
    title: "Nodes that point to the next one",
    idea: "A linked list trades index access for cheap inserts: each node only knows its successor.",
    text: "The list starts empty. Each node holds a value and a next pointer. The list keeps head (first node) and tail (last node), so both ends are reachable at once."
  })];

  for (const { name, v = 0 } of ops) {
    if (name === "addfirst") {
      const n = { id: nextId++, v }, old = list[0];
      const fresh = (next: number | null): SNode => ({ id: n.id, v, next, slot: 0, lift: true, state: "active" });
      steps.push(snap({
        kind: "add", op: `addFirst(${v})`, anchors: ["addFirst.sig", "addFirst.new"], notes: { "addFirst.new": `new node @${n.id} holds ${v}` },
        title: `Make a node for ${v}`, idea: "A new node starts unlinked: next is null and nobody points at it yet.",
        text: `addFirst(${v}) allocates node @${n.id}. It is not part of the list until the pointers change.`
      }, { nodes: [fresh(null), ...view(list, 1)], mode: "first" }));
      steps.push(snap({
        kind: "add", op: `addFirst(${v})`, anchors: ["addFirst.link"], notes: { "addFirst.link": `n.next = head = ${old ? `@${old.id}` : "null"}` },
        title: "Point it at the old head", idea: "Link the new node first, then move head. The other order would lose the list.",
        text: old ? `The new node's next now points at ${old.v}, the current head.` : "The list is empty, so next stays null."
      }, { nodes: [fresh(old?.id ?? null), ...view(list, 1)], active: n.id, mode: "first" }));
      list = [n, ...list];
      steps.push(snap({
        kind: "add", op: `addFirst(${v})`, ret: "void", anchors: ["addFirst.head"], notes: { "addFirst.head": `head = @${n.id}` },
        title: `${v} is the new head`, idea: "addFirst is O(1): two pointer writes, no matter how long the list is.",
        text: `head moves to the new node.${list.length === 1 ? " It is also the tail, since it is the only node." : ""} List: ${show(list)}.`
      }, { nodes: view(list, 0, { [n.id]: "active" }), mode: "first" }));
    } else if (name === "addlast") {
      const n = { id: nextId++, v }, old = list[list.length - 1];
      const fresh: SNode = { id: n.id, v, next: null, slot: list.length, lift: true, state: "active" };
      steps.push(snap({
        kind: "add", op: `addLast(${v})`, anchors: ["addLast.sig", "addLast.new"], notes: { "addLast.new": `new node @${n.id} holds ${v}` },
        title: `Make a node for ${v}`, idea: "The new last node's next is null, which marks the end of the list.",
        text: `addLast(${v}) allocates node @${n.id}, ready to hang off the end.`
      }, { nodes: [...view(list), fresh], mode: "last" }));
      if (!old) {
        list = [n];
        steps.push(snap({
          kind: "add", op: `addLast(${v})`, ret: "void", anchors: ["addLast.empty"], notes: { "addLast.empty": `head = tail = @${n.id}` },
          title: "First node of the list", idea: "On an empty list, head and tail both point at the one node.",
          text: `The list was empty, so head and tail both become node @${n.id}.`
        }, { nodes: view(list, 0, { [n.id]: "active" }), mode: "last" }));
        continue;
      }
      steps.push(snap({
        kind: "add", op: `addLast(${v})`, anchors: ["addLast.link"], notes: { "addLast.link": `tail.next = @${n.id}` },
        title: "Hang it off the tail", idea: "The tail pointer saves walking the whole list to find the end.",
        text: `The old tail ${old.v} now points at the new node.`
      }, { nodes: [...view(list).map((s) => (s.id === old.id ? { ...s, next: n.id } : s)), fresh], active: old.id, mode: "last" }));
      list = [...list, n];
      steps.push(snap({
        kind: "add", op: `addLast(${v})`, ret: "void", anchors: ["addLast.tail"], notes: { "addLast.tail": `tail = @${n.id}` },
        title: `${v} is the new tail`, idea: "addLast is O(1) only because the list keeps a tail pointer.",
        text: `tail moves to the new node. List: ${show(list)}.`
      }, { nodes: view(list, 0, { [n.id]: "active" }), mode: "last" }));
    } else if (name === "contains") {
      let hit = false;
      for (let i = 0; i < list.length; i++) {
        const c = list[i], anchors = i === 0 ? ["contains.sig", "contains.walk"] : ["contains.walk"];
        if (c.v === v) {
          steps.push(snap({
            kind: "found", op: `contains(${v})`, ret: "true", anchors: [...anchors, "contains.hit"], notes: { "contains.hit": `cur.val ${c.v} == ${v}` },
            title: `Found ${v}`, idea: "Search is O(n): the only way to reach a node is to follow next from head.",
            text: `cur reached ${v} after ${i + 1} node${i ? "s" : ""}, so contains returns true.`
          }, { nodes: view(list, 0, { [c.id]: "found" }), cur: c.id }));
          hit = true;
          break;
        }
        steps.push(snap({
          kind: "check", op: `contains(${v})`, anchors, notes: { "contains.walk": `cur = @${c.id}, ${c.v} != ${v}` },
          title: i === 0 ? `Look for ${v} from head` : `Hop to the next node`, idea: "No indexes here: each hop costs one step.",
          text: `cur is on ${c.v}, which is not ${v}. Follow next to ${list[i + 1] ? list[i + 1].v : "null"}.`
        }, { nodes: view(list, 0, { [c.id]: "compare" }), cur: c.id }));
      }
      if (!hit) steps.push(snap({
        kind: "check", op: `contains(${v})`, ret: "false", anchors: list.length ? ["contains.miss"] : ["contains.sig", "contains.walk", "contains.miss"],
        notes: { "contains.miss": "cur is null" },
        title: `${v} is not in the list`, idea: "A miss always walks every node, the worst case.",
        text: list.length ? `cur fell off the end after checking all ${list.length} nodes. contains returns false.` : "head is null, so there is nothing to search."
      }));
    } else if (name === "delete") {
      let i = 0;
      for (; i < list.length; i++) {
        const c = list[i], p = list[i - 1];
        const match = c.v === v;
        steps.push(snap({
          kind: match ? "found" : "check", op: `delete(${v})`, anchors: i === 0 ? ["delete.sig", "delete.walk"] : ["delete.walk"],
          notes: { "delete.walk": `prev = ${p ? `@${p.id}` : "null"}, cur = @${c.id} (${c.v})` },
          title: match ? `Found ${v}` : i === 0 ? `Look for ${v} from head` : "Step prev and cur forward",
          idea: "Deleting needs the node before the target too, so prev trails one behind cur.",
          text: match ? `cur is on ${v}. ${p ? `prev is on ${p.v}, whose next must skip over it.` : "prev is null, so the target is the head."}`
            : `cur is on ${c.v}, not ${v}. prev moves to ${c.v} and cur to ${list[i + 1] ? list[i + 1].v : "null"}.`
        }, { nodes: view(list, 0, { [c.id]: match ? "found" : "compare", ...(p ? { [p.id]: "visited" } : {}) }), cur: c.id, prev: p?.id ?? null }));
        if (match) break;
      }
      if (i === list.length) {
        steps.push(snap({
          kind: "check", op: `delete(${v})`, ret: "false", anchors: list.length ? ["delete.miss"] : ["delete.sig", "delete.walk", "delete.miss"],
          notes: { "delete.miss": "cur is null" },
          title: `${v} is not in the list`, idea: "Nothing changes when the value is missing.",
          text: list.length ? `cur ran off the end without finding ${v}, so delete returns false.` : "The list is empty, so delete returns false."
        }));
        continue;
      }
      const c = list[i], p = list[i - 1], after = list[i + 1];
      const before = view(list);
      const wasTail = i === list.length - 1;
      list = list.filter((n) => n.id !== c.id);
      const nodes = before.map((s) => s.id === c.id ? { ...s, lift: true, state: "stale" as BlockState }
        : p && s.id === p.id ? { ...s, next: after?.id ?? null } : s);
      const tailNote: Record<string, string> = wasTail ? { "delete.tail": `tail = ${p ? `@${p.id}` : "null"}` } : {};
      const tailAnchor = wasTail ? ["delete.tail"] : [];
      if (!p) {
        steps.push(snap({
          kind: "remove", op: `delete(${v})`, ret: "true", anchors: ["delete.head", ...tailAnchor],
          notes: { "delete.head": `head = cur.next = ${after ? `@${after.id}` : "null"}`, ...tailNote },
          title: "Move head past it", idea: "Deleting the head is O(1): head just skips to the second node.",
          text: `head now points at ${after ? after.v : "null"}. Nothing references ${v} any more, so the garbage collector can reclaim it. List: ${show(list)}.`
        }, { nodes, gone: c.id, cur: c.id }));
      } else {
        steps.push(snap({
          kind: "remove", op: `delete(${v})`, ret: "true", anchors: ["delete.unlink", ...tailAnchor],
          notes: { "delete.unlink": `prev.next = cur.next = ${after ? `@${after.id}` : "null"}`, ...tailNote },
          title: `Unlink ${v}`, idea: "One pointer write removes the node. The walk to find it is what costs O(n).",
          text: `${p.v}.next skips straight to ${after ? after.v : "null"}.${wasTail ? ` ${v} was the tail, so tail moves back to ${p.v}.` : ""} List: ${show(list)}.`
        }, { nodes, gone: c.id, cur: c.id, prev: p.id, active: p.id }));
      }
    }
  }

  steps.push(snap({
    kind: "recap", op: null, anchors: [], notes: {},
    title: "What happened",
    idea: "Linked lists make the ends cheap and the middle expensive to reach.",
    text: `Final list: ${show(list)}. Adding at either end took a fixed number of pointer writes. Finding a value, or the node before it, meant walking from head one hop at a time.`
  }));
  return steps;
}

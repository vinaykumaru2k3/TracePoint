import type { Item, Step } from "../../engine/types";
import type { BlockState } from "../../iso/IsoBlock";
import type { Op } from "../parseOps";

export const DLL_MAX = 6;

export interface DNode {
  id: number; v: number; next: number | null; prev: number | null; slot: number;
  lift?: boolean; state?: BlockState;
}

export interface DllState {
  nodes: DNode[];
  head: number | null;
  tail: number | null;
  /** Links that just changed, as "id:next" or "id:prev". */
  active: string[];
  /** A node that just left the list; its arrows are drawn faint. */
  gone: number | null;
}

/** Simulates a doubly linked list. Each pointer write that matters gets its own step. */
export function generateDll(ops: Op[]): Step<DllState>[] {
  let nextId = 1;
  let list: Item[] = [];
  const view = (l: Item[], off = 0, st: Record<number, BlockState> = {}): DNode[] =>
    l.map((n, i) => ({ id: n.id, v: n.v, next: l[i + 1]?.id ?? null, prev: l[i - 1]?.id ?? null, slot: i + off, state: st[n.id] }));
  const snap = (s: Omit<Step<DllState>, "state">, x: Partial<DllState> = {}): Step<DllState> => ({
    ...s,
    state: { nodes: view(list), head: list[0]?.id ?? null, tail: list[list.length - 1]?.id ?? null, active: [], gone: null, ...x }
  });
  const show = (l: Item[]) => (l.length ? "null ⇄ " + l.map((n) => n.v).join(" ⇄ ") + " ⇄ null" : "empty");
  const patch = (nodes: DNode[], id: number | undefined, p: Partial<DNode>) => nodes.map((n) => (n.id === id ? { ...n, ...p } : n));

  const steps: Step<DllState>[] = [snap({
    kind: "problem", op: null, anchors: [], notes: {},
    title: "Links in both directions",
    idea: "Each node stores prev as well as next, so either end can be removed in O(1).",
    text: "The list starts empty. Every node holds a value, a prev pointer and a next pointer. head and tail mark the two ends."
  })];

  for (const { name, v = 0 } of ops) {
    if (name === "addfirst" || name === "addlast") {
      const first = name === "addfirst", F = first ? "addFirst" : "addLast", op = `${F}(${v})`;
      const n = { id: nextId++, v }, end = first ? list[0] : list[list.length - 1];
      const off = first ? 1 : 0;
      const base = view(list, off);
      const fresh: DNode = { id: n.id, v, next: null, prev: null, slot: first ? 0 : list.length, lift: true, state: "active" };
      const place = (nodes: DNode[], f: DNode) => (first ? [f, ...nodes] : [...nodes, f]);
      const endName = first ? "head" : "tail";

      steps.push(snap({
        kind: "add", op, anchors: [`${F}.sig`, `${F}.new`], notes: { [`${F}.new`]: `new node @${n.id}, prev = next = null` },
        title: `Make a node for ${v}`, idea: "A fresh node has two empty pointers. Two links must be set to join the list.",
        text: `${op} allocates node @${n.id}. Both of its pointers start as null.`
      }, { nodes: place(base, fresh) }));

      const linked = { ...fresh, ...(first ? { next: end?.id ?? null } : { prev: end?.id ?? null }) };
      steps.push(snap({
        kind: "add", op, anchors: [`${F}.link`],
        notes: { [`${F}.link`]: first ? `n.next = head = ${end ? `@${end.id}` : "null"}` : `n.prev = tail = ${end ? `@${end.id}` : "null"}` },
        title: first ? "Point forward to the old head" : "Point back to the old tail",
        idea: "The new node's own pointer goes first. Nothing in the list sees it yet.",
        text: end ? `The new node's ${first ? "next" : "prev"} now points at ${end.v}.` : `The list is empty, so ${first ? "next" : "prev"} stays null.`
      }, { nodes: place(base, linked), active: end ? [`${n.id}:${first ? "next" : "prev"}`] : [] }));

      const back = end ? patch(base, end.id, first ? { prev: n.id } : { next: n.id }) : base;
      steps.push(snap({
        kind: "add", op, anchors: [`${F}.back`],
        notes: { [`${F}.back`]: end ? `${endName}.${first ? "prev" : "next"} = @${n.id}` : `${first ? "tail" : "head"} = @${n.id}` },
        title: end ? `Link ${end.v} back to it` : "It is both ends",
        idea: "The second link is what makes it doubly linked: the old end now points at the new node.",
        text: end ? `${end.v}.${first ? "prev" : "next"} was null. Now it points at the new node, so the link works in both directions.`
          : `The list was empty, so ${first ? "tail" : "head"} also points at the new node.`
      }, { nodes: place(back, linked), active: end ? [`${end.id}:${first ? "prev" : "next"}`] : [], ...(end ? {} : first ? { tail: n.id } : { head: n.id }) }));

      list = first ? [n, ...list] : [...list, n];
      steps.push(snap({
        kind: "add", op, ret: "void", anchors: [`${F}.${endName}`], notes: { [`${F}.${endName}`]: `${endName} = @${n.id}` },
        title: `${v} is the new ${endName}`, idea: `${F} is O(1) at either end: four pointer writes at most.`,
        text: `${endName} moves to the new node. List: ${show(list)}.`
      }, { nodes: view(list, 0, { [n.id]: "active" }) }));
    } else {
      const first = name === "removefirst", F = first ? "removeFirst" : "removeLast", op = `${F}()`;
      const endName = first ? "head" : "tail";
      if (!list.length) {
        steps.push(snap({
          kind: "empty", op, ret: "throws", retNote: "list is empty", anchors: [`${F}.sig`, `${F}.check`],
          notes: { [`${F}.check`]: `${endName} is null` },
          title: "Nothing to remove", idea: "Check isEmpty() before removing from either end.",
          text: `${op} on an empty list has nothing to return, so it throws.`
        }));
        continue;
      }
      const old = first ? list[0] : list[list.length - 1];
      const nu = first ? list[1] : list[list.length - 2];
      const base = view(list, 0, { [old.id]: "stale" });
      steps.push(snap({
        kind: "remove", op, anchors: [`${F}.sig`, `${F}.check`, `${F}.move`],
        notes: { [`${F}.move`]: `${endName} = ${endName}.${first ? "next" : "prev"} = ${nu ? `@${nu.id}` : "null"}` },
        title: `Move ${endName} ${first ? "forward" : "back"}`,
        idea: first ? "Stepping forward from head is easy in any linked list." : "Stepping back from tail needs prev. A singly linked list would walk from head: O(n).",
        text: `${old.v} will be returned. ${endName} moves to ${nu ? nu.v : "null"}${nu ? `, but ${nu.v} still points ${first ? "back" : "forward"} at ${old.v}.` : "."}`
      }, { nodes: base, head: first ? nu?.id ?? null : list[0].id, tail: first ? list[list.length - 1].id : nu?.id ?? null }));

      list = list.filter((n) => n.id !== old.id);
      let nodes = base.map((n) => (n.id === old.id ? { ...n, lift: true } : n));
      if (nu) nodes = patch(nodes, nu.id, first ? { prev: null } : { next: null });
      steps.push(snap({
        kind: "remove", op, ret: String(old.v), anchors: [`${F}.cut`],
        notes: { [`${F}.cut`]: nu ? `${endName}.${first ? "prev" : "next"} = null` : `${first ? "tail" : "head"} = null` },
        title: "Cut the last link to it",
        idea: "Clear the new end's pointer so nothing references the removed node.",
        text: nu ? `${nu.v}.${first ? "prev" : "next"} becomes null. ${old.v} is unreachable and is returned. List: ${show(list)}.`
          : `${old.v} was the only node, so ${first ? "tail" : "head"} becomes null too. The list is empty.`
      }, { nodes, gone: old.id, active: nu ? [`${nu.id}:${first ? "prev" : "next"}`] : [] }));
    }
  }

  steps.push(snap({
    kind: "recap", op: null, anchors: [], notes: {},
    title: "What happened",
    idea: "Two pointers per node buy O(1) removal at both ends.",
    text: `Final list: ${show(list)}. Every add and remove touched a fixed number of pointers. The prev links are what let removeLast skip the walk from head.`
  }));
  return steps;
}

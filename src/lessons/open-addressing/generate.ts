import type { Step } from "../../engine/types";
import type { BlockState } from "../../iso/IsoBlock";
import type { Op } from "../parseOps";

export const SLOTS = 7;
export const TOMB = "T" as const;
export type Slot = number | typeof TOMB | null;

export interface OaState {
  slots: Slot[];
  size: number;
  home: number | null;
  probe: number | null;
  /** First tombstone seen during an add, which the add will reuse. */
  tomb: number | null;
  /** Slot drawn in a result colour this step. */
  mark: { at: number; state: BlockState } | null;
  probes: number;
  /** The add wrote into a tombstone instead of an empty slot. */
  reused?: boolean;
}

/** Simulates a hash set with linear probing and tombstones over 7 slots. Every probe is a step. */
export function generateOa(ops: Op[]): Step<OaState>[] {
  const slots: Slot[] = Array(SLOTS).fill(null);
  let size = 0;
  const snap = (s: Omit<Step<OaState>, "state">, x: Partial<OaState> = {}): Step<OaState> => ({
    ...s, state: { slots: slots.slice(), size, home: null, probe: null, tomb: null, mark: null, probes: 0, ...x }
  });
  const what = (s: Slot) => (s === null ? "empty" : s === TOMB ? "a tombstone" : String(s));

  const steps: Step<OaState>[] = [snap({
    kind: "problem", op: null, anchors: [], notes: {},
    title: "Every key lives in the array itself",
    idea: "No chains: a collision moves to the next free slot, and lookups follow the same path.",
    text: `A hash set over ${SLOTS} slots. A key's home slot is key % ${SLOTS}. If that slot is taken, try the next one, wrapping at the end. Removed keys leave a tombstone so later searches keep walking past them.`
  })];

  for (const { name, v = 0 } of ops) {
    const X = name, op = `${name}(${v})`, home = v % SLOTS;
    if (name === "add" && size === SLOTS) {
      steps.push(snap({
        kind: "check", op, ret: "false", retNote: "table is full", anchors: ["add.sig", "add.full"], notes: { "add.full": `size ${size} == ${SLOTS}` },
        title: "No free slot", idea: "Open addressing cannot hold more keys than slots. Real tables resize well before this.",
        text: `All ${SLOTS} slots hold keys, so ${v} cannot be added.`
      }));
      continue;
    }
    steps.push(snap({
      kind: "check", op, anchors: name === "add" ? ["add.sig", "add.full", "hash"] : [`${X}.sig`, "hash"],
      notes: { hash: `${v} % ${SLOTS} = ${home}` },
      title: `${v} starts at slot ${home}`, idea: "The hash gives a starting point, not a guaranteed spot.",
      text: `${v} % ${SLOTS} = ${home}. Slot ${home} holds ${what(slots[home])}.`
    }, { home, probe: home }));

    let i = home, tomb: number | null = null, done = false, probes = 0;
    for (; probes < SLOTS && slots[i] !== null; probes++) {
      const s = slots[i], n = (i + 1) % SLOTS;
      if (s === v) {
        done = true;
        if (name === "add") {
          steps.push(snap({
            kind: "found", op, ret: "false", retNote: "already in the set", anchors: ["add.probe", "add.dup"], notes: { "add.dup": `slot ${i} == ${v}` },
            title: `${v} is already here`, idea: "A set keeps one copy of each key.",
            text: `Slot ${i} already holds ${v}, so add returns false.`
          }, { home, probe: i, tomb, mark: { at: i, state: "found" }, probes: probes + 1 }));
        } else if (name === "contains") {
          steps.push(snap({
            kind: "found", op, ret: "true", anchors: ["contains.probe", "contains.hit"], notes: { "contains.hit": `slot ${i} == ${v}` },
            title: `Found ${v} at slot ${i}`, idea: probes ? `It took ${probes + 1} probes because of earlier collisions.` : "Found on the first probe: the best case.",
            text: `Slot ${i} holds ${v}, so contains returns true.`
          }, { home, probe: i, mark: { at: i, state: "found" }, probes: probes + 1 }));
        } else {
          slots[i] = TOMB;
          size--;
          steps.push(snap({
            kind: "remove", op, ret: "true", anchors: ["remove.probe", "remove.hit"], notes: { "remove.hit": `slot ${i} = tombstone` },
            title: `Leave a tombstone at slot ${i}`,
            idea: "Emptying the slot would cut the probe path. Keys placed after it would become unfindable.",
            text: `${v} is removed, but slot ${i} is marked as a tombstone instead of empty, so searches keep probing past it.`
          }, { home, probe: i, mark: { at: i, state: "stale" }, probes: probes + 1 }));
        }
        break;
      }
      const isTomb = s === TOMB;
      const firstTomb = name === "add" && isTomb && tomb === null;
      if (firstTomb) tomb = i;
      const anchors = [`${X}.probe`, ...(firstTomb ? ["add.tomb"] : []), `${X}.next`];
      steps.push(snap({
        kind: "check", op, anchors,
        notes: { [`${X}.probe`]: `slot ${i}: ${what(s)}`, [`${X}.next`]: `i = (${i} + 1) % ${SLOTS} = ${n}`, ...(firstTomb ? { "add.tomb": `remember slot ${i}` } : {}) },
        title: isTomb ? `Slot ${i} is a tombstone` : `Slot ${i} is taken`,
        idea: isTomb ? (name === "add" ? "A tombstone can be reused, but keep probing in case the key is further on." : "A tombstone means keep going: the key may sit past it.")
          : "Linear probing: collisions spill into the next slot, so keys cluster.",
        text: isTomb ? `Slot ${i} once held a key.${firstTomb ? ` Remember it as a free spot.` : ""} Try slot ${n}.` : `Slot ${i} holds ${s}, not ${v}. Try slot ${n}.`
      }, { home, probe: i, tomb, probes: probes + 1 }));
      i = n;
    }
    if (done) continue;

    if (name === "add") {
      const at = tomb ?? i;
      slots[at] = v;
      size++;
      steps.push(snap({
        kind: "add", op, ret: "true", anchors: ["add.write"], notes: { "add.write": `slots[${at}] = ${v}` },
        title: `Write ${v} into slot ${at}`,
        idea: tomb !== null ? "Reusing the first tombstone keeps probe paths short." : at === home ? "No collision: the key sits in its home slot." : `${v} landed ${(at - home + SLOTS) % SLOTS} slot${(at - home + SLOTS) % SLOTS === 1 ? "" : "s"} from home.`,
        text: tomb !== null ? `Probing reached ${probes === SLOTS ? "every slot" : `empty slot ${i}`}, so ${v} is not in the set. It goes into tombstone slot ${at}.`
          : `Slot ${at} is empty, so ${v} is stored there. size = ${size}.`
      }, { home, probe: at, mark: { at, state: "active" }, probes: probes + 1, reused: tomb !== null }));
    } else {
      steps.push(snap({
        kind: "check", op, ret: "false", anchors: [`${X}.miss`], notes: { [`${X}.miss`]: probes === SLOTS ? "probed every slot" : `slot ${i} is empty` },
        title: `${v} is not in the set`, idea: "An empty slot ends the search: the key would have been placed there or earlier.",
        text: probes === SLOTS ? `Every slot was probed without finding ${v}.` : `Probing reached empty slot ${i}, so ${v} is not here. ${name} returns false.`
      }, { home, probe: probes === SLOTS ? null : i, probes: probes + 1 }));
    }
  }

  steps.push(snap({
    kind: "recap", op: null, anchors: [], notes: {},
    title: "What happened",
    idea: "Open addressing is cache friendly but needs a low load factor to keep probe paths short.",
    text: `${size} of ${SLOTS} slots hold keys. Each lookup started at its home slot and walked forward until it found the key or an empty slot. Tombstones kept those walks correct after removals.`
  }));
  return steps;
}

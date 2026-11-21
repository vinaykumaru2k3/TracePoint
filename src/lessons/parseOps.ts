import type { ParseResult } from "../engine/types";

export interface Op { name: string; v?: number }

export const MAX_OPS = 16;
export const MAX_VALUE = 99;

/**
 * Parse "push 4, push 9, peek, pop" into ops. `add` names take one whole number 0..99.
 * `aliases` maps friendly names (enq, deq) onto the canonical ones.
 */
export function parseOps(text: string, add: string, others: string[], aliases: Record<string, string> = {}): ParseResult<Op[]> {
  const names = new Set([add, ...others]);
  const tokens = text.toLowerCase().replace(/[(),;]/g, " ").split(/\s+/).filter(Boolean);
  const ops: Op[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const name = aliases[tokens[i]] ?? tokens[i];
    if (!names.has(name)) return { ok: false, error: `Unknown operation "${tokens[i]}". Use ${[add, ...others].join(", ")}.` };
    if (name === add) {
      const raw = tokens[++i];
      if (raw === undefined || !/^\d{1,3}$/.test(raw)) return { ok: false, error: `${add} needs a whole number from 0 to ${MAX_VALUE}, like "${add} 7".` };
      const v = Number(raw);
      if (v > MAX_VALUE) return { ok: false, error: `Values go up to ${MAX_VALUE} so they fit in the blocks.` };
      ops.push({ name, v });
    } else ops.push({ name });
  }
  if (!ops.length) return { ok: false, error: "Type at least one operation." };
  if (ops.length > MAX_OPS) return { ok: false, error: `Keep it to ${MAX_OPS} operations or fewer so the steps stay readable.` };
  return { ok: true, input: ops };
}

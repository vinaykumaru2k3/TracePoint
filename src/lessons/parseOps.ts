import type { ParseResult } from "../engine/types";

export interface Op { name: string; v?: number }

export const MAX_OPS = 16;
export const MAX_VALUE = 99;

/**
 * Parse "push 4, push 9, peek, pop" into ops. `add` names (one or several) take one whole number 0..99.
 * `aliases` maps friendly names (enq, deq) onto the canonical ones.
 */
export function parseOps(text: string, add: string | string[], others: string[], aliases: Record<string, string> = {}): ParseResult<Op[]> {
  const valued = new Set(Array.isArray(add) ? add : [add]);
  const all = [...valued, ...others];
  const names = new Set(all);
  const tokens = text.toLowerCase().replace(/[(),;]/g, " ").split(/\s+/).filter(Boolean);
  const ops: Op[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const name = aliases[tokens[i]] ?? tokens[i];
    if (!names.has(name)) return { ok: false, error: `Unknown operation "${tokens[i]}". Use ${all.join(", ")}.` };
    if (valued.has(name)) {
      const raw = tokens[++i];
      if (raw === undefined || !/^\d{1,3}$/.test(raw)) return { ok: false, error: `${name} needs a whole number from 0 to ${MAX_VALUE}, like "${name} 7".` };
      const v = Number(raw);
      if (v > MAX_VALUE) return { ok: false, error: `Values go up to ${MAX_VALUE} so they fit in the blocks.` };
      ops.push({ name, v });
    } else ops.push({ name });
  }
  if (!ops.length) return { ok: false, error: "Type at least one operation." };
  if (ops.length > MAX_OPS) return { ok: false, error: `Keep it to ${MAX_OPS} operations or fewer so the steps stay readable.` };
  return { ok: true, input: ops };
}

export interface NumsInput { nums: number[]; k?: number }

/**
 * Parse a list of whole numbers, optionally followed by a keyword and one more number:
 * "2 7 11 15 target 9" or "1, 3, 2, 6; k 3". Negative numbers are allowed when `min` < 0.
 */
export function parseNums(
  text: string,
  o: { min?: number; max?: number; minLen?: number; maxLen: number; key?: string; keyMin?: number; keyMax?: number; keyRequired?: boolean }
): ParseResult<NumsInput> {
  const min = o.min ?? 0, max = o.max ?? MAX_VALUE, minLen = o.minLen ?? 1;
  let body = text.toLowerCase();
  let k: number | undefined;
  if (o.key) {
    const m = body.match(new RegExp(`\\b${o.key}\\b\\s*[=:]?\\s*(-?\\d+)\\s*$`));
    if (m) {
      k = Number(m[1]);
      body = body.slice(0, m.index);
      const kMin = o.keyMin ?? -999, kMax = o.keyMax ?? 999;
      if (k < kMin || k > kMax) return { ok: false, error: `${o.key} goes from ${kMin} to ${kMax}.` };
    } else if (o.keyRequired) return { ok: false, error: `End with "${o.key} N", like "… ${o.key} 9".` };
  }
  const tokens = body.replace(/[[\](),;]/g, " ").split(/\s+/).filter(Boolean);
  const nums: number[] = [];
  for (const t of tokens) {
    if (!/^-?\d{1,3}$/.test(t)) return { ok: false, error: `"${t}" is not a whole number.` };
    const v = Number(t);
    if (v < min || v > max) return { ok: false, error: `Numbers go from ${min} to ${max} so they fit in the cells.` };
    nums.push(v);
  }
  if (nums.length < minLen) return { ok: false, error: `Type at least ${minLen} number${minLen === 1 ? "" : "s"}.` };
  if (nums.length > o.maxLen) return { ok: false, error: `Keep it to ${o.maxLen} numbers or fewer so every cell fits.` };
  return { ok: true, input: { nums, k } };
}

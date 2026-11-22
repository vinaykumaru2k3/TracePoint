/** The growth ladder, slowest first. A cost string's class is its rank on this ladder. */
export const LADDER = ["O(1)", "O(log n)", "O(n)", "O(n log n)", "O(n²)", "O(2ⁿ)", "O(n!)"] as const;

/** Rank of the first big-O class in `cost` on `LADDER`, or null when it names none.
 *  Linear forms in other letters (`O(k)`, `O(n + k)`, `O(m + n)`) rank as O(n). */
export function growthRank(cost: string): number | null {
  const m = cost.match(/O\(([^)]*)\)/);
  if (!m) return null;
  const e = m[1].replace(/\s+/g, "").replace(/²/g, "^2").replace(/ⁿ/g, "^n").replace(/[·×]/g, "*");
  if (e.includes("!")) return 6;
  if (/2\^n/.test(e)) return 5;
  if (/\^2/.test(e) || /^([a-z])\*\1$/.test(e)) return 4;
  if (/^[a-z]\*?log[a-z]$/.test(e) || e === "nlogn") return 3;
  if (/^log[a-z]$/.test(e)) return 1;
  if (e === "1") return 0;
  if (/^[a-z](\+[a-z])*$/.test(e)) return 2;
  if (/^[a-z]\*[a-z]$/.test(e)) return 4;
  return null;
}

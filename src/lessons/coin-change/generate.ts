import type { Step } from "../../engine/types";
import type { BlockState } from "../../iso/IsoBlock";
import type { Cell } from "../../iso/CellRow";
import type { DPState } from "../dpkit";

export interface CoinInput { coins: number[]; amount: number }

export type CoinState = DPState & {
  op: string | null;
  /** The amount being worked on, or null outside the loop. */
  a: number | null;
  /** The coin being tried, or null outside the inner loop. */
  coin: number | null;
  /** Cells that hold a number or ∞ so far. */
  filled: number;
  /** dp[k] as a number, or Infinity while no way is known. */
  dp: number[];
  /** Coins picked by the traceback so far. */
  picked: number[];
};

const show = (x: number) => (x === Infinity ? "∞" : x);

/** Bottom-up coin change: dp[a] = fewest coins that make a, or ∞ when no way is known. */
export function generateCoinChange({ coins, amount }: CoinInput): Step<CoinState>[] {
  const dp: number[] = Array.from({ length: amount + 1 }, () => Infinity);
  const picked: number[] = [];
  let filled = 0;
  const steps: Step<CoinState>[] = [];

  const snap = (
    st: Omit<Step<CoinState>, "state" | "op">,
    v: { op?: string; a?: number; coin?: number; mark?: Record<number, BlockState>; strip?: "coins" | "picked"; slots?: number } = {}
  ) => {
    const cells: Cell[] = dp.map((x, k) => ({ v: show(x), state: v.mark?.[k] }));
    const op = v.op ?? null;
    const tryIdx = v.coin === undefined ? -1 : coins.indexOf(v.coin);
    const strip = v.strip === "picked"
      ? { name: "picked", cells: picked.map((c) => ({ v: c, state: "found" as BlockState })), slots: v.slots }
      : {
          name: "coins",
          cells: coins.map((c, i) => ({ v: c, state: i === tryIdx ? ("active" as BlockState) : undefined }))
        };
    steps.push({
      ...st, op,
      state: {
        kind: "row", cells, name: "dp",
        ptrs: v.a !== undefined ? [{ at: v.a, label: "a" }] : [],
        strip,
        op, a: v.a ?? null, coin: v.coin ?? null, filled, dp: dp.slice(), picked: picked.slice()
      }
    });
  };

  snap({
    kind: "problem", anchors: [], notes: {},
    title: "Fewest coins for an amount",
    idea: "The fewest coins for an amount is one coin plus the fewest coins for what is left. Fill a table from 0 upward so every smaller answer is ready.",
    text: `The coins are ${coins.join(", ")} and the amount is ${amount}. dp[a] is the fewest coins that make a. A cell shows ∞ while no way to make it is known yet. We fill dp from 0 up to ${amount}.`
  }, { strip: "coins" });

  dp[0] = 0; filled = amount + 1;
  snap({
    kind: "add", anchors: ["coin.init", "coin.base"],
    notes: { "coin.init": `dp = ${amount + 1} cells, all ∞`, "coin.base": "dp[0] = 0" },
    title: "Base case: dp[0] = 0",
    idea: "Zero coins make amount 0. Every other cell starts at ∞, meaning no way known yet, so any real count will beat it.",
    text: "Amount 0 needs no coins, so dp[0] = 0. All other cells start at ∞. A way to make a cell can only replace ∞ or a larger count."
  }, { op: "dp[0]=0", mark: { 0: "active" }, strip: "coins" });

  for (let a = 1; a <= amount; a++) {
    for (const c of coins) {
      if (c > a) continue;
      const from = dp[a - c];
      const cand = from + 1;
      const beats = cand < dp[a];
      const before = dp[a];
      const candText = from === Infinity ? "∞" : String(cand);
      if (beats) {
        dp[a] = cand;
        snap({
          kind: "add", anchors: ["coin.try", "coin.take"],
          notes: { "coin.try": `a = ${a}, coin = ${c}`, "coin.take": `dp[${a}] = dp[${a - c}] + 1 = ${cand}` },
          title: `Coin ${c} gives dp[${a}] = ${cand}`,
          idea: "Using this coin, the rest is amount a minus the coin. One more coin than that cell is a candidate, and a smaller candidate replaces the old value.",
          text: `Coin ${c} leaves ${a - c}, and dp[${a - c}] = ${from}. That is ${cand} coin${cand === 1 ? "" : "s"}, fewer than ${show(before)}, so dp[${a}] becomes ${cand}.`
        }, { op: `a${a} c${c}`, a, coin: c, mark: { [a]: "active", [a - c]: "compare" } });
      } else {
        snap({
          kind: "check", anchors: ["coin.try"],
          notes: { "coin.try": `a = ${a}, coin = ${c}: ${candText} does not beat ${show(before)}` },
          title: `Coin ${c} does not beat dp[${a}] = ${show(before)}`,
          idea: "A coin only helps when it gives a smaller count. A cell that shows ∞ for the rest gives no way at all.",
          text: from === Infinity
            ? `Coin ${c} leaves ${a - c}, and dp[${a - c}] is ∞, so there is no way yet. dp[${a}] stays ${show(before)}.`
            : `Coin ${c} leaves ${a - c}, and dp[${a - c}] = ${from}. That is ${cand} coins, not fewer than ${show(before)}, so dp[${a}] stays.`
        }, { op: `a${a} c${c}`, a, coin: c, mark: { [a]: "compare", [a - c]: "compare" } });
      }
    }
  }

  const best = dp[amount];
  const reachable = best !== Infinity;
  if (reachable) {
    const path: Record<number, BlockState> = { [amount]: "found" };
    const total = best;
    let a = amount;
    while (a > 0) {
      const c = coins.find((x) => x <= a && dp[a - x] + 1 === dp[a]) as number;
      picked.push(c);
      path[a - c] = "found";
      snap({
        kind: "found", anchors: ["coin.trace"],
        notes: { "coin.trace": `dp[${a - c}] + 1 = dp[${a}], so coin ${c} was used` },
        title: `Coin ${c} was used at ${a}`,
        idea: "To see which coins were used, step back from the answer. A coin was used when the cell it leaves plus one equals the cell you stand on.",
        text: `dp[${a}] = ${dp[a]}, and dp[${a - c}] + 1 = ${dp[a - c] + 1}. So coin ${c} was used, and we move to ${a - c}.`
      }, { op: `pick ${c}@${a}`, a, mark: { ...path }, strip: "picked", slots: total });
      a -= c;
    }
  }

  const loops = amount;
  snap({
    kind: "recap", anchors: ["coin.ret"], notes: { "coin.ret": reachable ? `return ${best}` : "return -1" },
    title: reachable ? `${best} coin${best === 1 ? "" : "s"} for ${amount}` : `No way to make ${amount}`,
    idea: "Each cell tries each coin once, so the work grows with the amount times the number of coins. A cell left at ∞ means that amount cannot be made.",
    text: reachable
      ? amount === 0
        ? "Amount 0 needs 0 coins, and the loop never ran. The answer is dp[0] = 0."
        : `The fewest coins is ${best}: ${picked.join(" + ")} = ${amount}. The loop ran for ${loops} amount${loops === 1 ? "" : "s"}, trying each coin that fits.`
      : `dp[${amount}] is still ∞ after every coin was tried, so no mix of the coins makes ${amount}. The answer is -1, which stands for "impossible".`,
    ret: reachable ? String(best) : "-1",
    retNote: reachable ? `fewest coins = ${best}` : `${amount} cannot be made`
  }, { op: reachable ? `return ${best}` : "return -1", mark: reachable ? { [amount]: "found" } : {}, strip: "picked", slots: reachable ? best : 0 });
  return steps;
}

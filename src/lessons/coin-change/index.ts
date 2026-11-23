import { defineLesson } from "../../engine/types";
import DPScene from "../DPScene";
import { parseInts } from "../dpkit";
import { generateCoinChange, type CoinInput, type CoinState } from "./generate";
import java from "./code/Main.java?raw";
import python from "./code/main.py?raw";
import cpp from "./code/main.cpp?raw";
import theory from "./theory";

const FORMAT = 'Type the coins and the amount, like "coins 1 3 4, amount 6".';

export default defineLesson<CoinInput, CoinState>({
  id: "coin-change",
  title: "Coin change",
  subtitle: "Bottom-up table: the fewest coins for an amount is one coin plus the fewest for what is left.",
  minutes: 7,
  level: "intermediate",
  section: "dp",

  inputLabel: "coins, amount",
  inputHint: "Up to 4 different coins from 1 to 20, then an amount from 0 to 12. Example: coins 1 3 4, amount 6.",
  defaultText: "coins 1 3 4, amount 6",
  presets: [
    { label: "1 3 4 → 6", text: "coins 1 3 4, amount 6" },
    { label: "2 → 5 (no way)", text: "coins 2, amount 5" },
    { label: "1 2 5 → 11", text: "coins 1 2 5, amount 11" }
  ],
  parse: (text) => {
    const m = /^\s*coins?\s*[:=]?\s*([^]*?)[\s,;]+amount\s*[:=]?\s*([^]*)$/i.exec(text);
    if (!m) return { ok: false, error: FORMAT };
    const c = parseInts(m[1], { min: 1, max: 20, maxCount: 4 });
    if (!c.ok) return { ok: false, error: `Coins: ${c.error}` };
    if (new Set(c.input).size !== c.input.length) return { ok: false, error: "Each coin value should appear once. Remove the repeated coin." };
    const a = parseInts(m[2], { min: 0, max: 12, maxCount: 1 });
    if (!a.ok) return { ok: false, error: `Amount: ${a.error}` };
    return { ok: true, input: { coins: c.input, amount: a.input[0] } };
  },
  generate: generateCoinChange,

  Scene: DPScene,
  legend: [{ cls: "s-active", label: "cell or coin being used" }, { cls: "s-compare", label: "cells read" }, { cls: "s-found", label: "answer and coins picked" }],
  metrics: ({ state: s }) => [
    { label: "a", value: s.a ?? "-" },
    { label: "Coin", value: s.coin ?? "-" },
    { label: "Table size", value: s.dp.length }
  ],
  memory: ({ state: s }) => ({
    title: "In memory: int[] dp",
    note: "One cell per amount from 0 to the target. A cell holds the fewest coins found so far, or the sentinel amount + 1, drawn here as ∞.",
    cells: s.dp.map((v, i) => {
      const st = s.kind === "row" ? s.cells[i].state : undefined;
      return {
        v: v === Infinity ? "∞" : v, tag: `dp[${i}]`, live: v !== Infinity,
        act: st === "active" || st === "compare",
        tone: st === "compare" ? ("compare" as const) : undefined, marks: []
      };
    })
  }),
  vars: ({ state: s }) => `a = ${s.a ?? "-"}   dp = [${s.dp.map((v) => (v === Infinity ? "∞" : v)).join(" ")}]`,
  costs: [["time", "O(n × k)"], ["table", "O(n)"], ["recursion", "none"]],
  learn: [
    ["dp[0] = 0 and every other cell starts at ∞", (s) => s.anchors.includes("coin.base")],
    ["a coin that does not beat the cell changes nothing", (s) => s.kind === "check"],
    ["a better coin overwrites the cell", (s) => s.anchors.includes("coin.take")],
    ["the traceback names the coins used", (s) => s.anchors.includes("coin.trace")]
  ],

  theory,

  code: { java, python, cpp }
});

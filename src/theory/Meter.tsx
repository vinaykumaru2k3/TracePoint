import { LADDER, growthRank } from "./growth";

const TONE = ["found", "found", "found", "active", "swap", "swap", "swap"];

/** A small bar meter for a cost: seven bars, one per class on the growth ladder, filled up to the cost's class. */
export function GrowthMeter({ cost }: { cost: string }) {
  const r = growthRank(cost);
  if (r === null) return null;
  return (
    <svg className={`meter t-${TONE[r]}`} width={40} height={14} viewBox="0 0 40 14" role="img" aria-label={`grows like ${LADDER[r]}, ${r + 1} of ${LADDER.length} on the growth ladder`}>
      {LADDER.map((_, i) => {
        const h = 4 + i * (10 / 6);
        return <rect key={i} className={i <= r ? "on" : ""} x={0.5 + i * 5.6} y={13.5 - h} width={4} height={h} rx={0.6} />;
      })}
    </svg>
  );
}

/** A cost with its meter beside it. */
export function Cost({ children }: { children: string }) {
  return <span className="cost"><span className="cost-v">{children}</span><GrowthMeter cost={children} /></span>;
}

import type { ReactNode } from "react";

export function Badge({ children, tone }: { children: ReactNode; tone?: string }) {
  return <span className="badge" style={tone ? { background: tone } : undefined}>{children}</span>;
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="kbd">{children}</kbd>;
}

export function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="metric">
      <small>{label}</small>
      <b>{value}</b>
    </div>
  );
}

const CHIP: Record<string, string> = {
  problem: "var(--c-lav)", add: "var(--c-green)", remove: "var(--c-pink)", peek: "var(--c-blue)", empty: "var(--c-amber)", recap: "var(--c-lav)"
};

/** The step-kind chip. Cycle 2 reuses the kinds to build "predict the next step" choices. */
export function KindChip({ kind }: { kind: string }) {
  return <span className="chip" style={{ background: CHIP[kind] ?? "var(--surface-2)" }}>{kind}</span>;
}

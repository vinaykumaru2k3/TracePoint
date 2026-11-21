import type { ReactNode } from "react";

/** One stroke set, drawn on a 16px grid at 1.6 stroke. Decorative: the control carries the name. */
const PATHS = {
  play: "M5 3.5v9l7-4.5z",
  pause: "M5.5 3.5v9M10.5 3.5v9",
  replay: "M3.5 8a4.5 4.5 0 1 0 1.4-3.3M3.5 2.8v2.4h2.4",
  left: "M13 8H3.5M7.5 4 3.5 8l4 4",
  right: "M3 8h9.5M8.5 4l4 4-4 4",
  search: "M7 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM10.6 10.6 14 14",
  sun: "M8 10.8a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6zM8 1.5v1.4M8 13.1v1.4M1.5 8h1.4M13.1 8h1.4M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1",
  moon: "M13.5 9.6A5.6 5.6 0 0 1 6.4 2.5a5.6 5.6 0 1 0 7.1 7.1z",
  spark: "M8 2v3M8 11v3M2 8h3M11 8h3M8 5.5 9 7l1.5 1L9 9l-1 1.5L7 9 5.5 8 7 7z",
  course: "M2.5 4h11M2.5 8h11M2.5 12h7",
  close: "M4 4l8 8M12 4l-8 8",
  folder: "M2 4.5a1 1 0 0 1 1-1h3.2l1.5 1.7H13a1 1 0 0 1 1 1V11.5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z",
  help: "M8 14.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM6.2 6.3a1.9 1.9 0 1 1 2.6 1.8c-.5.2-.8.6-.8 1.1v.4M8 11.6v.1",
  file: "M4 2h5.5l3 3v8.5a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5v-11A.5.5 0 0 1 4 2zM9.5 2v3h3M5.8 8.2h4.4M5.8 10.8h4.4",
  check: "M3.5 8.4 6.6 11.5 12.5 4.8",
  link: "M6.8 9.2a2.6 2.6 0 0 0 3.7 0l2.2-2.2a2.6 2.6 0 0 0-3.7-3.7l-.6.6M9.2 6.8a2.6 2.6 0 0 0-3.7 0L3.3 9a2.6 2.6 0 0 0 3.7 3.7l.6-.6"
} as const;
export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 14 }: { name: IconName; size?: number }) {
  const filled = name === "play";
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d={PATHS[name]} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
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
  problem: "var(--c-lav)", add: "var(--c-green)", remove: "var(--c-pink)", peek: "var(--c-blue)", empty: "var(--c-amber)",
  check: "var(--c-blue)", move: "var(--c-amber)", found: "var(--c-green)", recap: "var(--c-lav)"
};

/** The step-kind chip. Cycle 2 reuses the kinds to build "predict the next step" choices. */
export function KindChip({ kind }: { kind: string }) {
  return <span className="chip" style={{ background: CHIP[kind] ?? "var(--surface-2)" }}>{kind}</span>;
}

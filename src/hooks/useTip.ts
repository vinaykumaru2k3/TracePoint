import { useEffect } from "react";
import { useStoredFlag } from "./useStoredFlag";

export const TIP_KEY = "tracepoint-tip-seen";

/** The first-visit trace tip: shown on steps 1 and 2 until dismissed, and remembered as seen once the viewer reaches step 3. */
export function useTip(idx: number): { showTip: boolean; dismissTip(): void } {
  const [seen, setSeen] = useStoredFlag(TIP_KEY, false);
  useEffect(() => { if (idx >= 2 && !seen) setSeen(true); }, [idx, seen, setSeen]);
  return { showTip: !seen && idx < 2, dismissTip: () => setSeen(true) };
}

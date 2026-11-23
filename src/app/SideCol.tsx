import type { ReactNode } from "react";
import { Icon } from "../design/ui";

interface Props { open: boolean; onToggle(): void; children: ReactNode }

/**
 * The desktop EXPLORER column with its fold toggle. Folded, it narrows to a strip that keeps only the
 * toggle; the tree stays mounted (so its open folders survive) but is hidden from focus and readers.
 */
export default function SideCol({ open, onToggle, children }: Props) {
  return (
    <div className={`side-col${open ? "" : " shut"}`}>
      <button
        className="icon-btn side-toggle"
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls="explorer"
        aria-label="Explorer"
        title={open ? "Hide explorer" : "Show explorer"}
      >
        <Icon name="panel" size={16} />
      </button>
      <div className="side-body" id="explorer">{children}</div>
    </div>
  );
}

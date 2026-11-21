import { useEffect, useRef, type ReactNode } from "react";
import { Icon } from "../design/ui";

interface Props { open: boolean; onClose(): void; children: ReactNode }

export const NARROW = "(max-width: 1120px), (max-height: 680px)";

/**
 * The course tree on narrow screens: a modal <dialog> sliding in from the left. Esc, a click on the
 * backdrop, the close button and following a link all close it. Focus returns to the opener.
 */
export default function CourseDrawer({ open, onClose, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  /* Widening the window brings the in-page sidebar back, so the drawer goes away. */
  useEffect(() => {
    const mq = window.matchMedia(NARROW);
    const onChange = () => { if (!mq.matches) onClose(); };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      id="course-drawer"
      className="drawer"
      aria-label="Course"
      onClose={onClose}
      onClick={(e) => {
        /* The dialog box itself is the backdrop area; the sheet is its only child. */
        if (e.target === e.currentTarget) onClose();
        else if ((e.target as HTMLElement).closest("a[href]")) onClose();
      }}
    >
      <div className="drawer-sheet">
        <button className="icon-btn drawer-close" type="button" onClick={onClose} aria-label="Close course" autoFocus>
          <Icon name="close" />
        </button>
        {children}
      </div>
    </dialog>
  );
}

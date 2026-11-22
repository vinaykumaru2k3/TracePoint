import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CURRICULUM } from "../curriculum";
import { LESSON_BY_ID } from "../lessons";
import { GUIDES } from "../theory";

interface Props { open: boolean; onClose(): void }

/** What search can open: each guide (as "<Section> guide"), then every live lesson. */
export const SEARCH_ITEMS: { name: string; section: string; to: string }[] = [
  ...CURRICULUM.filter((s) => GUIDES[s.id]).map((s) => ({ name: `${s.name} guide`, section: s.name, to: `/guide/${s.id}` })),
  ...CURRICULUM.flatMap((s) => s.lessons.filter((l) => LESSON_BY_ID[l.id]).map((l) => ({ name: l.name, section: s.name, to: `/${l.id}/1` })))
];
const SOON = CURRICULUM.flatMap((s) => s.lessons.filter((l) => !LESSON_BY_ID[l.id]).map((l) => ({ name: l.name, section: s.name })));
const ALL = [...SEARCH_ITEMS.map((i) => ({ ...i, live: true })), ...SOON.map((i) => ({ ...i, to: "", live: false }))];

/** Ctrl/Cmd+K lesson search on a native <dialog>. */
export default function SearchDialog({ open, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const navigate = useNavigate();

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    const hits = t ? ALL.filter((l) => (l.name + " " + l.section).toLowerCase().includes(t)) : ALL;
    return hits.slice(0, 30);
  }, [q]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) { setQ(""); setSel(0); d.showModal(); }
    if (!open && d.open) d.close();
  }, [open]);

  const choose = (i: number) => {
    const r = results[i];
    if (!r || !r.live) return;
    onClose();
    navigate(r.to);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { setSel((s) => Math.min(results.length - 1, s + 1)); e.preventDefault(); }
    else if (e.key === "ArrowUp") { setSel((s) => Math.max(0, s - 1)); e.preventDefault(); }
    else if (e.key === "Enter") { choose(sel); e.preventDefault(); }
  };

  return (
    <dialog ref={ref} className="search" onClose={onClose} aria-label="Search lessons"
      onClick={(e) => { if (e.target === ref.current) onClose(); }}>
      <input autoFocus value={q} onChange={(e) => { setQ(e.target.value); setSel(0); }} onKeyDown={onKey}
        placeholder="Search lessons…" aria-label="Search lessons" />
      {results.length === 0
        ? <p className="empty">Nothing matches "{q}".</p>
        : (
          <ul>
            {results.map((r, i) => (
              <li key={r.to || r.name}>
                <button aria-selected={i === sel} disabled={!r.live} onClick={() => choose(i)} onMouseMove={() => setSel(i)}>
                  {r.name}<small>{r.section}{r.live ? "" : " · soon"}</small>
                </button>
              </li>
            ))}
          </ul>
        )}
    </dialog>
  );
}

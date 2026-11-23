import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CURRICULUM } from "../curriculum";
import { META_BY_ID } from "../lessons/meta";
import { GUIDES } from "../theory";

interface Props { open: boolean; onClose(): void; /** Tests only: the text the box starts with. */ initialQuery?: string }

/** What search can open: each guide (as "<Section> guide"), then every live lesson. */
export const SEARCH_ITEMS: { name: string; section: string; to: string }[] = [
  ...CURRICULUM.filter((s) => GUIDES[s.id]).map((s) => ({ name: `${s.name} guide`, section: s.name, to: `/guide/${s.id}` })),
  ...CURRICULUM.flatMap((s) => s.lessons.filter((l) => META_BY_ID[l.id]).map((l) => ({ name: l.name, section: s.name, to: `/${l.id}/1` })))
];
const SOON = CURRICULUM.flatMap((s) => s.lessons.filter((l) => !META_BY_ID[l.id]).map((l) => ({ name: l.name, section: s.name })));
const ALL = [...SEARCH_ITEMS.map((i) => ({ ...i, live: true })), ...SOON.map((i) => ({ ...i, to: "", live: false }))];

export const countText = (n: number) => (n === 0 ? "No results" : n === 1 ? "1 result" : `${n} results`);

/** Ctrl/Cmd+K lesson search on a native <dialog>. */
export default function SearchDialog({ open, onClose, initialQuery = "" }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [q, setQ] = useState(initialQuery);
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

  const [status, setStatus] = useState(() => countText(results.length));
  useEffect(() => {
    const t = setTimeout(() => setStatus(countText(results.length)), 350);
    return () => clearTimeout(t);
  }, [results.length]);

  useEffect(() => {
    if (open) document.getElementById("search-opt-" + sel)?.scrollIntoView({ block: "nearest" });
  }, [sel, open]);

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
        role="combobox" aria-expanded={results.length > 0} aria-controls={results.length > 0 ? "search-list" : undefined} aria-autocomplete="list"
        aria-activedescendant={results.length > 0 ? "search-opt-" + sel : undefined}
        placeholder="Search lessons…" aria-label="Search lessons" />
      <p role="status" className="sr">{status}</p>
      {results.length === 0
        ? <p className="empty">Nothing matches "{q}".</p>
        : (
          <ul id="search-list" role="listbox" aria-label="Results">
            {results.map((r, i) => (
              <li key={r.to || r.name} id={"search-opt-" + i} role="option" aria-selected={i === sel}
                aria-disabled={!r.live || undefined} onClick={() => choose(i)} onMouseMove={() => setSel(i)}>
                {r.name}<small>{r.section}{r.live ? "" : " · soon"}</small>
              </li>
            ))}
          </ul>
        )}
    </dialog>
  );
}

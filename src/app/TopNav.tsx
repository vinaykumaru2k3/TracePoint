import { Link } from "react-router-dom";
import { DEFAULT_LESSON } from "../lessons";
import { Kbd } from "../design/ui";

interface Props { dark: boolean; onTheme(): void; onSearch(): void }

export default function TopNav({ dark, onTheme, onSearch }: Props) {
  return (
    <header className="topnav">
      <Link to={`/${DEFAULT_LESSON}/1`} className="brand" aria-label="Tracepoint home"><i aria-hidden="true" />Tracepoint</Link>
      <nav className="tabs" aria-label="Sections">
        <span className="tab on" aria-current="page">Learn</span>
        <span className="tab" aria-disabled="true">Practice<small>soon</small></span>
        <span className="tab" aria-disabled="true">Quiz<small>soon</small></span>
      </nav>
      <span className="spacer" />
      <button className="search-btn" onClick={onSearch} aria-label="Search lessons">
        <span>Search lessons</span><Kbd>Ctrl K</Kbd>
      </button>
      <button className="btn" onClick={onTheme} aria-pressed={dark}>{dark ? "Light" : "Dark"}</button>
    </header>
  );
}

import { Link } from "react-router-dom";
import { DEFAULT_LESSON } from "../lessons";
import { Icon, Kbd } from "../design/ui";

interface Props { dark: boolean; onTheme(): void; onSearch(): void; courseOpen: boolean; onCourse(): void }

export default function TopNav({ dark, onTheme, onSearch, courseOpen, onCourse }: Props) {
  return (
    <header className="topnav">
      <button className="icon-btn course-btn" type="button" onClick={onCourse} aria-expanded={courseOpen} aria-controls="course-drawer" aria-label="Course">
        <Icon name="course" size={16} />
      </button>
      <Link to={`/${DEFAULT_LESSON}/1`} className="brand" aria-label="Tracepoint home"><i aria-hidden="true" />tracepoint</Link>
      <nav className="tabs" aria-label="Sections">
        <span className="tab on" aria-current="page">Learn</span>
        <span className="tab soon" aria-disabled="true">Practice<small>soon</small></span>
        <span className="tab soon" aria-disabled="true">Quiz<small>soon</small></span>
      </nav>
      <span className="spacer" />
      <button className="search-btn" type="button" onClick={onSearch} aria-label="Search lessons" aria-keyshortcuts="Control+K">
        <Icon name="search" /><span>Search lessons</span><Kbd>Ctrl K</Kbd>
      </button>
      <button className="icon-btn" type="button" {...({ popovertarget: "help" } as object)} aria-label="How to use" title="How to use">
        <Icon name="help" size={16} />
      </button>
      <button className="icon-btn" type="button" onClick={onTheme} aria-pressed={dark} aria-label="Dark theme" title={dark ? "Dark theme on" : "Dark theme off"}>
        <Icon name={dark ? "moon" : "sun"} size={16} />
      </button>
      <div id="help" className="help card" {...({ popover: "auto" } as object)}>
        <h2>How to use</h2>
        <dl>
          <dt><Kbd>←</Kbd> <Kbd>→</Kbd></dt><dd>Step back and forward</dd>
          <dt><Kbd>Home</Kbd> <Kbd>End</Kbd></dt><dd>First and last step</dd>
          <dt><Kbd>Space</Kbd></dt><dd>Play or pause</dd>
          <dt><Kbd>R</Kbd></dt><dd>Back to the start</dd>
          <dt><Kbd>Ctrl K</Kbd></dt><dd>Search lessons</dd>
        </dl>
        <h3>Colours</h3>
        <p>Colour only marks state. Each lesson lists its own colours under the diagram; the common ones are:</p>
        <ul className="help-key">
          <li><i className="swatch s-active" />amber: the thing this step touches</li>
          <li><i className="swatch s-compare" />blue: being compared</li>
          <li><i className="swatch s-found" />green: found or done</li>
          <li><i className="swatch s-visited" />sand: a slot or node that was just looked at</li>
        </ul>
        <h3>Your own input</h3>
        <p>Type values under the diagram and press Run. Copy link shares that exact run.</p>
      </div>
    </header>
  );
}

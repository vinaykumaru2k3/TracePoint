import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { DEFAULT_EXPLORER, useExplorer, type ExplorerKind, type ExplorerPrefs } from "../hooks/useExplorer";
import { useProgress, type Progress } from "../hooks/useProgress";
import { useTheme } from "../hooks/useTheme";
import ErrorBoundary, { PageError } from "./ErrorBoundary";
import GuidePage from "./GuidePage";
import LessonPage from "./LessonPage";
import SearchDialog from "./SearchDialog";
import TopNav from "./TopNav";

interface RoutesProps {
  progress: Progress; onVisit(id: string, idx: number): void; courseOpen: boolean; onCloseCourse(): void;
  /** Desktop explorer state per kind of page; defaults to folded on traces, open elsewhere. */
  explorer?: ExplorerPrefs; onExplorer?(kind: ExplorerKind, open: boolean): void;
}

const noop = () => {};

/** Trace pages only: the step controls exist there and nowhere else. */
export function SkipLink() {
  const { pathname } = useLocation();
  const parts = pathname.split("/").filter(Boolean);
  if (!parts.length || parts[0] === "guide" || parts[1] === "learn") return null;
  const go = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    /* The desktop Back/Next is hidden on a phone, where the step bar stands in. */
    const bars = [...document.querySelectorAll<HTMLElement>("#step-controls, [data-step-controls]")];
    bars.find((el) => el.getClientRects().length > 0)?.querySelector("button")?.focus();
  };
  return <a className="skip" href="#step-controls" onClick={go}>Skip to step controls</a>;
}

/** The page routes, split out so a test can mount them in a MemoryRouter. */
export function AppRoutes({ progress, onVisit, courseOpen, onCloseCourse, explorer = DEFAULT_EXPLORER, onExplorer = noop }: RoutesProps) {
  const side = { explorer, onExplorer };
  const page = (view: "theory" | "trace") => <LessonPage view={view} progress={progress} onVisit={onVisit} courseOpen={courseOpen} onCloseCourse={onCloseCourse} {...side} />;
  const guide = (id?: string) => <GuidePage sectionId={id} progress={progress} courseOpen={courseOpen} onCloseCourse={onCloseCourse} {...side} />;
  /* A render error shows a message in place of the page; moving to another page clears it. */
  const { pathname } = useLocation();
  return (
    <ErrorBoundary resetKey={pathname} fallback={() => <PageError />}>
    <Routes>
      <Route path="/" element={guide("foundations")} />
      <Route path="/guide/:sectionId" element={guide()} />
      <Route path="/:lessonId" element={page("trace")} />
      <Route path="/:lessonId/learn" element={page("theory")} />
      <Route path="/:lessonId/:step" element={page("trace")} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </ErrorBoundary>
  );
}

export default function App() {
  const [progress, visit] = useProgress();
  const [dark, toggleTheme] = useTheme();
  const [explorer, setExplorer] = useExplorer();
  const [searching, setSearching] = useState(false);
  const [courseOpen, setCourseOpen] = useState(false);
  /* Focus goes back to the opener, also when a link swapped the page out from under the drawer. */
  const openRef = useRef(false);
  openRef.current = courseOpen;
  const closeCourse = useCallback(() => {
    if (!openRef.current) return;
    setCourseOpen(false);
    requestAnimationFrame(() => document.querySelector<HTMLElement>(".course-btn")?.focus());
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setSearching((s) => !s); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="app">
      <SkipLink />
      <TopNav dark={dark} onTheme={toggleTheme} onSearch={() => setSearching(true)} courseOpen={courseOpen} onCourse={() => setCourseOpen(true)} />
      <AppRoutes progress={progress} onVisit={visit} courseOpen={courseOpen} onCloseCourse={closeCourse} explorer={explorer} onExplorer={setExplorer} />
      <SearchDialog open={searching} onClose={() => setSearching(false)} />
    </div>
  );
}

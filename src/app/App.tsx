import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useProgress, type Progress } from "../hooks/useProgress";
import { useTheme } from "../hooks/useTheme";
import GuidePage from "./GuidePage";
import LessonPage from "./LessonPage";
import SearchDialog from "./SearchDialog";
import TopNav from "./TopNav";

interface RoutesProps { progress: Progress; onVisit(id: string, idx: number): void; courseOpen: boolean; onCloseCourse(): void }

/** The page routes, split out so a test can mount them in a MemoryRouter. */
export function AppRoutes({ progress, onVisit, courseOpen, onCloseCourse }: RoutesProps) {
  const page = (view: "theory" | "trace") => <LessonPage view={view} progress={progress} onVisit={onVisit} courseOpen={courseOpen} onCloseCourse={onCloseCourse} />;
  const guide = (id?: string) => <GuidePage sectionId={id} progress={progress} courseOpen={courseOpen} onCloseCourse={onCloseCourse} />;
  return (
    <Routes>
      <Route path="/" element={guide("foundations")} />
      <Route path="/guide/:sectionId" element={guide()} />
      <Route path="/:lessonId" element={page("trace")} />
      <Route path="/:lessonId/learn" element={page("theory")} />
      <Route path="/:lessonId/:step" element={page("trace")} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  const [progress, visit] = useProgress();
  const [dark, toggleTheme] = useTheme();
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
      <TopNav dark={dark} onTheme={toggleTheme} onSearch={() => setSearching(true)} courseOpen={courseOpen} onCourse={() => setCourseOpen(true)} />
      <AppRoutes progress={progress} onVisit={visit} courseOpen={courseOpen} onCloseCourse={closeCourse} />
      <SearchDialog open={searching} onClose={() => setSearching(false)} />
    </div>
  );
}

import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useProgress } from "../hooks/useProgress";
import { useTheme } from "../hooks/useTheme";
import { DEFAULT_LESSON } from "../lessons";
import LessonPage from "./LessonPage";
import SearchDialog from "./SearchDialog";
import TopNav from "./TopNav";

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

  const page = <LessonPage progress={progress} onVisit={visit} courseOpen={courseOpen} onCloseCourse={closeCourse} />;
  return (
    <div className="app">
      <TopNav dark={dark} onTheme={toggleTheme} onSearch={() => setSearching(true)} courseOpen={courseOpen} onCourse={() => setCourseOpen(true)} />
      <Routes>
        <Route path="/" element={<Navigate to={`/${DEFAULT_LESSON}/1`} replace />} />
        <Route path="/:lessonId" element={page} />
        <Route path="/:lessonId/:step" element={page} />
        <Route path="*" element={<Navigate to={`/${DEFAULT_LESSON}/1`} replace />} />
      </Routes>
      <SearchDialog open={searching} onClose={() => setSearching(false)} />
    </div>
  );
}

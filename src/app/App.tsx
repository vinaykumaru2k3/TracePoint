import { useEffect, useState } from "react";
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setSearching((s) => !s); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="app">
      <TopNav dark={dark} onTheme={toggleTheme} onSearch={() => setSearching(true)} />
      <Routes>
        <Route path="/" element={<Navigate to={`/${DEFAULT_LESSON}/1`} replace />} />
        <Route path="/:lessonId" element={<LessonPage progress={progress} onVisit={visit} />} />
        <Route path="/:lessonId/:step" element={<LessonPage progress={progress} onVisit={visit} />} />
        <Route path="*" element={<Navigate to={`/${DEFAULT_LESSON}/1`} replace />} />
      </Routes>
      <SearchDialog open={searching} onClose={() => setSearching(false)} />
    </div>
  );
}

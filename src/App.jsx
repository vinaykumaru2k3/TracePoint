import { LESSONS } from "./data/lessons.js";
import { useHashRoute } from "./hooks/useHashRoute.js";
import { useProgress } from "./hooks/useProgress.js";
import { useTheme } from "./hooks/useTheme.js";
import Topbar from "./components/Topbar.jsx";
import Lesson from "./components/Lesson.jsx";

export default function App() {
  const route = useHashRoute();
  const id = LESSONS[route] ? route : "stack";
  const [progress, visit] = useProgress();
  const [dark, toggleTheme] = useTheme();

  return (
    <div className="app">
      <Topbar dark={dark} onToggle={toggleTheme} />
      <div className="main">
        <Lesson key={id} id={id} progress={progress} onVisit={visit} />
      </div>
    </div>
  );
}

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./app/App";
import { applySavedTheme } from "./hooks/useTheme";
import "./design/tokens.css";
import "./app.css";

applySavedTheme();
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>
);

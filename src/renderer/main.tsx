import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import HelpPanel from "./components/HelpPanel";
import "./styles/global.css";

function applyTheme(theme: "dark" | "light", accentColor: string | null) {
  document.documentElement.setAttribute("data-theme", theme);
  if (accentColor) {
    const r = parseInt(accentColor.slice(1, 3), 16);
    const g = parseInt(accentColor.slice(3, 5), 16);
    const b = parseInt(accentColor.slice(5, 7), 16);
    const alpha = theme === "light" ? 0.12 : 0.15;
    document.documentElement.style.setProperty("--color-accent", accentColor);
    document.documentElement.style.setProperty("--color-accent-dim", `rgba(${r},${g},${b},${alpha})`);
  }
}

const params = new URLSearchParams(window.location.search);
if (params.get("mode") === "help") {
  const root = document.getElementById("root")!;
  const renderHelp = () => ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <div className="app-shell">
        <HelpPanel onClose={() => window.close()} />
      </div>
    </React.StrictMode>
  );
  window.shortpath.getSettings().then((s) => {
    applyTheme(s.theme, s.accentColor);
    renderHelp();
  }).catch(() => renderHelp());
} else {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import HelpPanel from "./components/HelpPanel";
import "./styles/global.css";

const params = new URLSearchParams(window.location.search);
if (params.get("mode") === "help") {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <div className="app-shell">
        <HelpPanel onClose={() => window.close()} />
      </div>
    </React.StrictMode>
  );
} else {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
